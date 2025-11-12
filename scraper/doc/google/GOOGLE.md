# Google place

## Cost

This is not free and requires an API Key.

## Limitation

Google prevents to crawl the API to fetch all the existing restaurants, the "nearby" search is not paginated and the "text" search is not exhaustive. Google Place might be a wrong API to get everyting. Maybe it could be used at runtime to fetch all the details of a given place.

## How to bypass the limitation

Starting from a list of restaurants (from OSM, for example), we might try to find the equivalent restaurant in Google Place with the Nearby Search, or the Text Search with a location bias.

## Two types of searches?

The new google place API uses two types of searches:

- nearby search
- text search

The "text" search is not sufficient because this is a semantic search that will not be exhaustive.
The only way to get these restaurants is to fetch all the restaurants "nearby" (Bruxelles, for example) and to post-filter what interests us.

## Example of Text Searches

```shell
curl --location 'https://places.googleapis.com/v1/places:searchText' \
--header 'Content-Type: application/json' \
--header 'X-Goog-FieldMask: *' \
--header 'X-Goog-Api-Key: ****' \
--data '{
    "textQuery": "All restaurants in Belgium",
    "languageCode": "en",
    "pageSize": 2,
    "regionCode": "BE",
    "includedType": "restaurant",
    "strictTypeFiltering": true
}'
```

## Example of Nearby Searches

```shell
curl --location 'https://places.googleapis.com/v1/places:searchNearby' \
--header 'Content-Type: application/json' \
--header 'X-Goog-FieldMask: *' \
--header 'X-Goog-Api-Key: *****' \
--data '{
    "locationRestriction": {
        "circle": {
            "center": {"latitude": 50.8503, "longitude": 4.3517},
            "radius": 100
        }
    },
    "languageCode": "en",
    "maxResultCount": 10,
    "regionCode": "BE",
    "includedTypes": [
        "acai_shop",
        "afghani_restaurant"
    ]
}'
```

## Interesting fields

- id (string)
- name (string) --> this is a technical name
- displayName
- formattedAddress (string)
- shortFormattedAddress (string)
- businessStatus (string)
- priceLevel (string)
- primaryType (string)
- internationalPhoneNumber (string)
- websiteUri (string)
- location
  latitude (decimal)
  longitude (decimal)
- viewport
  low
  latitude (decimal)
  longitude (decimal)
  high
  latitude (decimal)
  longitude (decimal)
- rating (decimal)
- userRatingCount
- googleMapsUri (string)
- regularOpeningHours
  regularOpeningHours (array of string)
  periods (array)
  open
  day (integer, 0 means monday)
  hour (integer)
  minute (integer)
  close
  day (integer, 0 means monday)
  hour (integer)
  minute (integer)
- takeout (boolean)
- delivery (boolean)
- dineIn (boolean)
- reservable (boolean)
- outdoorSeating (boolean)
- paymentOptions
  acceptsCreditCards (boolean)
  acceptsDebitCards (boolean)
  acceptsCashOnly (boolean)
  acceptsNfc (boolean)
- parkingOptions
  freeParkingLot (boolean)
  freeStreetParking (boolean)
- googleMapsLinks
  directionsUri (string)
  placeUri (string)
- priceRange
  startPrice
  currencyCode (string)
  units (string)
  endPrice
  currencyCode (string)
  units (string)
- timeZone
  id (string)
- postalAddress
  regionCode (string)
  languageCode (string)
  postalCode (string)
  locality (string)
  addressLines (array of string)

## Projection

Pay attention that some fields requires a different pricing including "Entreprise SDK" (such as the rating).
For the scraping, we could use the filter "\*" because we would tackle Enterprise fields anyway, so let's fetch everything.

## Filters

How to filter the query to fetch only the relevant point of interest?
For example, we can use the "type" of place: https://developers.google.com/maps/documentation/places/web-service/place-types#food-and-drink

### List of restaurants

Types to include (maximum 50):

```json
[
  "acai_shop",
  "afghani_restaurant",
  "african_restaurant",
  "american_restaurant",
  "asian_restaurant",
  "bar_and_grill",
  "barbecue_restaurant",
  "brazilian_restaurant",
  "breakfast_restaurant",
  "brunch_restaurant",
  "buffet_restaurant",
  "chinese_restaurant",
  "dessert_restaurant",
  "dessert_shop",
  "fast_food_restaurant",
  "fine_dining_restaurant",
  "french_restaurant",
  "greek_restaurant",
  "hamburger_restaurant",
  "indian_restaurant",
  "indonesian_restaurant",
  "italian_restaurant",
  "japanese_restaurant",
  "korean_restaurant",
  "lebanese_restaurant",
  "meal_delivery",
  "meal_takeaway",
  "mediterranean_restaurant",
  "mexican_restaurant",
  "middle_eastern_restaurant",
  "pizza_restaurant",
  "pub",
  "ramen_restaurant",
  "restaurant",
  "seafood_restaurant",
  "spanish_restaurant",
  "steak_house",
  "sushi_restaurant",
  "thai_restaurant",
  "turkish_restaurant",
  "vegan_restaurant",
  "vegetarian_restaurant",
  "vietnamese_restaurant"
]
```

## Find a restaurant based on OSM data

Let's assume we have a restaurant description obtained from Overpass API:

```json
{
  "type": "way",
  "id": 600379810,
  "center": {
    "lat": 50.5242343,
    "lon": 5.0000896
  },
  "tags": {
    "addr:city": "Hingeon",
    "addr:housenumber": "68",
    "addr:postcode": "5380",
    "addr:street": "Grand Route",
    "amenity": "restaurant",
    "building": "yes",
    "cuisine": "steak_house",
    "name": "Le Brazier",
    "opening_hours": "We-Su 12:00-22:00",
    "phone": "+32 81 34 08 69",
    "website": "https://www.lebrazier.be/"
  }
}
```

Here is an example of Google Place request that could help to find the best restaurant:

```shell
curl --location 'https://places.googleapis.com/v1/places:searchNearby' \
--header 'Content-Type: application/json' \
--header 'X-Goog-FieldMask: *' \
--header 'X-Goog-Api-Key: ••••••' \
--data '{
    "locationRestriction": {
        "circle": {
            "center": {"latitude": 50.5242343, "longitude": 5.0000896},
            "radius": 50
        }
    },
    "languageCode": "en",
    "maxResultCount": 20,
    "regionCode": "BE",
    "includedTypes": [
        "acai_shop",
        "afghani_restaurant",
        "african_restaurant",
        "american_restaurant",
        "asian_restaurant",
        "bar_and_grill",
        "barbecue_restaurant",
        "brazilian_restaurant",
        "breakfast_restaurant",
        "brunch_restaurant",
        "buffet_restaurant",
        "chinese_restaurant",
        "dessert_restaurant",
        "dessert_shop",
        "fast_food_restaurant",
        "fine_dining_restaurant",
        "french_restaurant",
        "greek_restaurant",
        "hamburger_restaurant",
        "indian_restaurant",
        "indonesian_restaurant",
        "italian_restaurant",
        "japanese_restaurant",
        "korean_restaurant",
        "lebanese_restaurant",
        "meal_delivery",
        "meal_takeaway",
        "mediterranean_restaurant",
        "mexican_restaurant",
        "middle_eastern_restaurant",
        "pizza_restaurant",
        "pub",
        "ramen_restaurant",
        "restaurant",
        "seafood_restaurant",
        "spanish_restaurant",
        "steak_house",
        "sushi_restaurant",
        "thai_restaurant",
        "turkish_restaurant",
        "vegan_restaurant",
        "vegetarian_restaurant",
        "vietnamese_restaurant"
    ]
}'
```

This call returns:

```json
{
  "places": [
    {
      "name": "places/ChIJt-AOOKmhwUcRyyG6Wo81sho",
      "id": "ChIJt-AOOKmhwUcRyyG6Wo81sho",
      "types": [
        "wine_bar",
        "barbecue_restaurant",
        "bar",
        "french_restaurant",
        "restaurant",
        "food",
        "point_of_interest",
        "establishment"
      ],
      "nationalPhoneNumber": "081 34 08 69",
      "internationalPhoneNumber": "+32 81 34 08 69",
      "formattedAddress": "Grand-Route 68, 5380 Fernelmont",
      "addressComponents": [
        {
          "longText": "68",
          "shortText": "68",
          "types": ["street_number"],
          "languageCode": "en"
        },
        {
          "longText": "Grand-Route",
          "shortText": "Grand-Route",
          "types": ["route"],
          "languageCode": "fr"
        },
        {
          "longText": "Hingeon",
          "shortText": "Hingeon",
          "types": ["sublocality_level_1", "sublocality", "political"],
          "languageCode": "fr"
        },
        {
          "longText": "Fernelmont",
          "shortText": "Fernelmont",
          "types": ["locality", "political"],
          "languageCode": "fr"
        },
        {
          "longText": "Namur",
          "shortText": "NA",
          "types": ["administrative_area_level_2", "political"],
          "languageCode": "fr"
        },
        {
          "longText": "Région wallonne",
          "shortText": "Région wallonne",
          "types": ["administrative_area_level_1", "political"],
          "languageCode": "fr"
        },
        {
          "longText": "Belgium",
          "shortText": "BE",
          "types": ["country", "political"],
          "languageCode": "en"
        },
        {
          "longText": "5380",
          "shortText": "5380",
          "types": ["postal_code"],
          "languageCode": "en"
        }
      ],
      "plusCode": {
        "globalCode": "9F27G2F2+P2",
        "compoundCode": "G2F2+P2 Fernelmont"
      },
      "location": {
        "latitude": 50.524277899999994,
        "longitude": 5.0000890999999994
      },
      "viewport": {
        "low": {
          "latitude": 50.5227957197085,
          "longitude": 4.9988617197084979
        },
        "high": {
          "latitude": 50.5254936802915,
          "longitude": 5.0015596802915026
        }
      },
      "rating": 4.2,
      "googleMapsUri": "https://maps.google.com/?cid=1923658880659366347&g_mp=Cilnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaE5lYXJieRACGAQgAA",
      "websiteUri": "https://www.lebrazier.be/",
      "regularOpeningHours": {
        "openNow": false,
        "periods": [
          {
            "open": {
              "day": 0,
              "hour": 12,
              "minute": 0
            },
            "close": {
              "day": 0,
              "hour": 14,
              "minute": 0
            }
          },
          {
            "open": {
              "day": 0,
              "hour": 18,
              "minute": 0
            },
            "close": {
              "day": 0,
              "hour": 22,
              "minute": 0
            }
          },
          {
            "open": {
              "day": 1,
              "hour": 12,
              "minute": 0
            },
            "close": {
              "day": 1,
              "hour": 14,
              "minute": 0
            }
          },
          {
            "open": {
              "day": 1,
              "hour": 18,
              "minute": 0
            },
            "close": {
              "day": 1,
              "hour": 22,
              "minute": 0
            }
          },
          {
            "open": {
              "day": 2,
              "hour": 12,
              "minute": 0
            },
            "close": {
              "day": 2,
              "hour": 14,
              "minute": 0
            }
          },
          {
            "open": {
              "day": 2,
              "hour": 18,
              "minute": 0
            },
            "close": {
              "day": 2,
              "hour": 22,
              "minute": 0
            }
          },
          {
            "open": {
              "day": 4,
              "hour": 12,
              "minute": 0
            },
            "close": {
              "day": 4,
              "hour": 14,
              "minute": 0
            }
          },
          {
            "open": {
              "day": 4,
              "hour": 18,
              "minute": 0
            },
            "close": {
              "day": 4,
              "hour": 22,
              "minute": 0
            }
          },
          {
            "open": {
              "day": 5,
              "hour": 12,
              "minute": 0
            },
            "close": {
              "day": 5,
              "hour": 14,
              "minute": 0
            }
          },
          {
            "open": {
              "day": 5,
              "hour": 18,
              "minute": 0
            },
            "close": {
              "day": 5,
              "hour": 22,
              "minute": 0
            }
          },
          {
            "open": {
              "day": 6,
              "hour": 18,
              "minute": 0
            },
            "close": {
              "day": 6,
              "hour": 22,
              "minute": 0
            }
          }
        ],
        "weekdayDescriptions": [
          "Monday: 12:00 – 2:00 PM, 6:00 – 10:00 PM",
          "Tuesday: 12:00 – 2:00 PM, 6:00 – 10:00 PM",
          "Wednesday: Closed",
          "Thursday: 12:00 – 2:00 PM, 6:00 – 10:00 PM",
          "Friday: 12:00 – 2:00 PM, 6:00 – 10:00 PM",
          "Saturday: 6:00 – 10:00 PM",
          "Sunday: 12:00 – 2:00 PM, 6:00 – 10:00 PM"
        ],
        "nextOpenTime": "2025-10-06T16:00:00Z"
      },
      "utcOffsetMinutes": 120,
      "adrFormatAddress": "<span class=\"street-address\">Grand-Route 68</span>, <span class=\"region\">Hingeon</span> <span class=\"postal-code\">5380</span> <span class=\"locality\">Fernelmont</span>, <span class=\"country-name\">Belgium</span>",
      "businessStatus": "OPERATIONAL",
      "priceLevel": "PRICE_LEVEL_MODERATE",
      "userRatingCount": 580,
      "iconMaskBaseUri": "https://maps.gstatic.com/mapfiles/place_api/icons/v2/restaurant_pinlet",
      "iconBackgroundColor": "#FF9E67",
      "displayName": {
        "text": "Le Brazier",
        "languageCode": "en"
      },
      "primaryTypeDisplayName": {
        "text": "Restaurant",
        "languageCode": "en"
      },
      "takeout": false,
      "delivery": false,
      "dineIn": true,
      "reservable": true,
      "servesBreakfast": false,
      "servesLunch": true,
      "servesDinner": true,
      "servesBeer": true,
      "servesWine": true,
      "currentOpeningHours": {
        "openNow": false,
        "periods": [
          {
            "open": {
              "day": 0,
              "hour": 12,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 12
              }
            },
            "close": {
              "day": 0,
              "hour": 14,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 12
              }
            }
          },
          {
            "open": {
              "day": 0,
              "hour": 18,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 12
              }
            },
            "close": {
              "day": 0,
              "hour": 22,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 12
              }
            }
          },
          {
            "open": {
              "day": 1,
              "hour": 12,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 6
              }
            },
            "close": {
              "day": 1,
              "hour": 14,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 6
              }
            }
          },
          {
            "open": {
              "day": 1,
              "hour": 18,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 6
              }
            },
            "close": {
              "day": 1,
              "hour": 22,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 6
              }
            }
          },
          {
            "open": {
              "day": 2,
              "hour": 12,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 7
              }
            },
            "close": {
              "day": 2,
              "hour": 14,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 7
              }
            }
          },
          {
            "open": {
              "day": 2,
              "hour": 18,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 7
              }
            },
            "close": {
              "day": 2,
              "hour": 22,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 7
              }
            }
          },
          {
            "open": {
              "day": 4,
              "hour": 12,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 9
              }
            },
            "close": {
              "day": 4,
              "hour": 14,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 9
              }
            }
          },
          {
            "open": {
              "day": 4,
              "hour": 18,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 9
              }
            },
            "close": {
              "day": 4,
              "hour": 22,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 9
              }
            }
          },
          {
            "open": {
              "day": 5,
              "hour": 12,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 10
              }
            },
            "close": {
              "day": 5,
              "hour": 14,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 10
              }
            }
          },
          {
            "open": {
              "day": 5,
              "hour": 18,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 10
              }
            },
            "close": {
              "day": 5,
              "hour": 22,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 10
              }
            }
          },
          {
            "open": {
              "day": 6,
              "hour": 18,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 11
              }
            },
            "close": {
              "day": 6,
              "hour": 22,
              "minute": 0,
              "date": {
                "year": 2025,
                "month": 10,
                "day": 11
              }
            }
          }
        ],
        "weekdayDescriptions": [
          "Monday: 12:00 – 2:00 PM, 6:00 – 10:00 PM",
          "Tuesday: 12:00 – 2:00 PM, 6:00 – 10:00 PM",
          "Wednesday: Closed",
          "Thursday: 12:00 – 2:00 PM, 6:00 – 10:00 PM",
          "Friday: 12:00 – 2:00 PM, 6:00 – 10:00 PM",
          "Saturday: 6:00 – 10:00 PM",
          "Sunday: 12:00 – 2:00 PM, 6:00 – 10:00 PM"
        ],
        "nextOpenTime": "2025-10-06T16:00:00Z"
      },
      "primaryType": "restaurant",
      "shortFormattedAddress": "Grand-Route 68, Fernelmont",
      "reviews": [
        {
          "name": "places/ChIJt-AOOKmhwUcRyyG6Wo81sho/reviews/ChZDSUhNMG9nS0VJQ0FnSUNYczlTaE93EAE",
          "relativePublishTimeDescription": "11 months ago",
          "rating": 5,
          "text": {
            "text": "The restaurant is very clean, the food tastes amazing and the most important thing...the staff (from the waiters to the cook) is priceless. Very welcoming ambiance and good experience an this place",
            "languageCode": "en"
          },
          "originalText": {
            "text": "The restaurant is very clean, the food tastes amazing and the most important thing...the staff (from the waiters to the cook) is priceless. Very welcoming ambiance and good experience an this place",
            "languageCode": "en"
          },
          "authorAttribution": {
            "displayName": "Alex",
            "uri": "https://www.google.com/maps/contrib/102769995569687190959/reviews",
            "photoUri": "https://lh3.googleusercontent.com/a-/ALV-UjUQ2AUkzrcYylJ3sXnAvhkgjRBPO6xdVUz4NQtXed__jjYmI2S9=s128-c0x00000000-cc-rp-mo-ba2"
          },
          "publishTime": "2024-10-20T08:51:38.074050Z",
          "flagContentUri": "https://www.google.com/local/review/rap/report?postId=ChZDSUhNMG9nS0VJQ0FnSUNYczlTaE93EAE&d=17924085&t=1",
          "googleMapsUri": "https://www.google.com/maps/reviews/data=!4m6!14m5!1m4!2m3!1sChZDSUhNMG9nS0VJQ0FnSUNYczlTaE93EAE!2m1!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb"
        },
        {
          "name": "places/ChIJt-AOOKmhwUcRyyG6Wo81sho/reviews/ChdDSUhNMG9nS0VJQ0FnSURsOGNpTjJBRRAB",
          "relativePublishTimeDescription": "a year ago",
          "rating": 5,
          "text": {
            "text": "We loved this place! Together with a large group of friends we were lucky to discover this place haphazardly.\n\nEveryone enjoyed their food immensely... and the staff! What a wonderful aand lovely team they have.\n\nEnjoy the food and the service! Definitely worth a visit.",
            "languageCode": "en"
          },
          "originalText": {
            "text": "We loved this place! Together with a large group of friends we were lucky to discover this place haphazardly.\n\nEveryone enjoyed their food immensely... and the staff! What a wonderful aand lovely team they have.\n\nEnjoy the food and the service! Definitely worth a visit.",
            "languageCode": "en"
          },
          "authorAttribution": {
            "displayName": "Pieter Markey",
            "uri": "https://www.google.com/maps/contrib/114092980761630927259/reviews",
            "photoUri": "https://lh3.googleusercontent.com/a/ACg8ocImFE9OX6-_7d5Q8Gz6HDnlFoKI7hToLYT5J__sEt64WuCmE7Tl=s128-c0x00000000-cc-rp-mo-ba4"
          },
          "publishTime": "2023-12-02T13:03:01.844894Z",
          "flagContentUri": "https://www.google.com/local/review/rap/report?postId=ChdDSUhNMG9nS0VJQ0FnSURsOGNpTjJBRRAB&d=17924085&t=1",
          "googleMapsUri": "https://www.google.com/maps/reviews/data=!4m6!14m5!1m4!2m3!1sChdDSUhNMG9nS0VJQ0FnSURsOGNpTjJBRRAB!2m1!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb"
        },
        {
          "name": "places/ChIJt-AOOKmhwUcRyyG6Wo81sho/reviews/ChZDSUhNMG9nS0VJQ0FnSUR1NWNTVFVREAE",
          "relativePublishTimeDescription": "3 years ago",
          "rating": 3,
          "text": {
            "text": "This restaurant offers a nice choice of meat coming from various countries, a good quality and correct service...it could be a higher rate if the meat was prepared the way we asked, very rare was served rare and rare served medium. The wine selection is good. It looks like this place is focused on the business lunch/diner and people who like be trendy, meatlovers can be abit disappointed.",
            "languageCode": "en"
          },
          "originalText": {
            "text": "This restaurant offers a nice choice of meat coming from various countries, a good quality and correct service...it could be a higher rate if the meat was prepared the way we asked, very rare was served rare and rare served medium. The wine selection is good. It looks like this place is focused on the business lunch/diner and people who like be trendy, meatlovers can be abit disappointed.",
            "languageCode": "en"
          },
          "authorAttribution": {
            "displayName": "Janick Michel",
            "uri": "https://www.google.com/maps/contrib/114300753427591350034/reviews",
            "photoUri": "https://lh3.googleusercontent.com/a/ACg8ocIRZ6gv_oN6cTK2_LO1Kz1dnnQ5QPHSGrrzqgPxkVGeqimEjg=s128-c0x00000000-cc-rp-mo-ba3"
          },
          "publishTime": "2022-08-25T14:51:28.443070Z",
          "flagContentUri": "https://www.google.com/local/review/rap/report?postId=ChZDSUhNMG9nS0VJQ0FnSUR1NWNTVFVREAE&d=17924085&t=1",
          "googleMapsUri": "https://www.google.com/maps/reviews/data=!4m6!14m5!1m4!2m3!1sChZDSUhNMG9nS0VJQ0FnSUR1NWNTVFVREAE!2m1!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb"
        },
        {
          "name": "places/ChIJt-AOOKmhwUcRyyG6Wo81sho/reviews/ChZDSUhNMG9nS0VJQ0FnSURLaGR6c0RBEAE",
          "relativePublishTimeDescription": "4 years ago",
          "rating": 5,
          "text": {
            "text": "Fantastic food and service. We really enjoyed our lunch here today, the food is outstanding ... both the cheese and the meat on the sharing plate was delicious. The steak with pepper sauce, also delicious. Highly recommended.",
            "languageCode": "en"
          },
          "originalText": {
            "text": "Fantastic food and service. We really enjoyed our lunch here today, the food is outstanding ... both the cheese and the meat on the sharing plate was delicious. The steak with pepper sauce, also delicious. Highly recommended.",
            "languageCode": "en"
          },
          "authorAttribution": {
            "displayName": "Donna Hughes",
            "uri": "https://www.google.com/maps/contrib/110048880428327311963/reviews",
            "photoUri": "https://lh3.googleusercontent.com/a-/ALV-UjXu_YqFdtvsh4in7smAqy5zQzEmOwG-OxwmQUv9arAFQ9ZzshemDw=s128-c0x00000000-cc-rp-mo-ba4"
          },
          "publishTime": "2021-05-13T19:55:22.782553Z",
          "flagContentUri": "https://www.google.com/local/review/rap/report?postId=ChZDSUhNMG9nS0VJQ0FnSURLaGR6c0RBEAE&d=17924085&t=1",
          "googleMapsUri": "https://www.google.com/maps/reviews/data=!4m6!14m5!1m4!2m3!1sChZDSUhNMG9nS0VJQ0FnSURLaGR6c0RBEAE!2m1!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb"
        },
        {
          "name": "places/ChIJt-AOOKmhwUcRyyG6Wo81sho/reviews/ChZDSUhNMG9nS0VJQ0FnSURHd2ZIR0t3EAE",
          "relativePublishTimeDescription": "3 years ago",
          "rating": 5,
          "text": {
            "text": "Nice clean and comfortable restaurant. Good quality meat and very friendly staff. All the best from Holland!",
            "languageCode": "en"
          },
          "originalText": {
            "text": "Nice clean and comfortable restaurant. Good quality meat and very friendly staff. All the best from Holland!",
            "languageCode": "en"
          },
          "authorAttribution": {
            "displayName": "Tim Nederhoff",
            "uri": "https://www.google.com/maps/contrib/114337236551620635935/reviews",
            "photoUri": "https://lh3.googleusercontent.com/a/ACg8ocJNODSCqUkqRCW3oNh3fjAZQrt7ju-RPfnjYw3j8LQGP0dXkQ=s128-c0x00000000-cc-rp-mo-ba3"
          },
          "publishTime": "2021-11-30T08:40:45.560206Z",
          "flagContentUri": "https://www.google.com/local/review/rap/report?postId=ChZDSUhNMG9nS0VJQ0FnSURHd2ZIR0t3EAE&d=17924085&t=1",
          "googleMapsUri": "https://www.google.com/maps/reviews/data=!4m6!14m5!1m4!2m3!1sChZDSUhNMG9nS0VJQ0FnSURHd2ZIR0t3EAE!2m1!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb"
        }
      ],
      "photos": [
        {
          "name": "places/ChIJt-AOOKmhwUcRyyG6Wo81sho/photos/AciIO2c-w_UTcu1QIAw2wwaRhTVALCSr4B4tVbCicVn5nHSFxj4SIMcVzDlROVHK5UcWaxsR_hhsfpGYcjBffnxhEvthh2QyjppkilFCw_oncRe7hDOi3WINdeY95J0mULZelGVfpCzismIBsNfnsrV8zZfcbCTUNS16li4gLsQR0H2rCSNXGlZBD_E76KSz_o-JoU-BiayAWXS6llhvNpQ0XRYuj83UGIhCHPp8EkJCCRBHnpllJpoj1HoaNQuNVlE6qlBQ7hXtHVvWxnwnP53D3RLjKpDCOjnaWmhpU-rXbl0G5g",
          "widthPx": 2048,
          "heightPx": 1536,
          "authorAttributions": [
            {
              "displayName": "Le Brazier",
              "uri": "https://maps.google.com/maps/contrib/107214664009309218218",
              "photoUri": "https://lh3.googleusercontent.com/a-/ALV-UjV4UvshFMdq5_2VhOJ0jSROH90OtQU8fdZcEbp-gK0GPbodswM8=s100-p-k-no-mo"
            }
          ],
          "flagContentUri": "https://www.google.com/local/imagery/report/?cb_client=maps_api_places.places_api&image_key=!1e10!2sAF1QipOnfqsyhPrnEysCI4MXu-JpBsju6x1aUXqs6G-V&hl=en&gl=BE",
          "googleMapsUri": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sAF1QipOnfqsyhPrnEysCI4MXu-JpBsju6x1aUXqs6G-V!2e10!4m2!3m1!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb"
        },
        {
          "name": "places/ChIJt-AOOKmhwUcRyyG6Wo81sho/photos/AciIO2fyWU2doLjvt4IqK68gTAlx8aaO4L3oO48_jOjoSvqCh3tnt-OGKlkqG-k8sW8yxOtOhJfdvcSebbmCqqOqmzwIzO0CJ1XiUA2ZFcI2BQZ8vhbM1Nd3VYwJi0d6FFRKQsw4ar_Lv6JZoD_PEV9J8MiEQt-z-N_kgLHhuu48941KN5St9ngSO-69SO1QnRgjVkU8lOcbcDvnNM-Tno3C_G_KVEdxfOQX-aZSjr0j2k7kXQ3J-wqMsHZlsY8unfPmppTVVY8Q4l1D4ZUDLfM-eWAvl9zgODd6LL1bwHyfnn4LvQ",
          "widthPx": 1536,
          "heightPx": 2048,
          "authorAttributions": [
            {
              "displayName": "Le Brazier",
              "uri": "https://maps.google.com/maps/contrib/107214664009309218218",
              "photoUri": "https://lh3.googleusercontent.com/a-/ALV-UjV4UvshFMdq5_2VhOJ0jSROH90OtQU8fdZcEbp-gK0GPbodswM8=s100-p-k-no-mo"
            }
          ],
          "flagContentUri": "https://www.google.com/local/imagery/report/?cb_client=maps_api_places.places_api&image_key=!1e10!2sAF1QipP76Sp1nKjYuihyYKi6TQqWFPTO6vwoESJvr5Aw&hl=en&gl=BE",
          "googleMapsUri": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sAF1QipP76Sp1nKjYuihyYKi6TQqWFPTO6vwoESJvr5Aw!2e10!4m2!3m1!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb"
        },
        {
          "name": "places/ChIJt-AOOKmhwUcRyyG6Wo81sho/photos/AciIO2c5xTaxpQd2cmCH8Bdhpt0jwVXAFEaMle_1krojxjIOFw9cjxC8gEW6TrlXZ5Sp2jUEtqbE2wSGPG4c9sTG-vidLixr2lNiPbmkIoq4NufyNCL9PzvJFWCQTIVcqZwaLljYZdtz_mltecQ-23ceebRZ2TEAvp4NNAKXnD8CoeYb8btANQtvUfC6WXXshpUqcU2NEa2hs43uT3_9tm6aYlIOtg9_g_iVFGtNIhsFJlASslhfRAKzKkxaMN1QdWEcLVto-Yc6WQQD0qxD2NczzFNov7cP6j_gAFUbUCo8SQk1nA",
          "widthPx": 1536,
          "heightPx": 2048,
          "authorAttributions": [
            {
              "displayName": "Le Brazier",
              "uri": "https://maps.google.com/maps/contrib/107214664009309218218",
              "photoUri": "https://lh3.googleusercontent.com/a-/ALV-UjV4UvshFMdq5_2VhOJ0jSROH90OtQU8fdZcEbp-gK0GPbodswM8=s100-p-k-no-mo"
            }
          ],
          "flagContentUri": "https://www.google.com/local/imagery/report/?cb_client=maps_api_places.places_api&image_key=!1e10!2sAF1QipPa1f5WOjZbbAZG0arhBoxQ6uK2cZx8zdSVMYNO&hl=en&gl=BE",
          "googleMapsUri": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sAF1QipPa1f5WOjZbbAZG0arhBoxQ6uK2cZx8zdSVMYNO!2e10!4m2!3m1!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb"
        },
        {
          "name": "places/ChIJt-AOOKmhwUcRyyG6Wo81sho/photos/AciIO2cLZbTBkRzo8Y1U2W-PB-r7uziRC-hsgfI-v5HR9ihJxWDEShkgk1WZqSr4idXMUOhOflKdpu2eH3fj0WlqCCFyPZZ7ZKhlRdirs5lOA1s2Bw6iLvHrvBW-5DoeR3j34Jm8jb84_AkA2tMfBfyMEyTCNaQ_aQyrJx5Wn2SMCXbngVlKqGkIVPksXFheq-ASke1D06Us1aYOyJ62hjjfwGYtAJSzgRKYT3akIBIOTm6tNZUA8TeuU5SxYiEoZuSPUho6GL4QL-7CPRy_LtufYM9dtjVL8GFa5v7oGdF0Gz7vCQ",
          "widthPx": 1536,
          "heightPx": 2048,
          "authorAttributions": [
            {
              "displayName": "Le Brazier",
              "uri": "https://maps.google.com/maps/contrib/107214664009309218218",
              "photoUri": "https://lh3.googleusercontent.com/a-/ALV-UjV4UvshFMdq5_2VhOJ0jSROH90OtQU8fdZcEbp-gK0GPbodswM8=s100-p-k-no-mo"
            }
          ],
          "flagContentUri": "https://www.google.com/local/imagery/report/?cb_client=maps_api_places.places_api&image_key=!1e10!2sAF1QipPzzD3WS2oIMidYHjtPDLK_uz9bw-fEPJs55e9k&hl=en&gl=BE",
          "googleMapsUri": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sAF1QipPzzD3WS2oIMidYHjtPDLK_uz9bw-fEPJs55e9k!2e10!4m2!3m1!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb"
        },
        {
          "name": "places/ChIJt-AOOKmhwUcRyyG6Wo81sho/photos/AciIO2eIa2ROu_noLmfqyE9BxJjJHSKfCKPp0r5HE4I7hwjGLICNtXSHdXPgPbv3mCPnPkdUr9EB-Bfvfz_k0GJYpRS2qhIaNOoD7VeqJlXLos3N6cd4Ynw1fgv5rk-X_SlTwFta9EV41zFK8UzuRqjdjcmidpMg5yQQHMoQo_ukRQ9o-I2-7fvUJXsIESmJf8AYV_3XR-bRxjBLhVCrV8Qk577UCMgwu5S7GV1bVsXisLRtcA242ygIggrhYMiMFwKiHjs6zEiNeoFHFqz-MvOK6V_GNj0XqIvYo5Wjs0f5vWlgjMJa8PMhQ3-v0p8vZr4PEZzxLUOmgTrymisTe_hfFul6ckO_8riBDSRODYmtgIPWrSxlNBA-XyAbSxIS2JwwJwY5VkdJQTwe3hfPcXb3See4IrF1oosIiCO7qZP7tTpwoKtNi0kAQ-i3oumQWmjY",
          "widthPx": 4608,
          "heightPx": 2592,
          "authorAttributions": [
            {
              "displayName": "Evelyne Boux",
              "uri": "https://maps.google.com/maps/contrib/101817942610513433256",
              "photoUri": "https://lh3.googleusercontent.com/a-/ALV-UjX_lh2QFtRUK73DdmmZH6qk44e35udBj_pagprXIsDulHcrvtNi=s100-p-k-no-mo"
            }
          ],
          "flagContentUri": "https://www.google.com/local/imagery/report/?cb_client=maps_api_places.places_api&image_key=!1e10!2sCIABIhCYYTwzvsjnUvt36Pdb_7dA&hl=en&gl=BE",
          "googleMapsUri": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sCIABIhCYYTwzvsjnUvt36Pdb_7dA!2e10!4m2!3m1!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb"
        },
        {
          "name": "places/ChIJt-AOOKmhwUcRyyG6Wo81sho/photos/AciIO2doF1gE2l_vz-R0yEFCnjpdwZu22m4UxjvJxol-8j_1UHskKoGp8MOytsRZL9rfOmZRU4h7pIWBf1lGQzd_FQLN3NtJXqBr9LuvyTEO57GJkwsQ68IJxcoeVd7q67_Xly4PazoHmPCuDxulrtbkD5PkhYmTIGTfNUayTieThVhzyWPTxOr8ziMdF1quTyutrnQHRvogra9XbVHHtRGLldeYu0h2M44Bfmgv82fF0SoSlPwOn0LsBWk4rSWvlMha6NjHlMXkLp_EiM7wawlgxlFE6R4NutOp_YO74_Q1CUsK0A",
          "widthPx": 1536,
          "heightPx": 2048,
          "authorAttributions": [
            {
              "displayName": "Le Brazier",
              "uri": "https://maps.google.com/maps/contrib/107214664009309218218",
              "photoUri": "https://lh3.googleusercontent.com/a-/ALV-UjV4UvshFMdq5_2VhOJ0jSROH90OtQU8fdZcEbp-gK0GPbodswM8=s100-p-k-no-mo"
            }
          ],
          "flagContentUri": "https://www.google.com/local/imagery/report/?cb_client=maps_api_places.places_api&image_key=!1e10!2sAF1QipMLCmpNhaSI8E74cuE5S4kSm4cuUOwuXe-Qu5cE&hl=en&gl=BE",
          "googleMapsUri": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sAF1QipMLCmpNhaSI8E74cuE5S4kSm4cuUOwuXe-Qu5cE!2e10!4m2!3m1!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb"
        },
        {
          "name": "places/ChIJt-AOOKmhwUcRyyG6Wo81sho/photos/AciIO2esMBbtQzalYiFSKI0bFAtrcqBofx6wtiZOlVrF9A4xTZX-gC4NsWWRqOzPxnMJjzI6CeXqOToK-Tc3w1-0r0bEhuyouLxaY7HRGMaGeGODb-HY9Q4667keK28Bys143n5bSAMtJ_SNmE2e9FNN7-zieWw-S4vs0pF19neCPCb0I_O3tXVMcT2AJFzn-R0923G42EOMTl-KfKjm03bM7De100XyIEKxZY28ZPjI6VpPtB6lFDtYPhBKEoK6-TysoiUyACEcXkCCvnn9uF6jOaiNdw_DJX-p8zpFX3CzovHQ-w",
          "widthPx": 1908,
          "heightPx": 2048,
          "authorAttributions": [
            {
              "displayName": "Le Brazier",
              "uri": "https://maps.google.com/maps/contrib/107214664009309218218",
              "photoUri": "https://lh3.googleusercontent.com/a-/ALV-UjV4UvshFMdq5_2VhOJ0jSROH90OtQU8fdZcEbp-gK0GPbodswM8=s100-p-k-no-mo"
            }
          ],
          "flagContentUri": "https://www.google.com/local/imagery/report/?cb_client=maps_api_places.places_api&image_key=!1e10!2sAF1QipMgeHMJY2C2eV5hoDSAFr_x-uVuY6xTVE9YvPZd&hl=en&gl=BE",
          "googleMapsUri": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sAF1QipMgeHMJY2C2eV5hoDSAFr_x-uVuY6xTVE9YvPZd!2e10!4m2!3m1!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb"
        },
        {
          "name": "places/ChIJt-AOOKmhwUcRyyG6Wo81sho/photos/AciIO2cJpU7L5gJdTfrRx1hBgao-XGsQQB3TZFb1qQ5kjX2vbjK08y20VzsnYv2L3yPfKNegBnkfuY-uN4Fi4qJPF2XqRKuMzcrJHHjVCHBxh07scTLznFSwKbHTyhv_Xho1U8Ddlxiae8U0uVs0DmH9aJTvYMtn3nUhwHYJ_FjqFQsly8V1AQ5jNgJiEErIyNbGLR58lJe0rTOS7c_hF9cFwD1TEY4gzcp8X7VzPyIiJ8ejTrJ8MpJ373OBpSHvmz5jMquNCsI1SEcj_-XzEpq1pPFUn0qCJEdP-l9Rcu7cRhj8IQ",
          "widthPx": 2048,
          "heightPx": 1536,
          "authorAttributions": [
            {
              "displayName": "Le Brazier",
              "uri": "https://maps.google.com/maps/contrib/107214664009309218218",
              "photoUri": "https://lh3.googleusercontent.com/a-/ALV-UjV4UvshFMdq5_2VhOJ0jSROH90OtQU8fdZcEbp-gK0GPbodswM8=s100-p-k-no-mo"
            }
          ],
          "flagContentUri": "https://www.google.com/local/imagery/report/?cb_client=maps_api_places.places_api&image_key=!1e10!2sAF1QipPN01KwkLmFiAQlN3mPf8hRByNhlDIJfeXUUFyr&hl=en&gl=BE",
          "googleMapsUri": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sAF1QipPN01KwkLmFiAQlN3mPf8hRByNhlDIJfeXUUFyr!2e10!4m2!3m1!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb"
        },
        {
          "name": "places/ChIJt-AOOKmhwUcRyyG6Wo81sho/photos/AciIO2f_EMXkG3j1Gj0Wwcklx8c7dhTpx1badG63jLR7Nn6SRpxxNr3mB4xq6fLVx2sou4kSvIaklf_cGmu7-XhTJHhwjsJ-Wz8YzEb6EQjylaNG9zI2cBiFr4aJ_VEiHgNelxTDcXv0dKnbqFrEjwdQZ1detQY7FD9eDEICo_ya6H23I5yseGRuu7fl7vnFE-8DTDw1bzPINyYASHXqoOkG25cztduA2jiu8NgHK6GZ4weZ0cSkStY4vAHSfHoJAZdKK6axPo1qjgCRN98DG2GsrjBLlVmi1OTCVfyWmPPahf1JGw",
          "widthPx": 1536,
          "heightPx": 2048,
          "authorAttributions": [
            {
              "displayName": "Le Brazier",
              "uri": "https://maps.google.com/maps/contrib/107214664009309218218",
              "photoUri": "https://lh3.googleusercontent.com/a-/ALV-UjV4UvshFMdq5_2VhOJ0jSROH90OtQU8fdZcEbp-gK0GPbodswM8=s100-p-k-no-mo"
            }
          ],
          "flagContentUri": "https://www.google.com/local/imagery/report/?cb_client=maps_api_places.places_api&image_key=!1e10!2sAF1QipPWzHgez-S3yqr8WM6ZME8zSqoLB39sIthJgY8o&hl=en&gl=BE",
          "googleMapsUri": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sAF1QipPWzHgez-S3yqr8WM6ZME8zSqoLB39sIthJgY8o!2e10!4m2!3m1!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb"
        },
        {
          "name": "places/ChIJt-AOOKmhwUcRyyG6Wo81sho/photos/AciIO2e531WuCTId4-UoWLlYE-9GvAM2-DLDZQvsXIQ0SsFVIyPQauJNLPgvIPA2umTaFDOEUljoy84nPUTBWUbS0B5AwBdpKGbIvNi_IMJNJFgQUxWB9u02NUMt_SYHWutacsPnEEkB3cDyTIrlB3MNY6QeUT5hkLDRt1wPjd-ykI0WKDKXyhS6f17DYdRGekonq_4tnZNiN_TTwD64P7Ob8kbp2cmEvwnUxvr-1LTUBy4DEn4g_VAvHJBrbTw1JJqX836rHwZCORBVlWQJXm_k3C9Ak5ZOBQbjYEQrAzWyn0YRdg",
          "widthPx": 1536,
          "heightPx": 2048,
          "authorAttributions": [
            {
              "displayName": "Le Brazier",
              "uri": "https://maps.google.com/maps/contrib/107214664009309218218",
              "photoUri": "https://lh3.googleusercontent.com/a-/ALV-UjV4UvshFMdq5_2VhOJ0jSROH90OtQU8fdZcEbp-gK0GPbodswM8=s100-p-k-no-mo"
            }
          ],
          "flagContentUri": "https://www.google.com/local/imagery/report/?cb_client=maps_api_places.places_api&image_key=!1e10!2sAF1QipMIKNo2usgu1evvjv2V9BkGsrm9q7C8m1RRn3dl&hl=en&gl=BE",
          "googleMapsUri": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sAF1QipMIKNo2usgu1evvjv2V9BkGsrm9q7C8m1RRn3dl!2e10!4m2!3m1!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb"
        }
      ],
      "outdoorSeating": true,
      "liveMusic": false,
      "menuForChildren": true,
      "servesCocktails": true,
      "servesDessert": true,
      "servesCoffee": true,
      "goodForChildren": true,
      "allowsDogs": false,
      "restroom": true,
      "goodForGroups": true,
      "goodForWatchingSports": false,
      "paymentOptions": {
        "acceptsCreditCards": true,
        "acceptsDebitCards": true,
        "acceptsCashOnly": false,
        "acceptsNfc": true
      },
      "parkingOptions": {
        "freeParkingLot": true,
        "freeStreetParking": true
      },
      "accessibilityOptions": {
        "wheelchairAccessibleParking": true,
        "wheelchairAccessibleEntrance": true,
        "wheelchairAccessibleRestroom": true,
        "wheelchairAccessibleSeating": true
      },
      "addressDescriptor": {
        "landmarks": [
          {
            "name": "places/ChIJqR3sMamhwUcRaMFl7CaUikg",
            "placeId": "ChIJqR3sMamhwUcRaMFl7CaUikg",
            "displayName": {
              "text": "Esso Hingeon",
              "languageCode": "en"
            },
            "types": ["establishment", "gas_station", "point_of_interest"],
            "spatialRelationship": "DOWN_THE_ROAD",
            "straightLineDistanceMeters": 57.762062,
            "travelDistanceMeters": 55.013176
          },
          {
            "name": "places/ChIJQxTfE-ShwUcRhZ4zajS_sn0",
            "placeId": "ChIJQxTfE-ShwUcRhZ4zajS_sn0",
            "displayName": {
              "text": "Pharmacie Jassogne",
              "languageCode": "fr"
            },
            "types": [
              "establishment",
              "health",
              "pharmacy",
              "point_of_interest",
              "store"
            ],
            "straightLineDistanceMeters": 453.2992,
            "travelDistanceMeters": 451.92325
          },
          {
            "name": "places/ChIJha4ocamhwUcR6e81gSe371E",
            "placeId": "ChIJha4ocamhwUcR6e81gSe371E",
            "displayName": {
              "text": "Neo Animalia",
              "languageCode": "en"
            },
            "types": ["establishment", "point_of_interest"],
            "spatialRelationship": "DOWN_THE_ROAD",
            "straightLineDistanceMeters": 121.71671,
            "travelDistanceMeters": 115.54102
          },
          {
            "name": "places/ChIJ5TONrD6hwUcRD2a0Q7uS7Dk",
            "placeId": "ChIJ5TONrD6hwUcRD2a0Q7uS7Dk",
            "displayName": {
              "text": "Tartine & Gourmandise Hingeon",
              "languageCode": "fr"
            },
            "types": [
              "bakery",
              "establishment",
              "food",
              "point_of_interest",
              "store"
            ],
            "straightLineDistanceMeters": 352.80557,
            "travelDistanceMeters": 357.9471
          },
          {
            "name": "places/ChIJSb_JBAChwUcRqn1q_CINszQ",
            "placeId": "ChIJSb_JBAChwUcRqn1q_CINszQ",
            "displayName": {
              "text": "Night and day presse 135 Hingeon 2",
              "languageCode": "fr"
            },
            "types": [
              "book_store",
              "establishment",
              "point_of_interest",
              "store"
            ],
            "spatialRelationship": "DOWN_THE_ROAD",
            "straightLineDistanceMeters": 61.067463,
            "travelDistanceMeters": 53.538223
          }
        ],
        "areas": [
          {
            "name": "places/ChIJlSC7swChwUcRL7iF1IrACyo",
            "placeId": "ChIJlSC7swChwUcRL7iF1IrACyo",
            "displayName": {
              "text": "Hingeon",
              "languageCode": "en"
            },
            "containment": "WITHIN"
          }
        ]
      },
      "googleMapsLinks": {
        "directionsUri": "https://www.google.com/maps/dir//''/data=!4m7!4m6!1m1!4e2!1m2!1m1!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb!3e0?g_mp=Cilnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaE5lYXJieRACGAQgAA",
        "placeUri": "https://maps.google.com/?cid=1923658880659366347&g_mp=Cilnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaE5lYXJieRACGAQgAA",
        "writeAReviewUri": "https://www.google.com/maps/place//data=!4m3!3m2!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb!12e1?g_mp=Cilnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaE5lYXJieRACGAQgAA",
        "reviewsUri": "https://www.google.com/maps/place//data=!4m4!3m3!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb!9m1!1b1?g_mp=Cilnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaE5lYXJieRACGAQgAA",
        "photosUri": "https://www.google.com/maps/place//data=!4m3!3m2!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb!10e5?g_mp=Cilnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaE5lYXJieRACGAQgAA"
      },
      "timeZone": {
        "id": "Europe/Brussels"
      },
      "postalAddress": {
        "regionCode": "BE",
        "languageCode": "en",
        "postalCode": "5380",
        "locality": "Fernelmont",
        "addressLines": ["Grand-Route 68"]
      }
    }
  ]
}
```

In this case, this returns a single response because there is not an urban area. But we could either:

- try to check the list and match the "name" of the restaurant with a levenstein distance (or similar algorithms)
- or use the "search" text with the location bias. However, this location allows a single "type", so at this stage, I'm not sure this will return better results. To investigate.

## Photos

To get better pictures, the Place Photo API must be used: https://developers.google.com/maps/documentation/places/web-service/place-photos

Let's assume a restaurant having this picture:

```json
{
  "name": "places/ChIJt-AOOKmhwUcRyyG6Wo81sho/photos/AciIO2c-w_UTcu1QIAw2wwaRhTVALCSr4B4tVbCicVn5nHSFxj4SIMcVzDlROVHK5UcWaxsR_hhsfpGYcjBffnxhEvthh2QyjppkilFCw_oncRe7hDOi3WINdeY95J0mULZelGVfpCzismIBsNfnsrV8zZfcbCTUNS16li4gLsQR0H2rCSNXGlZBD_E76KSz_o-JoU-BiayAWXS6llhvNpQ0XRYuj83UGIhCHPp8EkJCCRBHnpllJpoj1HoaNQuNVlE6qlBQ7hXtHVvWxnwnP53D3RLjKpDCOjnaWmhpU-rXbl0G5g",
  "widthPx": 2048,
  "heightPx": 1536,
  "authorAttributions": [
    {
      "displayName": "Le Brazier",
      "uri": "https://maps.google.com/maps/contrib/107214664009309218218",
      "photoUri": "https://lh3.googleusercontent.com/a-/ALV-UjV4UvshFMdq5_2VhOJ0jSROH90OtQU8fdZcEbp-gK0GPbodswM8=s100-p-k-no-mo"
    }
  ],
  "flagContentUri": "https://www.google.com/local/imagery/report/?cb_client=maps_api_places.places_api&image_key=!1e10!2sAF1QipOnfqsyhPrnEysCI4MXu-JpBsju6x1aUXqs6G-V&hl=en&gl=BE",
  "googleMapsUri": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sAF1QipOnfqsyhPrnEysCI4MXu-JpBsju6x1aUXqs6G-V!2e10!4m2!3m1!1s0x47c1a1a9380ee0b7:0x1ab2358f5aba21cb"
}
```

The string identifier of this photo is `places/ChIJt-AOOKmhwUcRyyG6Wo81sho/photos/AciIO2c-w_UTcu1QIAw2wwaRhTVALCSr4B4tVbCicVn5nHSFxj4SIMcVzDlROVHK5UcWaxsR_hhsfpGYcjBffnxhEvthh2QyjppkilFCw_oncRe7hDOi3WINdeY95J0mULZelGVfpCzismIBsNfnsrV8zZfcbCTUNS16li4gLsQR0H2rCSNXGlZBD_E76KSz_o-JoU-BiayAWXS6llhvNpQ0XRYuj83UGIhCHPp8EkJCCRBHnpllJpoj1HoaNQuNVlE6qlBQ7hXtHVvWxnwnP53D3RLjKpDCOjnaWmhpU-rXbl0G5g`

The query to get the picture is:

```shell
curl --location --globoff 'https://places.googleapis.com/v1/places/ChIJt-AOOKmhwUcRyyG6Wo81sho/photos/AciIO2c-w_UTcu1QIAw2wwaRhTVALCSr4B4tVbCicVn5nHSFxj4SIMcVzDlROVHK5UcWaxsR_hhsfpGYcjBffnxhEvthh2QyjppkilFCw_oncRe7hDOi3WINdeY95J0mULZelGVfpCzismIBsNfnsrV8zZfcbCTUNS16li4gLsQR0H2rCSNXGlZBD_E76KSz_o-JoU-BiayAWXS6llhvNpQ0XRYuj83UGIhCHPp8EkJCCRBHnpllJpoj1HoaNQuNVlE6qlBQ7hXtHVvWxnwnP53D3RLjKpDCOjnaWmhpU-rXbl0G5g/media?key=••••••&maxHeightPx=1536&maxWidthPx=2048'
```
