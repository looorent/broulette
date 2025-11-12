# OpenStreetMap (OSM) / Overpass API

Documentation: https://wiki.openstreetmap.org/wiki/Overpass_API

Overpass makes uses of a dedicated query language: "Overpass QL query".
You can query their REST API using this language, that is simply written in the request's payload.
The payload (of Content Type `application/x-www-form-urlencoded`) has a single attribute `data` containsing the whole query.

Overpass has multiple API instances. We will use the "Main Overpass API instance", located in Germany.

The typical Overpass Query to list all restaurants of Belgium:
´´´
[out:json][timeout:180];
area["ISO3166-1"="BE"]->.searchArea;
nwr["amenity"~"restaurant|fast_food"](area.searchArea);
out tags center qt;
´´´

The queries can be tested interactively at: https://overpass-turbo.eu/

It returns these types of tags:
´´´
addr:city = Hingeon
addr:housenumber = 68
addr:postcode = 5380
addr:street = Grand Route
amenity = restaurant
building = yes
cuisine = steak_house
name = Le Brazier
opening_hours = We-Su 12:00-22:00
phone = +32 81 34 08 69
website = https://www.lebrazier.be/
´´´

Here is the query as cUrl:
´´´curl
curl --location 'https://overpass-api.de/api/interpreter' \
 --header 'Content-Type: application/x-www-form-urlencoded' \
 --data-urlencode 'data=[out:json][timeout:180];
area["ISO3166-1"="BE"]->.searchArea;
nwr["amenity"~"restaurant|fast_food"](area.searchArea);
out tags center qt;'
´´´

It returns a JSON payload of ~1MB.
