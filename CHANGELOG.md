# 0.0.3 (2026-01-09)

* Reject restaurants without image url or without unknown opening hours, but try to return them as fallback if nothing else is returned.
* Do not display redundant website urls. (e.g. if tripadvisor.com and tripadvisor.be)
* Remove the `const` enums from Drizzle. Use `types` and literals only.
* Reorganize folders: move everything to the root folder, and rename `app/` to `src`.
