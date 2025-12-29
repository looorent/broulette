# BiteRoulette

## Source of data

Here are the source of data I plan to pull to get the most complete source of restaurant:
* OpenStreetMap (OSM) / Overpass API
* Google Place

## Generate BROULETTE_SESSION_SECRET

A secret key must be defined in `BROULETTE_SESSION_SECRET`
```
$ openssl rand -hex 32
```

## Mandatory environment

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

* Use KV? https://community.cloudflare.com/t/session-management/46770/4
* "back" does not work properly, the "candidate" page seems to be skipped
* Add a tag "unknown opening hours"
* Add indexes based on the actual calls
* Streaming HTTP during search
* Review app declaration
* Preference form:
    * Default values in preference form ("close" should be selected by default)
    * Use localstorage
* Add some log
* Add some cache on Nominatim