# Wanderly V1.0 — Database Design

## Overview

Wanderly uses a relational database to manage users, destinations,
activities, saved destinations, trips, itineraries, budgets, and reviews.

The V1.0 database will use MySQL.

---

## 1. Users

Stores registered Wanderly users.

| Column        | Type         | Rules                       |
| ------------- | ------------ | --------------------------- |
| id            | INT          | Primary Key, Auto Increment |
| name          | VARCHAR(100) | Not Null                    |
| email         | VARCHAR(255) | Unique, Not Null            |
| password_hash | VARCHAR(255) | Not Null                    |
| role          | VARCHAR(20)  | Default: user               |
| created_at    | DATETIME     | Not Null                    |

Relationships:

- User has many trips.
- User has many bookmarks.
- User has many reviews.

---

## 2. Destinations

Stores destinations available on Wanderly.

| Column               | Type          | Rules                       |
| -------------------- | ------------- | --------------------------- |
| id                   | INT           | Primary Key, Auto Increment |
| name                 | VARCHAR(150)  | Not Null                    |
| country              | VARCHAR(100)  | Not Null                    |
| region               | VARCHAR(100)  | Nullable                    |
| description          | TEXT          | Not Null                    |
| category             | VARCHAR(50)   | Not Null                    |
| latitude             | DECIMAL(9,6)  | Nullable                    |
| longitude            | DECIMAL(9,6)  | Nullable                    |
| estimated_daily_cost | DECIMAL(10,2) | Nullable                    |
| created_at           | DATETIME      | Not Null                    |

Examples:

- Diani Beach, Kenya
- Zanzibar, Tanzania
- Santorini, Greece
- Tokyo, Japan
- Cape Town, South Africa

---

## 3. Activities

Stores activities associated with destinations.

| Column           | Type          | Rules                       |
| ---------------- | ------------- | --------------------------- |
| id               | INT           | Primary Key, Auto Increment |
| destination_id   | INT           | Foreign Key                 |
| name             | VARCHAR(150)  | Not Null                    |
| description      | TEXT          | Nullable                    |
| category         | VARCHAR(50)   | Nullable                    |
| estimated_cost   | DECIMAL(10,2) | Default: 0                  |
| duration_minutes | INT           | Nullable                    |

Relationship:

Destination 1 → many Activities

---

## 4. Trips

Stores trips created by users.

| Column         | Type          | Rules                       |
| -------------- | ------------- | --------------------------- |
| id             | INT           | Primary Key, Auto Increment |
| user_id        | INT           | Foreign Key                 |
| destination_id | INT           | Foreign Key                 |
| name           | VARCHAR(150)  | Not Null                    |
| start_date     | DATE          | Not Null                    |
| end_date       | DATE          | Not Null                    |
| travelers      | INT           | Default: 1                  |
| target_budget  | DECIMAL(12,2) | Nullable                    |
| currency       | VARCHAR(3)    | Default: USD                |
| created_at     | DATETIME      | Not Null                    |

Relationships:

User 1 → many Trips

Destination 1 → many Trips

---

## 5. Itinerary Items

Stores activities and custom plans inside a trip.

| Column         | Type          | Rules                       |
| -------------- | ------------- | --------------------------- |
| id             | INT           | Primary Key, Auto Increment |
| trip_id        | INT           | Foreign Key                 |
| activity_id    | INT           | Foreign Key, Nullable       |
| title          | VARCHAR(150)  | Not Null                    |
| day_number     | INT           | Not Null                    |
| position       | INT           | Not Null                    |
| estimated_cost | DECIMAL(10,2) | Default: 0                  |
| notes          | TEXT          | Nullable                    |

Relationship:

Trip 1 → many Itinerary Items

An itinerary item may reference an existing activity or contain a
custom user-created activity.

---

## 6. Bookmarks

Connects users with destinations they have saved.

| Column         | Type     | Rules                       |
| -------------- | -------- | --------------------------- |
| id             | INT      | Primary Key, Auto Increment |
| user_id        | INT      | Foreign Key                 |
| destination_id | INT      | Foreign Key                 |
| created_at     | DATETIME | Not Null                    |

Constraint:

(user_id, destination_id) must be unique.

This prevents the same user from saving the same destination twice.

---

## 7. Reviews

Stores destination ratings and reviews.

| Column         | Type        | Rules                       |
| -------------- | ----------- | --------------------------- |
| id             | INT         | Primary Key, Auto Increment |
| user_id        | INT         | Foreign Key                 |
| destination_id | INT         | Foreign Key                 |
| rating         | INT         | Not Null                    |
| comment        | TEXT        | Nullable                    |
| status         | VARCHAR(20) | Default: published          |
| created_at     | DATETIME    | Not Null                    |

Rating must be between:

1–5

---

# Relationships

User
├── Trips
├── Bookmarks
└── Reviews

Destination
├── Activities
├── Trips
├── Bookmarks
└── Reviews

Trip
└── Itinerary Items

Activity
└── Itinerary Items

## Destinations

Stores destinations located within Kenya.

| Column               | Type          | Rules                       |
| -------------------- | ------------- | --------------------------- |
| id                   | INT           | Primary Key, Auto Increment |
| name                 | VARCHAR(150)  | Not Null                    |
| county               | VARCHAR(100)  | Not Null                    |
| region               | VARCHAR(100)  | Nullable                    |
| description          | TEXT          | Not Null                    |
| category             | VARCHAR(50)   | Not Null                    |
| latitude             | DECIMAL(9,6)  | Nullable                    |
| longitude            | DECIMAL(9,6)  | Nullable                    |
| estimated_daily_cost | DECIMAL(10,2) | Nullable                    |
| image_url            | VARCHAR(500)  | Nullable                    |
| created_at           | DATETIME      | Not Null                    |

Examples:

- Nairobi — Nairobi County
- Diani Beach — Kwale County
- Maasai Mara — Narok County
- Mombasa — Mombasa County
- Watamu — Kilifi County
- Lamu — Lamu County
- Naivasha — Nakuru County
- Amboseli — Kajiado County
- Nanyuki — Laikipia County
  Wanderly is a full-stack Kenya travel planning web application designed
  primarily for international visitors.

The system provides a React user interface, Flask REST API, and MySQL
database containing Kenyan destinations, activities, trips, itineraries,
budgets, bookmarks, reviews, and visitor-oriented travel information.

- Leisure tourists
- Safari travelers
- Solo travelers
- Couples
- Families
- Groups
- International students
- Business travelers
- Digital nomads
- Long-stay visitors
