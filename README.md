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


## Build optimization

For now (2026-01-06), the build ends with this bundle:
```
> build
> react-router build

Using Vite Environment API (experimental)
vite v7.3.0 building client environment for production...
✓ 5163 modules transformed.
Generated an empty chunk: "_.api.address-searches".
Generated an empty chunk: "_.api.health".
build/client/.vite/manifest.json                                               4.22 kB │ gzip:  0.66 kB
build/client/assets/root-mXnUP3Qy.css                                         54.39 kB │ gzip:  9.76 kB
build/client/assets/_.api.address-searches-l0sNRNKZ.js                         0.00 kB │ gzip:  0.02 kB
build/client/assets/_.api.health-l0sNRNKZ.js                                   0.00 kB │ gzip:  0.02 kB
build/client/assets/searches._index-Cqqh6Nmg.js                                0.27 kB │ gzip:  0.23 kB
build/client/assets/searches._searchId_.candidates._index-BqiPCKIH.js          0.27 kB │ gzip:  0.23 kB
build/client/assets/searches._searchId-BsRSRPyH.js                             0.64 kB │ gzip:  0.45 kB
build/client/assets/haptics-C5YlcInJ.js                                        1.02 kB │ gzip:  0.52 kB
build/client/assets/ambient-pulse-Bxys2kOP.js                                  1.40 kB │ gzip:  0.82 kB
build/client/assets/error-unknown-DY4xhMWd.js                                  2.43 kB │ gzip:  1.00 kB
build/client/assets/chunk-YNUBSHFH-CCdznonb.js                                 3.04 kB │ gzip:  1.53 kB
build/client/assets/root-CyswwTOb.js                                           5.98 kB │ gzip:  2.23 kB
build/client/assets/searches._searchId_.candidates._candidateId-SLX02Tbr.js   31.81 kB │ gzip: 11.48 kB
build/client/assets/_index-B15fbxEr.js                                        63.05 kB │ gzip: 19.08 kB
build/client/assets/chunk-JMJ3UQ3L-BZB15f9O.js                               124.86 kB │ gzip: 42.29 kB
build/client/assets/entry.client-0g2zKKI_.js                                 187.81 kB │ gzip: 58.94 kB
✓ built in 1.79s
vite v7.3.0 building ssr environment for production...
✓ 5298 modules transformed.
rendering chunks (5)...Using vars defined in .dev.vars
build/server/.dev.vars                                   0.64 kB
build/server/.vite/manifest.json                         1.57 kB
build/server/wrangler.json                               4.38 kB
build/server/assets/query_compiler_bg-BLBQOTuU.wasm  1,825.18 kB
build/server/assets/server-build-mXnUP3Qy.css           54.39 kB
build/server/index.js                                    0.16 kB
build/server/assets/browser-BZ4jAvHT.js                  1.20 kB
build/server/assets/query_compiler_bg-gBoRaSMa.js        7.82 kB
build/server/assets/worker-entry-BNcLiW6e.js           749.75 kB
build/server/assets/server-build-clYKbwRf.js         1,519.74 kB
```

(next purpose: remove every wasm client and move to a lightweight/edge sql client)

## TODO

* The "candidate page" is almost too long on my pixel 9a. (ex: Le Brazier)
* Haptics do not work on Android?
* Make it a PWA
* Use KV for circuit breaker? https://community.cloudflare.com/t/session-management/46770/4
* "back" does not work properly, the "candidate" page seems to be skipped
* Add indexes based on the actual calls
* Streaming HTTP during search
* Preference form:
    * Use localstorage
* Add some cache on Nominatim