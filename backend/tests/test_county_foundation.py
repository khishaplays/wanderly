"""No Alembic entry points or configured database engines are imported/run.

Only model DDL and the frozen backfill DML are tested on in-memory SQLite.
Migration structure is checked statically; PostgreSQL execution needs approval.
"""
import ast
from pathlib import Path
import sys
import unittest

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.schema import CreateTable, CreateIndex

from app.base import Base
from app.data.kenya_counties import COUNTIES, COUNTY_ALIASES
from app.models import Activity, County, Destination
from app.schemas.destination import DestinationResponse, DestinationDetailResponse


MIGRATION = Path(__file__).resolve().parents[1] / "migrations/versions/c47f20261025_add_county_foundation.py"
TREE = ast.parse(MIGRATION.read_text())
CONSTANTS = {
    node.targets[0].id: ast.literal_eval(node.value)
    for node in TREE.body
    if isinstance(node, ast.Assign)
}


class CountyFoundationTests(unittest.TestCase):
    def setUp(self):
        self.engine = sa.create_engine("sqlite:///:memory:")
        with self.engine.connect() as connection:
            connection.exec_driver_sql("PRAGMA foreign_keys=ON")
        Base.metadata.create_all(self.engine)
        with self.engine.begin() as connection:
            connection.execute(County.__table__.insert(), [
                dict(code=code, name=name, slug=slug) for code, name, slug in COUNTIES
            ])

    def tearDown(self):
        self.engine.dispose()

    def test_model_imports_do_not_load_configured_database(self):
        self.assertNotIn("app.database", sys.modules)

    def test_all_47_codes_and_reference_identity(self):
        self.assertEqual([row[0] for row in COUNTIES], [f"{i:03}" for i in range(1, 48)])
        self.assertEqual(len({row[1].strip().lower() for row in COUNTIES}), 47)
        self.assertEqual(len({row[2] for row in COUNTIES}), 47)
        expected = {"005": "Lamu", "006": "Taita/Taveta", "020": "Kirinyaga",
                    "021": "Murang'a", "026": "Trans Nzoia", "028": "Elgeyo/Marakwet",
                    "032": "Nakuru", "033": "Narok", "047": "Nairobi City"}
        actual = {code: name for code, name, _ in COUNTIES}
        for code, name in expected.items():
            self.assertEqual(actual[code], name)
        self.assertTrue(set(COUNTY_ALIASES.values()) <= set(actual))

    def test_migration_snapshot_matches_reviewed_dataset(self):
        self.assertEqual(CONSTANTS["COUNTIES"], COUNTIES)
        self.assertEqual(CONSTANTS["COUNTY_ALIASES"], COUNTY_ALIASES)
        self.assertEqual(CONSTANTS["down_revision"], "f1be5db7b94e")

    def test_all_official_names_match_the_first_schedule_order(self):
        # Independent reviewed oracle: detects swaps that snapshot parity cannot.
        expected = (
            "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita/Taveta",
            "Garissa", "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru",
            "Tharaka-Nithi", "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua",
            "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot",
            "Samburu", "Trans Nzoia", "Uasin Gishu", "Elgeyo/Marakwet", "Nandi",
            "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho", "Bomet",
            "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya", "Kisumu", "Homa Bay",
            "Migori", "Kisii", "Nyamira", "Nairobi City",
        )
        self.assertEqual(tuple(name for _, name, _ in COUNTIES), expected)
        for code, name, _ in COUNTIES:
            self.assertEqual(COUNTY_ALIASES[name.lower()], code)

    def test_checked_in_seed_counties_and_api_payload_survive_backfill(self):
        # Parse only: importing seed.py would open the configured database.
        seed = ast.parse((MIGRATION.parents[2] / "seed.py").read_text())
        rows = [{k.arg: ast.literal_eval(k.value) for k in node.keywords}
                for node in ast.walk(seed) if isinstance(node, ast.Call)
                and isinstance(node.func, ast.Name) and node.func.id == "Destination"]
        self.assertEqual(len(rows), 6)
        unmatched = [row["county"] for row in rows
                     if row["county"].strip(" ").lower() not in COUNTY_ALIASES]
        self.assertEqual(unmatched, [])
        with Session(self.engine) as session:
            for i, row in enumerate(rows):
                session.add(Destination(id=7100+i, **row))
            session.flush()
            destinations = session.scalars(sa.select(Destination).order_by(Destination.id)).all()
            before_list = [DestinationResponse.model_validate(d).model_dump(mode="json") for d in destinations]
            before_detail = [DestinationDetailResponse.model_validate(d).model_dump(mode="json") for d in destinations]
            for alias, code in CONSTANTS["COUNTY_ALIASES"].items():
                session.execute(sa.text(CONSTANTS["BACKFILL_SQL"]), dict(alias=alias, code=code))
            session.expire_all()
            after = session.scalars(sa.select(Destination).order_by(Destination.id)).all()
            self.assertEqual([DestinationResponse.model_validate(d).model_dump(mode="json") for d in after], before_list)
            self.assertEqual([DestinationDetailResponse.model_validate(d).model_dump(mode="json") for d in after], before_detail)
            for d in after:
                self.assertIsNotNone(d.county_record)
                self.assertEqual(d.county_record.code, COUNTY_ALIASES[d.county.lower()])

    def test_parent_revision_and_legacy_column_compatibility(self):
        parent = ast.parse((MIGRATION.parent / "f1be5db7b94e_create_destinations_and_activities_.py").read_text())
        assignments = {n.target.id: ast.literal_eval(n.value) for n in parent.body
                       if isinstance(n, ast.AnnAssign)}
        self.assertEqual(assignments["revision"], CONSTANTS["down_revision"])
        self.assertIsNone(assignments["down_revision"])
        tables = {ast.literal_eval(n.args[0]): n for n in ast.walk(parent)
                  if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute)
                  and n.func.attr == "create_table"}
        for name in ("destinations", "activities"):
            old_columns = {ast.literal_eval(n.args[0]) for n in tables[name].args[1:]
                           if isinstance(n, ast.Call) and n.func.attr == "Column"}
            new_columns = set(Base.metadata.tables[name].columns.keys())
            self.assertEqual(new_columns - old_columns, {"county_id"} if name == "destinations" else set())
            self.assertFalse(old_columns - new_columns)

    def test_exact_code_domain_and_migration_constraint_parity(self):
        constraint = next(c for c in County.__table__.constraints
                          if c.name == "ck_counties_official_code")
        migration_constraint = next(n for n in ast.walk(TREE)
                                    if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute)
                                    and n.func.attr == "CheckConstraint"
                                    and any(k.arg == "name" and ast.literal_eval(k.value) == constraint.name
                                            for k in n.keywords))
        self.assertEqual(ast.literal_eval(migration_constraint.args[0]), str(constraint.sqltext))
        # An independent probe isolates code checks from the 47 seeded UNIQUE codes.
        probe = sa.Table("code_probe", sa.MetaData(), sa.Column("code", sa.String(3), nullable=False),
                         sa.CheckConstraint(str(constraint.sqltext)))
        probe.create(self.engine)
        for i in range(1000):
            code = f"{i:03}"
            with self.subTest(code=code):
                if 1 <= i <= 47:
                    with self.engine.begin() as connection:
                        connection.execute(probe.insert(), {"code": code})
                else:
                    with self.assertRaises(IntegrityError), self.engine.begin() as connection:
                        connection.execute(probe.insert(), {"code": code})
        for code in (None, "", "1", "01", "0001", "001 ", " 001", "00x", "0０1", "-01", "1.0"):
            with self.subTest(code=code), self.assertRaises(IntegrityError), self.engine.begin() as connection:
                connection.execute(probe.insert(), {"code": code})

    def test_every_explicit_alias_preserves_original_text(self):
        with self.engine.begin() as connection:
            ids = dict(connection.execute(sa.select(County.code, County.id)).all())
            for i, (alias, code) in enumerate(COUNTY_ALIASES.items()):
                label = f"  {alias.upper()}  "
                connection.execute(Destination.__table__.insert(), dict(
                    id=2000+i, name="Existing", slug=f"alias-{i}", county=label, description="Keep"))
            for alias, code in CONSTANTS["COUNTY_ALIASES"].items():
                connection.execute(sa.text(CONSTANTS["BACKFILL_SQL"]), dict(alias=alias, code=code))
            for i, (alias, code) in enumerate(COUNTY_ALIASES.items()):
                row = connection.execute(sa.select(Destination.county, Destination.county_id)
                                         .where(Destination.id == 2000+i)).one()
                self.assertEqual(tuple(row), (f"  {alias.upper()}  ", ids[code]))

    def test_missing_unknown_and_ambiguous_values_are_not_guessed(self):
        # Actual legacy county is NOT NULL. A temporary probe additionally verifies
        # defensive handling of SQL NULL from a malformed/older external dataset.
        with self.engine.begin() as connection:
            connection.exec_driver_sql("CREATE TEMP TABLE county_input_probe (county TEXT, county_id INTEGER)")
            labels = [None, "", "   ", "Unknown", "N/A", "Nakuru County", "Nairob",
                      "Nairobi/Kiambu", "Coast", "Naivasha", "047", "\tNairobi\t", "Nairobi\n"]
            for label in labels:
                connection.execute(sa.text("INSERT INTO county_input_probe (county) VALUES (:label)"),
                                   {"label": label})
            statement = sa.text(CONSTANTS["BACKFILL_SQL"].replace("UPDATE destinations", "UPDATE county_input_probe"))
            for alias, code in CONSTANTS["COUNTY_ALIASES"].items():
                connection.execute(statement, dict(alias=alias, code=code))
            self.assertEqual(connection.execute(sa.text("SELECT county, county_id FROM county_input_probe")).all(),
                             [(label, None) for label in labels])

    def test_nullable_county_relationship_and_legacy_api(self):
        with Session(self.engine) as session:
            destination = Destination(id=6001, name="Existing", slug="unassigned", county="Unknown",
                                      description="Keep", county_id=None)
            session.add(destination)
            session.commit()
            session.expire_all()
            saved = session.get(Destination, 6001)
            self.assertIsNone(saved.county_id)
            self.assertIsNone(saved.county_record)
            self.assertEqual(DestinationResponse.model_validate(saved).county, "Unknown")
            saved.county_record = session.scalar(sa.select(County).where(County.code == "001"))
            session.commit()
            saved.county_record = None
            session.commit()
            self.assertIsNone(saved.county_id)
            self.assertEqual(saved.county, "Unknown")

    def test_upgrade_is_additive_and_downgrade_targets_only_new_structure(self):
        functions = {n.name: n for n in TREE.body if isinstance(n, ast.FunctionDef)}
        calls = lambda fn: [n for n in ast.walk(fn) if isinstance(n, ast.Call)
                           and isinstance(n.func, ast.Attribute)
                           and isinstance(n.func.value, ast.Name) and n.func.value.id == "op"]
        upgrade = calls(functions["upgrade"])
        self.assertEqual({n.func.attr for n in upgrade}, {
            "create_table", "create_index", "bulk_insert", "add_column",
            "create_foreign_key", "execute",
        })
        add = next(n for n in upgrade if n.func.attr == "add_column")
        self.assertEqual(ast.literal_eval(add.args[0]), "destinations")
        self.assertEqual(ast.literal_eval(add.args[1].args[0]), "county_id")
        self.assertTrue(next(ast.literal_eval(k.value) for k in add.args[1].keywords
                             if k.arg == "nullable"))
        drop = calls(functions["downgrade"])
        self.assertEqual([ast.literal_eval(n.args[0]) for n in drop
                          if n.func.attr == "drop_table"], ["counties"])
        self.assertEqual([(ast.literal_eval(n.args[0]), ast.literal_eval(n.args[1]))
                          for n in drop if n.func.attr == "drop_column"],
                         [("destinations", "county_id")])

    def test_postgresql_ddl_compiles_without_connection(self):
        dialect = postgresql.dialect()
        ddl = str(CreateTable(County.__table__).compile(dialect=dialect))
        self.assertIn("UNIQUE (code)", ddl)
        self.assertIn("UNIQUE (slug)", ddl)
        self.assertIn("ck_counties_official_code", ddl)
        destination_ddl = str(CreateTable(Destination.__table__).compile(dialect=dialect))
        self.assertIn("REFERENCES counties (id) ON DELETE RESTRICT", destination_ddl)
        indexes = " ".join(str(CreateIndex(i).compile(dialect=dialect))
                           for table in (County.__table__, Destination.__table__)
                           for i in table.indexes)
        self.assertIn("uq_counties_normalized_name", indexes)
        self.assertIn("ix_destinations_county_id", indexes)

    def test_uniqueness_and_invalid_county_data(self):
        invalid = [
            dict(code="001", name="Other", slug="other"),
            dict(code="048", name="Other", slug="other"),
            dict(code="00x", name="Other", slug="other"),
            dict(code="01", name="Other", slug="other"),
            dict(code="000", name="Other", slug="other"),
            dict(code="099", name="Other", slug="other"),
            dict(code="002", name="Other", slug="mombasa"),
        ]
        for values in invalid:
            with self.subTest(values=values), self.assertRaises(IntegrityError):
                with self.engine.begin() as connection:
                    connection.execute(County.__table__.insert(), values)
        # Update a valid row to isolate normalized-name and slug checks from code uniqueness.
        for changes in ({"name": " MOMBASA "}, {"name": " "}, {"slug": "mombasa"},
                        {"slug": "Kwale"}, {"slug": ""}, {"code": None}, {"name": None}):
            with self.subTest(changes=changes), self.assertRaises(IntegrityError):
                with self.engine.begin() as connection:
                    connection.execute(sa.update(County).where(County.code == "002").values(**changes))

    def test_backfill_preserves_every_legacy_value_and_activity(self):
        labels = ["Narok", "Kwale", "Nairobi", "Lamu", "Nakuru", "Mombasa",
                  "  NAIROBI  ", "Murang’a", "Taita-Taveta", "Elgeyo-Marakwet",
                  "Trans-Nzoia", "Unknown", "", "Nairobi City County"]
        with self.engine.begin() as connection:
            for i, label in enumerate(labels):
                connection.execute(Destination.__table__.insert(), dict(
                    id=800+i, name=f"Existing {i}", slug=f"existing-{i}", county=label,
                    description="Keep exactly", estimated_daily_cost=[None, 0, 8500.5][i % 3],
                ))
            connection.execute(Activity.__table__.insert(), dict(
                id=900, destination_id=800, name="Existing activity", estimated_cost=None,
            ))
            before = [dict(row) for row in connection.execute(sa.select(Destination).order_by(Destination.id)).mappings()]
            activities_before = list(connection.execute(sa.select(Activity)).mappings())
            statement = sa.text(CONSTANTS["BACKFILL_SQL"])
            for alias, code in CONSTANTS["COUNTY_ALIASES"].items():
                connection.execute(statement, dict(alias=alias, code=code))
            after = [dict(row) for row in connection.execute(sa.select(Destination).order_by(Destination.id)).mappings()]
            self.assertEqual(len(before), len(after))
            ids = dict(connection.execute(sa.select(County.code, County.id)).all())
            expected_codes = ["033", "002", "047", "005", "032", "001", "047",
                              "021", "006", "028", "026", None, None, "047"]
            for old, new, code in zip(before, after, expected_codes):
                self.assertEqual(new.pop("county_id"), ids.get(code))
                old.pop("county_id")
                self.assertEqual(old, new)
            self.assertEqual(activities_before, list(connection.execute(sa.select(Activity)).mappings()))
            # Repeat DML: existing assignments must never be overwritten, even if legacy text changes.
            connection.execute(sa.update(Destination).where(Destination.id == 800).values(county="Kwale"))
            for alias, code in CONSTANTS["COUNTY_ALIASES"].items():
                connection.execute(statement, dict(alias=alias, code=code))
            self.assertEqual(connection.scalar(sa.select(Destination.county_id)
                                               .where(Destination.id == 800)), ids["033"])

    def test_fk_restriction_and_api_schema_compatibility(self):
        with Session(self.engine) as session:
            county = session.scalar(sa.select(County).where(County.code == "047"))
            destination = Destination(id=842, name="Existing", slug="existing", county="Nairobi",
                                      description="Preserved", county_record=county)
            destination.activities = [Activity(id=901, name="Walk", estimated_cost=0)]
            session.add(destination)
            session.commit()
            expected = dict(id=842, name="Existing", slug="existing", county="Nairobi",
                            region=None, description="Preserved", tagline=None, estimated_daily_cost=None)
            self.assertEqual(DestinationResponse.model_validate(destination).model_dump(), expected)
            detail = DestinationDetailResponse.model_validate(destination).model_dump()
            self.assertEqual({k: v for k, v in detail.items() if k != "activities"}, expected)
            self.assertEqual(detail["activities"][0]["destination_id"], 842)
            self.assertEqual(detail["activities"][0]["estimated_cost"], 0)
            session.delete(county)
            with self.assertRaises(IntegrityError):
                session.commit()
            session.rollback()
            self.assertIsNotNone(session.get(Destination, 842))
            self.assertIsNotNone(session.get(Activity, 901))
        with self.assertRaises(IntegrityError), self.engine.begin() as connection:
            connection.execute(sa.update(Destination).values(county_id=99999))


if __name__ == "__main__":
    unittest.main()
