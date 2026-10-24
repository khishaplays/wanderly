"""Add county reference data and nullable destination county association.

Revision ID: c47f20261025
Revises: f1be5db7b94e

Frozen data snapshot: see docs/sprint-2-counties.md for official sources.
Do not import mutable application datasets into historical migrations.
"""
from alembic import op
import sqlalchemy as sa

revision = "c47f20261025"
down_revision = "f1be5db7b94e"
branch_labels = None
depends_on = None

COUNTIES = (
    ('001', 'Mombasa', 'mombasa'),
    ('002', 'Kwale', 'kwale'),
    ('003', 'Kilifi', 'kilifi'),
    ('004', 'Tana River', 'tana-river'),
    ('005', 'Lamu', 'lamu'),
    ('006', 'Taita/Taveta', 'taita-taveta'),
    ('007', 'Garissa', 'garissa'),
    ('008', 'Wajir', 'wajir'),
    ('009', 'Mandera', 'mandera'),
    ('010', 'Marsabit', 'marsabit'),
    ('011', 'Isiolo', 'isiolo'),
    ('012', 'Meru', 'meru'),
    ('013', 'Tharaka-Nithi', 'tharaka-nithi'),
    ('014', 'Embu', 'embu'),
    ('015', 'Kitui', 'kitui'),
    ('016', 'Machakos', 'machakos'),
    ('017', 'Makueni', 'makueni'),
    ('018', 'Nyandarua', 'nyandarua'),
    ('019', 'Nyeri', 'nyeri'),
    ('020', 'Kirinyaga', 'kirinyaga'),
    ('021', "Murang'a", 'muranga'),
    ('022', 'Kiambu', 'kiambu'),
    ('023', 'Turkana', 'turkana'),
    ('024', 'West Pokot', 'west-pokot'),
    ('025', 'Samburu', 'samburu'),
    ('026', 'Trans Nzoia', 'trans-nzoia'),
    ('027', 'Uasin Gishu', 'uasin-gishu'),
    ('028', 'Elgeyo/Marakwet', 'elgeyo-marakwet'),
    ('029', 'Nandi', 'nandi'),
    ('030', 'Baringo', 'baringo'),
    ('031', 'Laikipia', 'laikipia'),
    ('032', 'Nakuru', 'nakuru'),
    ('033', 'Narok', 'narok'),
    ('034', 'Kajiado', 'kajiado'),
    ('035', 'Kericho', 'kericho'),
    ('036', 'Bomet', 'bomet'),
    ('037', 'Kakamega', 'kakamega'),
    ('038', 'Vihiga', 'vihiga'),
    ('039', 'Bungoma', 'bungoma'),
    ('040', 'Busia', 'busia'),
    ('041', 'Siaya', 'siaya'),
    ('042', 'Kisumu', 'kisumu'),
    ('043', 'Homa Bay', 'homa-bay'),
    ('044', 'Migori', 'migori'),
    ('045', 'Kisii', 'kisii'),
    ('046', 'Nyamira', 'nyamira'),
    ('047', 'Nairobi City', 'nairobi-city'),
)

COUNTY_ALIASES = {
    'baringo': '030',
    'bomet': '036',
    'bungoma': '039',
    'busia': '040',
    'elgeyo marakwet': '028',
    'elgeyo-marakwet': '028',
    'elgeyo/marakwet': '028',
    'embu': '014',
    'garissa': '007',
    'homa bay': '043',
    'isiolo': '011',
    'kajiado': '034',
    'kakamega': '037',
    'kericho': '035',
    'kiambu': '022',
    'kilifi': '003',
    'kirinyaga': '020',
    'kisii': '045',
    'kisumu': '042',
    'kitui': '015',
    'kwale': '002',
    'laikipia': '031',
    'lamu': '005',
    'machakos': '016',
    'makueni': '017',
    'mandera': '009',
    'marsabit': '010',
    'meru': '012',
    'migori': '044',
    'mombasa': '001',
    'mombasa county': '001',
    "murang'a": '021',
    'murang’a': '021',
    'nairobi': '047',
    'nairobi city': '047',
    'nairobi city county': '047',
    'nairobi county': '047',
    'nakuru': '032',
    'nandi': '029',
    'narok': '033',
    'nyamira': '046',
    'nyandarua': '018',
    'nyeri': '019',
    'samburu': '025',
    'siaya': '041',
    'taita taveta': '006',
    'taita-taveta': '006',
    'taita/taveta': '006',
    'taita–taveta': '006',
    'tana river': '004',
    'tharaka nithi': '013',
    'tharaka-nithi': '013',
    'trans nzoia': '026',
    'trans-nzoia': '026',
    'turkana': '023',
    'uasin gishu': '027',
    'vihiga': '038',
    'wajir': '008',
    'west pokot': '024',
}

BACKFILL_SQL = """
UPDATE destinations
SET county_id = (SELECT id FROM counties WHERE code = :code)
WHERE county_id IS NULL
  AND lower(trim(county)) = :alias
"""


def upgrade():
    counties = op.create_table(
        "counties",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(3), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.UniqueConstraint("code"),
        sa.UniqueConstraint("slug"),
        sa.CheckConstraint(
            "code IN ("
            "'001', '002', '003', '004', '005', '006', '007', '008', '009', '010', "
            "'011', '012', '013', '014', '015', '016', '017', '018', '019', '020', "
            "'021', '022', '023', '024', '025', '026', '027', '028', '029', '030', "
            "'031', '032', '033', '034', '035', '036', '037', '038', '039', '040', "
            "'041', '042', '043', '044', '045', '046', '047')",
            name="ck_counties_official_code",
        ),
        sa.CheckConstraint("length(trim(name)) > 0", name="ck_counties_name_nonempty"),
        sa.CheckConstraint("length(trim(slug)) > 0 AND slug = lower(trim(slug))",
                           name="ck_counties_slug_normalized"),
    )
    op.create_index("uq_counties_normalized_name", "counties",
                    [sa.text("lower(trim(name))")], unique=True)
    op.bulk_insert(counties, [
        {"code": code, "name": name, "slug": slug}
        for code, name, slug in COUNTIES
    ])
    op.add_column("destinations", sa.Column("county_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_destinations_county_id_counties", "destinations", "counties",
        ["county_id"], ["id"], ondelete="RESTRICT",
    )
    op.create_index("ix_destinations_county_id", "destinations", ["county_id"])
    for alias, code in COUNTY_ALIASES.items():
        op.execute(sa.text(BACKFILL_SQL).bindparams(alias=alias, code=code))


def downgrade():
    # Only the new association and reference table are removed.
    op.drop_index("ix_destinations_county_id", table_name="destinations")
    op.drop_constraint("fk_destinations_county_id_counties", "destinations", type_="foreignkey")
    op.drop_column("destinations", "county_id")
    op.drop_index("uq_counties_normalized_name", table_name="counties")
    op.drop_table("counties")
