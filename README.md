# BiteRoulette

A location-based React application that helps users find the perfect dining spot based on their current location, time preference, and distance range.

## Overview

This application acts as a randomization engine for restaurants. It aggregates restaurant data from various external sources to provide a unified profile. Users can search for dining options based on specific criteria (Dinner, Lunch, "Right Now") and interact with the results.

## Tech Stack

* **Framework:** React Router (framework mode)
* **Database:** PostgreSQL
* **ORM:** Prisma
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

This project uses **Prisma** for database management.

* **Update Schema:** If you modify `prisma/schema.prisma`, run:
    ```bash
    npm run prisma:generate
    ```

* **View Data:** To explore your data visually:
    ```bash
    npm run prisma:studio
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

* npx wrangler secret put BROULETTE_DATABASE_URL
* npx wrangler secret put BROULETTE_GOOGLE_PLACE_API_KEY
* npx wrangler secret put BROULETTE_TRIPADVISOR_API_KEY
* npx wrangler secret put BROULETTE_SESSION_SECRET

Use `npx wrangler secret put <KEY>` to create each secret.

## TODO

* "back to Lobby" is "fixed" while it should be absolute (wrongly placed on desktop)
* The "candidate page" is almost too long on my pixel 9a. (ex: Le Brazier)
* Haptics do not work on Android?
* Make it a PWA
* Use KV for circuit breaker? https://community.cloudflare.com/t/session-management/46770/4
* "back" does not work properly, the "candidate" page seems to be skipped
* Add a tag "unknown opening hours"
* Add indexes based on the actual calls
* Streaming HTTP during search
* Preference form:
    * Default values in preference form ("close" should be selected by default)
    * Use localstorage
* Add some cache on Nominatim