# BiteRoulette

## Source of data

Here are the source of data I plan to pull to get the most complete source of restaurant:
* OpenStreetMap (OSM) / Overpass API
* API Store :  https://api.store/belgium-api/fedict-api/food-andamp-drink-api

## Restaurant that are not found

Bistrot Blaise

## Scraper

The scraper scripts are written in Javascript.
On Windows, we use nvm-windows to manage node versions:
```
winget install -e --id CoreyButler.NVMforWindows
```

The environment variables can be placed in a `.env` file foir development purposes.


## Open questions

* Should we bundle the external lmibraries or not.