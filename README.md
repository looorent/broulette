# BiteRoulette

## Source of data

Here are the source of data I plan to pull to get the most complete source of restaurant:
* OpenStreetMap (OSM) / Overpass API
* Google Place

## TODO

* Use localstorage for the preferences 
* Add a tag "unknow opening hours"
* Add a tag "Reservation possible"
* add TripAdvisor
* Investigate why restaurant "Respire Restaurant" does not find any photo
* Investigate why "La Terrasse de l'Abbaye de Notre-Dame du Vivier" does not find any equivalent on Google
* Fuzzy string comparison might be shitty
* "Source tag" is ugly
* Error that is not catched by the circuit breaker: ```
    Error: [OSM] Fetching OSM restaurants: server failed after 4054 ms with status code 504
    at fetchAllRestaurantsNearby (/Users/lorent/development/broulette/src/app/features/overpass.server/client.ts:176:11)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at ExecuteWrapper.invoke (/Users/lorent/development/broulette/src/node_modules/cockatiel/src/common/Executor.ts:52:21)
    at NoopPolicy.execute (/Users/lorent/development/broulette/src/node_modules/cockatiel/src/NoopPolicy.ts:18:26)
    at fetchAllRestaurantsNearbyWithRetry (/Users/lorent/development/broulette/src/app/features/overpass.server/client.ts:14:10)
    at findRestaurantsFromOverpass (/Users/lorent/development/broulette/src/app/features/search-engine.server/discovery/overpass.ts:20:22)
    at discoverNearbyRestaurants (/Users/lorent/development/broulette/src/app/features/search-engine.server/discovery/scanner.ts:60:10)
    at RestaurantDiscoveryScanner.nextRestaurants (/Users/lorent/development/broulette/src/app/features/search-engine.server/discovery/scanner.ts:27:22)
    at searchCandidate (/Users/lorent/development/broulette/src/app/features/search-engine.server/engine.ts:34:25)
    at action (/Users/lorent/development/broulette/src/app/routes/searches.$searchId_.candidates._index.ts:12:23)
    at file:///Users/lorent/development/broulette/src/node_modules/react-router-devtools/dist/context.js:115:17
    at file:///Users/lorent/development/broulette/src/node_modules/react-router-devtools/dist/server.js:305:19
    at callRouteHandler (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-PMGK554W.mjs:506:16)
    at file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-WWGJGFF6.mjs:4679:19
    at callLoaderOrAction (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-WWGJGFF6.mjs:4731:16)
    at async Promise.all (index 0)
    at defaultDataStrategy (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-WWGJGFF6.mjs:4366:17)
    at callDataStrategyImpl (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-WWGJGFF6.mjs:4625:17)
    at callDataStrategy (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-WWGJGFF6.mjs:3693:19)
    at submit (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-WWGJGFF6.mjs:3497:21)
    at queryImpl (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-WWGJGFF6.mjs:3432:23)
    at Object.query (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-WWGJGFF6.mjs:3307:18)
    at singleFetchAction (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-PMGK554W.mjs:769:18)
    at handleSingleFetchRequest (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-PMGK554W.mjs:1283:45)
    at requestHandler (file:///Users/lorent/development/broulette/src/node_modules/react-router/dist/development/chunk-PMGK554W.mjs:1126:18)
    at nodeHandler (/Users/lorent/development/broulette/src/node_modules/@react-router/dev/dist/vite.js:3499:30)
    at /Users/lorent/development/broulette/src/node_modules/@react-router/dev/dist/vite.js:3505:17
```