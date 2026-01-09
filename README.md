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

## Manually backuping the database

To get the SQL backup from D1:
```bash
$ npx wrangler d1 export broulette-eu --remote --no-data --output=./schema.sql
$ npx wrangler d1 export broulette-eu --remote --no-schema --output=./data.sql
```

To import them:
```bash
$ npx wrangler d1 execute broulette-eu --remote --file=./schema.sql
$ npx wrangler d1 execute broulette-eu --remote --file=./data.sql
```
(pay attention that the data file is not always created in the most clean order, this can produces foreign key issues, even when deferring them)

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

* Haptics do not work on Android?
* Use KV for circuit breaker? https://community.cloudflare.com/t/session-management/46770/4
* Streaming HTTP during search
* Preference form:
    * Use localstorage
* Add some cache on Nominatim
* If the candidate found does not have known hours, keep it for later and try to find another one. If we really don't find a good candidate, then, take this one    
(unknown_opening_hours should be a rejection reason, but we still could pick it up as a fallback)