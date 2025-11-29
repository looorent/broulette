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




Yep, i like this design! Keep this visual identity and tone of voice in your mind, you will need it to generate the other steps.
Now generate the step 2 (only).
This steps requests the user to provide two information:
1. A location where to find a restaurant near by. This information should be automatically provided by the browser, but also updatable manually if the user did not allow the geoloc via her browser.
2. When"? a picker to get select "this evening", or another moment, relevant regarding restaurants.
A button that must start the search for a random restaurant

Form with two fields: 1) Get the "around where" that can be prefilled if they have shared the location or a field that allow to select your address. 2) "When"? a picker to get select "this evening", or another moment, relevant regarding restaurants. This page should allow to go to step 3 or step 2b. Finding a restaurant must present a loading

* "The deets" can be replaced by "Help us Help you", without subtitle
* The "pin point" logo does not need a yellow background
* The slider does not work
* When selected, the green "v" is cropped by its parent.
* "Where?" gives the feeling we need an accurate location to find a restaurant. A label like "Around where" (or better english) would be better.
* "Start search" is a bit boring
* The serach icon feels like this is a real "search". It is. But the idea is to find something random, so this is not really a search.
* The "locate me" icon is not clear, is it possible to replace this by a tag?


Replace the icons in the rain by food icons from fontawesome 


Now i want a nice loader that pulses options and search for something. Please be original & fancy.


## Logo

Je crée une application qui trouve un restaurant aléatoire. Je veux créer un logo dans un style extrèmemement simple (peu d'éléments mais une idée unique bien présentée).
L'application s'appelle BiteRoulette.

Voici le style de l'app en pièce jointe pour que tu puisses te calquer sur ce style visuel.

Je veux que tu génères ces idées: 
- L'Assiette Mystère : Une assiette vue de dessus avec un grand point d'interrogation dessiné au centre (ou formé par la sauce).
- Le Dé à Manger : Un cube (dé) simple en 3D isométrique, mais les points sur les faces sont remplacés par de petits aliments (burger, pizza, sushi) ou simplement des ronds en forme d'assiettes.
- Le Dé Fourchette : Un dé classique, mais la face visible (le 1) est une empreinte de fourchette.
- Le Radar : Des cercles concentriques (radar) avec un point (le resto) qui clignote, le tout formant une assiette.
- Les Points de Suspension : Trois points alignés (...) qui se transforment progressivement : le premier est un point, le deuxième un rond plus gros, le troisième une assiette.
- Le Fortune Cookie : Un biscuit chinois cassé en deux, laissant sortir un petit papier (le résultat).
- Le Cercle de Chargement : Un cercle de chargement (loading) incomplet qui ressemble à une bouche prête à manger (type Pac-Man minimaliste).
- Dé mangé: Un dé "grignotté"
- Dé mangé (format gruyère): le dé inspiré d'un gruyète, grignotté


## Icons

https://fontawesome.com/icons/pizza-slice?f=classic&s=solid
https://fontawesome.com/icons/hotdog?f=classic&s=solid
https://fontawesome.com/icons/spoon?f=classic&s=solid
