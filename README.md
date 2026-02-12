# BiteRoulette

A location-based React application that helps users find the perfect dining spot based on their current location, time preference, and distance range.

## Overview

This application acts as a randomization engine for restaurants. It aggregates restaurant data from various external sources to provide a unified profile. Users can search for dining options based on specific criteria (Dinner, Lunch, "Right Now") and interact with the results.

## Tech Stack

* **Framework:** React Router 7 (framework mode)
* **Runtime:** Cloudflare Workers
* **Database:** Cloudflare D1 (SQLite)
* **ORM:** Drizzle
* **Styling:** Tailwind CSS 4
* **Language:** TypeScript 5.9 (strict mode)

## Prerequisites

* Node.js >= 22.0.0
* npm
* Cloudflare account (for deployment)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.dev.vars` file with the required secrets:

```bash
BROULETTE_SESSION_SECRET=<generate with: openssl rand -hex 32>
BROULETTE_GOOGLE_PLACE_API_KEY=<your-google-api-key>
BROULETTE_TRIPADVISOR_API_KEY=<your-tripadvisor-api-key>
```

### 3. Initialize the Database

```bash
npm run db:migrate:local
```

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

### Run Specific Test Files

```bash
npm test -- --run src/features/session.server/
```

### Test Structure

Tests are co-located with their source files using the `.test.ts` suffix:

```
src/features/
  session.server/
    csrf.ts
    csrf.test.ts      # Unit tests for CSRF
    session.ts
    session.test.ts   # Unit tests for session
src/routes/
  _.api.address-searches.ts
  _.api.address-searches.test.ts  # Route handler tests
```

## Deployment

### Deploy to Cloudflare Workers

```bash
npm run deploy
```

### Production Database Migration

```bash
npm run db:migrate:prod
```

### Setting Production Secrets

```bash
npx wrangler secret put BROULETTE_SESSION_SECRET
npx wrangler secret put BROULETTE_GOOGLE_PLACE_API_KEY
npx wrangler secret put BROULETTE_TRIPADVISOR_API_KEY
```

### Preview Build Locally

```bash
npm run build
npm run preview
```

## Database Management

This project uses **Drizzle** for database management.

### Update Schema

If you modify `schema.ts`, generate migrations:

```bash
npm run db:gen
```

### Apply Migrations

```bash
# Local
npm run db:migrate:local

# Production
npm run db:migrate:prod
```

### Database Studio

```bash
# Local database UI
npm run db:studio:local

# Production database UI
npm run db:studio:prod
```

### Manual Database Backup

Export from D1:

```bash
npx wrangler d1 export broulette-eu --remote --no-data --output=./schema.sql
npx wrangler d1 export broulette-eu --remote --no-schema --output=./data.sql
```

Import to D1:

```bash
npx wrangler d1 execute broulette-eu --remote --file=./schema.sql
npx wrangler d1 execute broulette-eu --remote --file=./data.sql
```

> Note: Data exports may have foreign key ordering issues. Consider disabling foreign key checks during import.

## Environment Variables

### Required Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BROULETTE_SESSION_SECRET` | Secret for signing session cookies (generate with `openssl rand -hex 32`) | Yes |

### Service Enable Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `BROULETTE_NOMINATIM_ENABLED` | `false` | Enable Nominatim for address search |
| `BROULETTE_PHOTON_ENABLED` | `false` | Enable Photon for address search |
| `BROULETTE_OVERPASS_ENABLED` | `false` | Enable Overpass for restaurant discovery |
| `BROULETTE_GOOGLE_PLACE_ENABLED` | `false` | Enable Google Places for restaurant details |
| `BROULETTE_TRIPADVISOR_ENABLED` | `false` | Enable TripAdvisor for restaurant details |

### API Keys (Secrets)

| Variable | Description |
|----------|-------------|
| `BROULETTE_GOOGLE_PLACE_API_KEY` | Google Places API key |
| `BROULETTE_TRIPADVISOR_API_KEY` | TripAdvisor API key |

### Nominatim Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BROULETTE_NOMINATIM_INSTANCE_URLS` | `https://nominatim.openstreetmap.org/search` | Comma-separated list of instance URLs |
| `BROULETTE_NOMINATIM_USER_AGENT` | `BiteRoulette/<version>` | User agent for API requests |
| `BROULETTE_NOMINATIM_NUMBER_OF_ADDRESSES` | `5` | Maximum addresses to return |
| `BROULETTE_NOMINATIM_API_TIMEOUT` | `5000` | Request timeout in milliseconds |
| `BROULETTE_NOMINATIM_API_RETRIES` | `3` | Number of retries on failure |

### Photon Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BROULETTE_PHOTON_INSTANCE_URLS` | `https://photon.komoot.io/api/` | Comma-separated list of instance URLs |
| `BROULETTE_PHOTON_NUMBER_OF_ADDRESSES` | `5` | Maximum addresses to return |
| `BROULETTE_PHOTON_API_TIMEOUT` | `5000` | Request timeout in milliseconds |
| `BROULETTE_PHOTON_API_RETRIES` | `3` | Number of retries on failure |

### Google Places Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BROULETTE_GOOGLE_PLACE_BASE_URL` | `https://places.googleapis.com` | API base URL |
| `BROULETTE_GOOGLE_PLACE_API_SEARCH_RADIUS_IN_METERS` | `100` | Search radius for matching |
| `BROULETTE_GOOGLE_PLACE_API_PHOTO_MAX_WIDTH_IN_PX` | `800` | Maximum photo width |
| `BROULETTE_GOOGLE_PLACE_API_PHOTO_MAX_HEIGHT_IN_PX` | `600` | Maximum photo height |
| `BROULETTE_GOOGLE_PLACE_API_MAX_NUMBER_OF_ATTEMPTS_PER_MONTH` | `10000` | Rate limiting threshold |

### TripAdvisor Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BROULETTE_TRIPADVISOR_INSTANCE_URL` | `https://api.content.tripadvisor.com/api/v1` | API base URL |
| `BROULETTE_TRIPADVISOR_API_SEARCH_RADIUS_IN_METERS` | `100` | Search radius for matching |
| `BROULETTE_TRIPADVISOR_API_PHOTO_SIZE` | `medium` | Photo size (`small`, `medium`, `large`) |
| `BROULETTE_TRIPADVISOR_API_MAX_NUMBER_OF_ATTEMPTS_PER_MONTH` | `5000` | Rate limiting threshold |

### Overpass Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BROULETTE_OVERPASS_API_INSTANCE_URLS` | Multiple public instances | Comma-separated list of instance URLs |
| `BROULETTE_OVERPASS_API_TIMEOUT` | `5000` | Request timeout in milliseconds |
| `BROULETTE_OVERPASS_API_RETRIES` | `3` | Number of retries on failure |

### Search Engine Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BROULETTE_SEARCH_ENGINE_DISCOVERY_RANGE_INCREASE_METERS` | `500` | Range increase per iteration |
| `BROULETTE_SEARCH_ENGINE_MAX_DISCOVERY_ITERATIONS` | `10` | Maximum discovery iterations |
| `BROULETTE_SEARCH_ENGINE_CLOSE_RANGE_IN_METERS` | `1500` | "Close" distance range |
| `BROULETTE_SEARCH_ENGINE_CLOSE_TIMEOUT_IN_MS` | `30000` | Timeout for close searches |
| `BROULETTE_SEARCH_ENGINE_MID_RANGE_IN_METERS` | `5000` | "Mid-range" distance |
| `BROULETTE_SEARCH_ENGINE_MID_TIMEOUT_IN_MS` | `45000` | Timeout for mid-range searches |
| `BROULETTE_SEARCH_ENGINE_FAR_RANGE_IN_METERS` | `15000` | "Far" distance range |
| `BROULETTE_SEARCH_ENGINE_FAR_TIMEOUT_IN_MS` | `60000` | Timeout for far searches |

### Tag Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BROULETTE_TAGS_TO_EXCLUDE` | (empty) | Comma-separated tags to hide |
| `BROULETTE_TAGS_TO_PRIORITIZE` | (empty) | Comma-separated tags to show first |
| `BROULETTE_TAGS_MAXIMUM` | `5` | Maximum tags to display |

## Data Sources

### Address Search
- **Nominatim** - OpenStreetMap's geocoding service
- **Photon** - Komoot's geocoding service (faster, location-biased)

### Restaurant Discovery
- **Overpass** - OpenStreetMap query API for finding nearby restaurants

### Restaurant Details
- **Google Places** - Rich details, photos, ratings
- **TripAdvisor** - Reviews, photos, cuisine details

## Architecture

### Resilience Patterns

The application implements several resilience patterns:

- **Circuit Breaker**: Prevents cascading failures when services are unavailable
- **Load Balancer**: Round-robin distribution across multiple service instances
- **Retry with Exponential Backoff**: Automatic retries with increasing delays
- **Timeout**: Configurable request timeouts per service

### Server/Client Separation

Files are organized with clear boundaries:
- `.server.ts` - Server-only code (API calls, database, secrets)
- `.client.ts` - Client-only code (DOM, geolocation, haptics)

## Troubleshooting

### Common Issues

#### "Location access denied" on mobile

Ensure the site is served over HTTPS. Geolocation API requires a secure context.

#### Address suggestions not appearing

1. Verify `BROULETTE_NOMINATIM_ENABLED` or `BROULETTE_PHOTON_ENABLED` is `true`
2. Check browser console for network errors
3. Verify the service instances are accessible

#### "Unable to fetch addresses" error

This indicates a service failure. Check:
1. API service availability
2. Network connectivity
3. Rate limiting (check API quotas)

#### Search returns no restaurants

1. Verify `BROULETTE_OVERPASS_ENABLED` is `true`
2. Try a different location (some areas have sparse OSM data)
3. Increase the search range in preferences

#### Restaurant details missing photos

1. Verify `BROULETTE_GOOGLE_PLACE_ENABLED` or `BROULETTE_TRIPADVISOR_ENABLED` is `true`
2. Check API key validity
3. Check rate limiting quotas

#### Database migration fails

For production:
```bash
# Check current migration status
npx wrangler d1 execute broulette-eu --remote --command="SELECT * FROM __drizzle_migrations"

# Manually apply migrations if needed
npx wrangler d1 execute broulette-eu --remote --file=./drizzle/migrations/XXXX_migration.sql
```

#### Build fails with TypeScript errors

```bash
# Check types
npx tsc --noEmit

# Clear build cache
rm -rf node_modules/.vite
npm run build
```

### Debug Logging

Enable detailed logging by checking the browser console or Cloudflare Workers logs:

```bash
# Stream production logs
npx wrangler tail
```

## Next steps?

* Haptics do not work on Android?
* Move the default range to "by foot" (short range) and offer the capability to extend if nothing has been found.
* Move all the code about "cache" to a dedicated module?
