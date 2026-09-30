from app import create_app
from app.extensions import db
from app.models import Destination, Activity


app = create_app()


with app.app_context():
    Activity.query.delete()
    Destination.query.delete()

    destinations = [
        Destination(
            name="Maasai Mara",
            slug="maasai-mara",
            county="Narok",
            region="Rift Valley",
            tagline="Where the wild still rules.",
            description=(
                "Explore sweeping savannahs, remarkable wildlife "
                "and one of Kenya's most iconic safari landscapes."
            ),
            estimated_daily_cost=18000,
        ),
        Destination(
            name="Diani Beach",
            slug="diani-beach",
            county="Kwale",
            region="Coast",
            tagline="Barefoot days on the Kenyan coast.",
            description=(
                "White sand, warm Indian Ocean waters and a mix "
                "of relaxation, food and coastal adventure."
            ),
            estimated_daily_cost=10000,
        ),
        Destination(
            name="Nairobi",
            slug="nairobi",
            county="Nairobi",
            region="Nairobi",
            tagline="Wildlife meets city life.",
            description=(
                "Kenya's capital blends food, culture, creativity, "
                "nightlife and wildlife experiences."
            ),
            estimated_daily_cost=8500,
        ),
        Destination(
            name="Lamu",
            slug="lamu",
            county="Lamu",
            region="Coast",
            tagline="Slow down. Wander differently.",
            description=(
                "Historic streets, Swahili culture, dhow sailing "
                "and a slower rhythm along Kenya's northern coast."
            ),
            estimated_daily_cost=9000,
        ),
        Destination(
            name="Naivasha",
            slug="naivasha",
            county="Nakuru",
            region="Rift Valley",
            tagline="Lakes, cliffs and weekend escapes.",
            description=(
                "Discover Lake Naivasha, wildlife, hiking and "
                "dramatic Rift Valley landscapes."
            ),
            estimated_daily_cost=8000,
        ),
        Destination(
            name="Mombasa",
            slug="mombasa",
            county="Mombasa",
            region="Coast",
            tagline="Coastal history with city energy.",
            description=(
                "Discover Swahili heritage, coastal food, beaches, "
                "historic sites and lively city experiences."
            ),
            estimated_daily_cost=9000,
        ),
    ]

    db.session.add_all(destinations)
    db.session.commit()

    activities = [
        Activity(
            destination_id=destinations[0].id,
            name="Game Drive",
            category="Safari",
            description="Explore the Maasai Mara and look for wildlife.",
            estimated_cost=6500,
            duration="3–4 hours",
        ),
        Activity(
            destination_id=destinations[0].id,
            name="Maasai Cultural Experience",
            category="Culture",
            description="Learn about Maasai traditions and community life.",
            estimated_cost=2500,
            duration="2 hours",
        ),
        Activity(
            destination_id=destinations[1].id,
            name="Beach Day",
            category="Beach",
            description="Relax along Diani's white-sand coastline.",
            estimated_cost=0,
            duration="Flexible",
        ),
        Activity(
            destination_id=destinations[1].id,
            name="Snorkelling",
            category="Adventure",
            description="Discover marine life along Kenya's southern coast.",
            estimated_cost=4000,
            duration="2–3 hours",
        ),
        Activity(
            destination_id=destinations[2].id,
            name="Nairobi National Park",
            category="Wildlife",
            description="Experience wildlife close to Kenya's capital.",
            estimated_cost=5000,
            duration="Half day",
        ),
    ]

    db.session.add_all(activities)
    db.session.commit()

    print("Wanderly database seeded successfully 🌍")
    print(f"{len(destinations)} destinations added")
    print(f"{len(activities)} activities added")