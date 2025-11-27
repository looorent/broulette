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

Prompt:

I want to design my application.
* Subject: A mobile web page that requests the location of the user and provides a button to find a random restaurant near that person.
* User experience: Here is a basic experience:
    * Step 1: Just display a nice button "Find a restaurant near you" (or something similar) to explain the project
    * Step 2: Form with two fields: 1) Get the "around where" that can be prefilled if they have shared the location or a field that allow to select your address. 2) "When"? a picker to get select "this evening", or another moment, relevant regarding restaurants. This page should allow to go to step 3 or step 2b. Finding a restaurant must present a loading
    * Step 2b: more filters like 1) the distance range and 2) the price range. This step is optional and should not be presented in the simplest UX path.
    * Step 3: Loader with a strong "restaurant" feeling and design. Then Step 4.
    * Step 4: Present the restaurants that has been found (with data from Google Place, TripAdvisor etc). And give the opportunity to "find something else" to load and get back to step 3 with a new restaurant.


The visual style I want must be fancy and warm, not corporate. It must not be boring, it must be original!
I like pop, flashy and fun designs . Do not use emoticons (you can pick a popular library or generate the icons in the appropriate style).
The most important is to not follow the usual boring applications, the user must not feel like she's using an app.

Please implement this design with Tailwind. Do not use react, I want a single HTML file. The code itself is not important, I want to focus on the design and the experience. 