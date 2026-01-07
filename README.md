# BiteRoulette

A location-based React application that helps users find the perfect dining spot based on their current location, time preference, and distance range.

## Overview

This application acts as a randomization engine for restaurants. It aggregates restaurant data from various external sources to provide a unified profile. Users can search for dining options based on specific criteria (Dinner, Lunch, "Right Now") and interact with the results.

## Tech Stack

* **Framework:** React Router (framework mode)
* **ORM:** Drizzle
* **Database:** Cloudflare D1 (SQLite)
* **Runtime:** Cloudflare Workers
* **Styling:** Tailwind CSS

## Prerequisites

* Node.js (v18 or higher)
* npm or yarn
* A running PostgreSQL instance

## Run the application

```bash
npm run dev
```

## Database Management

This project uses **Drizzle** for database management.

* **Update Schema:** If you modify `schema.ts`, run:
    ```bash
    npm run db:gen
    ```

* **View Data:** To explore your data visually:
    ```bash
    npm run db:studio:local
    ```

## Source of data

To find "addresses":
* Nominatim
* Photon

To discover nearby restaurants:
* Overpass

To fetch and refine restaurant details:
* Google Place
* TripAdvisor

## Generate `BROULETTE_SESSION_SECRET`

A secret key must be defined in `BROULETTE_SESSION_SECRET`
```
$ openssl rand -hex 32
```

## Mandatory environment variables

```
BROULETTE_NOMINATIM_ENABLED=true
BROULETTE_PHOTON_ENABLED=true
BROULETTE_OVERPASS_ENABLED=true
BROULETTE_GOOGLE_PLACE_ENABLED=true
BROULETTE_TRIPADVISOR_ENABLED=true
```

## Secrets

* npx wrangler secret rm BROULETTE_DATABASE_URL
* npx wrangler secret put BROULETTE_GOOGLE_PLACE_API_KEY
* npx wrangler secret put BROULETTE_TRIPADVISOR_API_KEY
* npx wrangler secret put BROULETTE_SESSION_SECRET

Use `npx wrangler secret put <KEY>` to create each secret.

## TODO

* The "candidate page" is almost too long on my pixel 9a. (ex: Le Brazier)
* Haptics do not work on Android?
* Use KV for circuit breaker? https://community.cloudflare.com/t/session-management/46770/4
* "back" does not work properly, the "candidate" page seems to be skipped
* Streaming HTTP during search
* Preference form:
    * Use localstorage
* Add some cache on Nominatim