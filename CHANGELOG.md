# 0.0.3 (2026-01-09)

* [Feature] Reject restaurants without image url or without unknown opening hours, but try to return them as fallback if nothing else is returned.
* [Feature] Do not display redundant website urls. (e.g. if tripadvisor.com and tripadvisor.be)
* [Technical] Remove the `const` enums from Drizzle. Use `types` and literals only.
* [Technical] Reorganize folders: move everything to the root folder, and rename `app/` to `src`.
* [Technical] Remove compatibility flag to support nodejs
* [Bug] Remove error from serviceworker: `Uncaught (in promise) non-precached-url: non-precached-url :: [{"url":"index.html"}]`
