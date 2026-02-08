# 0.0.6 (2026-02-06)

* [Technical] Move the circuit breakers' states from isolated workers to Cloudflare's KeyStore

# 0.0.5 (2026-02-05)

* [Technical] Add a rate limiter by IP to search addresses (use Cloudfare's KV)
* [Technical] Add a cache on the address searches to prevent too many calls to the underlying APIs.

# 0.0.4 (2026-02-03)

* [Feature] Use the device location (when available) as a bias when searching for addresses (via Photon and Nominatim)
* [Feature] During search, stream information to the user in realtime
* [Technical] Improve the retrieval of geolocation from the browser API (using cache and different accuracy modes)
* [Technical] First bunch of automated tests
* [Performance] Parallel calls to external APIs to enrich restaurants

# 0.0.3 (2026-01-09)

* [Feature] Reject restaurants without image url or without unknown opening hours, but try to return them as fallback if nothing else is returned.
* [Feature] Do not display redundant website urls. (e.g. if tripadvisor.com and tripadvisor.be)
* [Technical] Remove the `const` enums from Drizzle. Use `types` and literals only.
* [Technical] Reorganize folders: move everything to the root folder, and rename `app/` to `src`.
* [Technical] Remove compatibility flag to support nodejs
* [Bug] Remove error from serviceworker: `Uncaught (in promise) non-precached-url: non-precached-url :: [{"url":"index.html"}]`
