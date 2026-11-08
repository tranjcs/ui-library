# Contributing

Thanks for helping keep the catalog useful.

## Adding a library

1. Add an entry to `data/libraries.js` in the right category section (schema in the README).
2. Run `npm run validate`.
3. Preview it with `python3 -m http.server 8080`.
4. Open a pull request.

## Guidelines

- **Notable and maintained:** the project should be actively maintained and reasonably widely used.
- **Neutral descriptions:** describe what it is, not marketing copy. Keep it under 200 characters.
- **`bestFor` is the key field:** one short sentence on when someone should pick it over alternatives.
- **Only list features the project actually offers.** Use `a11y` only when accessibility is an explicit, documented goal.
- **Licenses:** use the SPDX identifier where possible (`MIT`, `Apache-2.0`), or `Commercial`.
- **New enum values** (category, framework, styling, feature): add them to the maps at the top of `data/libraries.js` so the filters pick them up.
