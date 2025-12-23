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

* Use localstorage for the preferences 
* Investigate why restaurant "Respire Restaurant" does not find any photo
* Investigate why "La Terrasse de l'Abbaye de Notre-Dame du Vivier" does not find any equivalent on Google
* Fuzzy string comparison might be shitty
* Use `zod` to parse env variables?