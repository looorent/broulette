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

* Observations:
    * TripAdvisor does not work?
    * TripAdvisor addresses are bof
    * TripAdvisor: no countryCode
    * no description?
* Use localstorage for the preferences 
* Investigate why restaurant "Respire Restaurant" does not find any photo
* Investigate why "La Terrasse de l'Abbaye de Notre-Dame du Vivier" does not find any equivalent on Google
* Fuzzy string comparison might be shitty
* Overpass fails and is not retried:
```
Scanning range (iteration 1): 3000m...
[OSM] Fetching all OSM restaurants nearby '50.4665284,4.8661892'...
[Balancer] overpass:https://overpass-api.de/api/interpreter failed. Failing over...
[OSM] Fetching all OSM restaurants nearby '50.4665284,4.8661892'...
[Balancer] overpass:https://maps.mail.ru/osm/tools/overpass/api/interpreter failed. Failing over...
[OSM] Fetching all OSM restaurants nearby '50.4665284,4.8661892'...
[Balancer] overpass:https://overpass.private.coffee/api/interpreter failed. Failing over...
Error: All providers failed.
    at LoadBalancer.execute (/Users/lorent/development/broulette/src/app/features/balancer.server/balancer.ts:42:11)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at RestaurantDiscoveryScanner.nextRestaurants (/Users/lorent/development/broulette/src/app/features/discovery.server/scanner.ts:31:22)
    at findNextValidCandidate (/Users/lorent/development/broulette/src/app/features/search-engine.server/engine.ts:41:25)
    at searchCandidate (/Users/lorent/development/broulette/src/app/features/search-engine.server/engine.ts:23:28)
    at action (/Users/lorent/development/broulette/src/app/routes/searches.$searchId_.candidates._index.ts:16:23)
    at callRouteHandler (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-YNUBSHFH.mjs:508:16)
    at file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-JMJ3UQ3L.mjs:4762:19
    at callLoaderOrAction (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-JMJ3UQ3L.mjs:4814:16)
    at async Promise.all (index 0)
    at defaultDataStrategy (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-JMJ3UQ3L.mjs:4439:17)
    at callDataStrategyImpl (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-JMJ3UQ3L.mjs:4708:17)
    at callDataStrategy (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-JMJ3UQ3L.mjs:3748:19)
    at submit (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-JMJ3UQ3L.mjs:3552:21)
    at queryImpl (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-JMJ3UQ3L.mjs:3487:23)
    at Object.query (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-JMJ3UQ3L.mjs:3362:18)
    at singleFetchAction (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-YNUBSHFH.mjs:771:18)
    at handleSingleFetchRequest (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-YNUBSHFH.mjs:1285:45)
    at requestHandler (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-YNUBSHFH.mjs:1128:18)
    at nodeHandler (/Users/lorent/development/broulette/src/node_modules/@react-router/dev/dist/vite.js:3523:30)
    at /Users/lorent/development/broulette/src/node_modules/@react-router/dev/dist/vite.js:3529:17

```