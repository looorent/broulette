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

## TODO

* Enable "locale" (at least the default one)
* Streaming HTTP during search
* Handle errors on every route
* Manage two errors:
    * No candidate left
    * Too many calls
* Preference form:
    * Default values in preference form ("close" should be selected by default)
    * Use localstorage
* Investigation
    * why restaurant "Respire Restaurant" does not find any photo
    * why "La Terrasse de l'Abbaye de Notre-Dame du Vivier" does not find any equivalent on Google
* Fuzzy string comparison might be shitty
* Use `zod` to parse env variables?
* Deployment:
    * Render or Vercel?
    * or Cloudflare Workers? (requires code changes)
* Add some log
* Add some cache on Nominatim