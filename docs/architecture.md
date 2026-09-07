# Wanderly V1.0 — System Architecture

## 1. Overview

Wanderly is a full-stack web application built using a client-server
architecture.

The V1.0 system consists of:

- React + Vite frontend
- Flask REST API
- MySQL database

Future releases will introduce external APIs and Ollama without
changing the core architecture.

---

## 2. High-Level Architecture

User
↓
React + Vite
↓
HTTP / JSON
↓
Flask REST API
↓
Service / Business Logic
↓
MySQL

Future:

Flask
├── Maps API
├── Weather API
├── Currency API
└── Ollama

---

## 3. Frontend

The frontend is responsible for the user interface and client-side
interaction.

Technology:

- React
- Vite
- React Router
- CSS

Responsibilities:

- Render pages and components
- Handle navigation
- Manage forms
- Display destinations
- Search and filter destinations
- Display trips
- Build itineraries
- Display budgets
- Communicate with the Flask API
- Handle loading and error states

Planned structure:

frontend/
├── src/
│ ├── assets/
│ ├── components/
│ ├── layouts/
│ ├── pages/
│ ├── services/
│ ├── hooks/
│ ├── context/
│ ├── utils/
│ ├── styles/
│ ├── App.jsx
│ └── main.jsx
│
├── tests/
├── package.json
└── vite.config.js

---

## 4. Backend

The backend exposes the REST API and contains the application's
business logic.

Technology:

- Python
- Flask

Responsibilities:

- Authentication
- Authorization
- Input validation
- Destination management
- Trip management
- Itinerary management
- Bookmark management
- Review management
- Budget calculations
- Database communication
- External API integration in future releases

Planned structure:

backend/
├── app/
│ ├── models/
│ ├── routes/
│ ├── services/
│ ├── schemas/
│ ├── auth/
│ ├── integrations/
│ ├── utils/
│ ├── **init**.py
│ ├── config.py
│ └── extensions.py
│
├── tests/
├── migrations/
├── requirements.txt
├── .env.example
└── run.py

---

## 5. Database

MySQL provides persistent relational storage.

Core V1.0 entities:

- Users
- Destinations
- Activities
- Trips
- Itinerary Items
- Bookmarks
- Reviews

The database design is documented in:

docs/database.md

---

## 6. Communication

React does not communicate directly with MySQL.

Correct flow:

React
↓
HTTP request
↓
Flask API
↓
Business logic
↓
MySQL

Response:

MySQL
↓
Flask
↓
JSON
↓
React
↓
User Interface

Example:

GET /api/destinations

Flask responds:

[
{
"id": 1,
"name": "Diani Beach",
"country": "Kenya",
"category": "Beach"
}
]

React then renders the returned data.

---

## 7. REST API

Planned V1.0 endpoint groups:

/api/auth
/api/destinations
/api/activities
/api/trips
/api/bookmarks
/api/reviews

Example endpoints:

POST /api/auth/register
POST /api/auth/login

GET /api/destinations
GET /api/destinations/:id

GET /api/trips
POST /api/trips
GET /api/trips/:id
PATCH /api/trips/:id
DELETE /api/trips/:id

POST /api/trips/:id/items
PATCH /api/trips/:id/items/:itemId
DELETE /api/trips/:id/items/:itemId

GET /api/trips/:id/budget

GET /api/bookmarks
POST /api/bookmarks
DELETE /api/bookmarks/:id

GET /api/reviews
POST /api/reviews

---

## 8. Authentication

Authentication will be implemented through Flask.

Passwords must never be stored directly.

The backend stores:

password_hash

instead of:

password

Protected endpoints will require authentication.

Examples:

/api/trips
/api/bookmarks
/api/profile

Admin endpoints will additionally require the admin role.

---

## 9. Business Logic

Business logic should not be placed entirely inside route functions.

Example:

GET /api/trips/12/budget

Route
↓
Budget Service
↓
Retrieve itinerary items
↓
Calculate costs
↓
Return result

This keeps the application easier to test and maintain.

---

## 10. External APIs — V1.5

Future integrations:

- Maps
- Weather
- Currency conversion

The frontend should not contain private API secrets.

Where appropriate:

React
↓
Flask
↓
External API
↓
Flask normalizes response
↓
React

Integration-specific code will live inside:

backend/app/integrations/

---

## 11. Context-Aware Experiences — V2

Wanderly will later adapt its experience for:

- Leisure travelers
- Solo travelers
- Couples
- Families
- Groups
- International students
- Digital nomads
- Relocation

These modes extend the Wanderly core rather than becoming separate
applications.

---

## 12. AI — V3

Ollama will eventually provide personalized recommendations.

Planned flow:

User Preferences
↓
Wanderly Database
↓
Matching Destinations
↓
Matching Activities
↓
Budget Context
↓
Ollama
↓
Suggested Plan
↓
Validation
↓
User

AI output is advisory and editable.

The database remains the source of truth for Wanderly content.

---

## 13. Testing Architecture

Frontend:

- Vitest
- React Testing Library

Backend:

- Pytest

Critical workflow:

Register
↓
Login
↓
Explore
↓
Save Destination
↓
Create Trip
↓
Build Itinerary
↓
Calculate Budget

---

## 14. Deployment Architecture

Development:

React development server

- Flask development server
- Local MySQL

Production:

Deployed React frontend
↓
Deployed Flask API
↓
Managed MySQL database

GitHub Actions will later automate testing and deployment.

---

## 15. Security Principles

- Password hashing
- Authentication
- Authorization
- Ownership checks
- Server-side validation
- Environment variables
- No secrets committed to Git
- Safe database queries
- CORS configuration
- HTTPS in production
- Safe error responses
