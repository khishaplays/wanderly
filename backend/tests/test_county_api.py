"""HTTP integration tests with no configured database import or network access."""
import importlib
import sys
from types import ModuleType
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
import sqlalchemy as sa
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.base import Base
from app.data.kenya_counties import COUNTIES
from app.models import Activity, County, Destination


class CountyApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Replace only the session-provider module while importing the real app.
        # app.database would otherwise load .env and create a configured engine.
        database = ModuleType("app.database")

        def unavailable_db():
            raise AssertionError("Configured database must never be used in tests")

        database.get_db = unavailable_db
        cls.get_db = staticmethod(unavailable_db)
        with patch.dict(sys.modules, {"app.database": database}):
            cls.app = importlib.import_module("app.main").app

    def setUp(self):
        self.engine = sa.create_engine(
            "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        with self.engine.begin() as connection:
            # Deliberately reverse insertion order and decouple IDs from codes.
            connection.execute(County.__table__.insert(), [
                dict(id=1000+i, code=code, name=name, slug=slug)
                for i, (code, name, slug) in enumerate(reversed(COUNTIES))
            ])
            connection.execute(Destination.__table__.insert(), dict(
                id=842, name="Existing", slug="existing", county="Nairobi",
                description="Keep", estimated_daily_cost=None,
            ))
            connection.execute(Activity.__table__.insert(), dict(
                id=901, destination_id=842, name="Existing walk", estimated_cost=0,
            ))

        def isolated_db():
            with Session(self.engine) as session:
                yield session

        self.app.dependency_overrides[self.get_db] = isolated_db
        self.client = TestClient(self.app)
        self.client.__enter__()
        self.statements = []
        sa.event.listen(self.engine, "before_cursor_execute", self.record_statement)

    def record_statement(self, connection, cursor, statement, parameters, context, executemany):
        self.statements.append(statement)

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.app.dependency_overrides.clear()
        self.engine.dispose()

    def test_list_all_counties_ordered_by_code_with_exact_schema(self):
        response = self.client.get("/api/counties")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "application/json")
        rows = response.json()
        self.assertEqual(len(rows), 47)
        self.assertEqual([r["code"] for r in rows], [f"{i:03}" for i in range(1, 48)])
        for row, (code, name, slug) in zip(rows, COUNTIES):
            self.assertEqual(set(row), {"id", "code", "name", "slug"})
            self.assertIsInstance(row["id"], int)
            self.assertEqual((row["code"], row["name"], row["slug"]), (code, name, slug))

    def test_every_county_detail_matches_list(self):
        for row in self.client.get("/api/counties").json():
            with self.subTest(slug=row["slug"]):
                response = self.client.get(f'/api/counties/{row["slug"]}')
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json(), row)

    def test_unknown_and_noncanonical_slugs_return_404(self):
        for slug in ("unknown", "047", "Nairobi", "nairobi", "Nairobi-City", "x' OR '1'='1"):
            with self.subTest(slug=slug):
                response = self.client.get(f"/api/counties/{slug}")
                self.assertEqual(response.status_code, 404)
                self.assertEqual(response.json(), {"detail": "County not found"})

    def test_empty_database_returns_empty_list_without_seeding(self):
        # Fixture mutation only; routes themselves never seed or write.
        with self.engine.begin() as connection:
            connection.execute(sa.delete(County))
        self.statements.clear()
        self.assertEqual(self.client.get("/api/counties").json(), [])
        self.assertEqual(self.client.get("/api/counties/nairobi-city").status_code, 404)
        self.assertTrue(all(s.lstrip().upper().startswith("SELECT") for s in self.statements))

    def test_only_get_routes_registered_once_and_openapi_schema(self):
        schema = self.client.get("/openapi.json").json()
        for path in ("/api/counties", "/api/counties/{county_slug}"):
            self.assertEqual(set(schema["paths"][path]), {"get"})
        fields = schema["components"]["schemas"]["CountyResponse"]
        self.assertEqual(set(fields["required"]), {"id", "code", "name", "slug"})
        # OpenAPI paths plus unique operation IDs detect accidental duplicate registration.
        operations = [operation["operationId"] for item in schema["paths"].values()
                      for operation in item.values()]
        self.assertEqual(len(operations), len(set(operations)))
        for method in ("post", "put", "patch", "delete"):
            for path in ("/api/counties", "/api/counties/nairobi-city"):
                self.assertEqual(getattr(self.client, method)(path).status_code, 405)

    def test_destination_endpoints_and_health_unchanged_and_requests_only_read(self):
        expected = dict(id=842, name="Existing", slug="existing", county="Nairobi",
                        region=None, description="Keep", tagline=None, estimated_daily_cost=None)
        self.assertEqual(self.client.get("/api/destinations").json(), [expected])
        detail = self.client.get("/api/destinations/842").json()
        self.assertEqual({k: v for k, v in detail.items() if k != "activities"}, expected)
        self.assertEqual(detail["activities"][0]["estimated_cost"], 0)
        self.assertEqual(self.client.get("/api/destinations/99999").status_code, 404)
        self.assertEqual(self.client.get("/api/health").status_code, 200)
        self.client.get("/api/counties")
        self.client.get("/api/counties/nairobi-city")
        self.assertTrue(self.statements)
        self.assertTrue(all(s.lstrip().upper().startswith("SELECT") for s in self.statements))


if __name__ == "__main__":
    unittest.main()
