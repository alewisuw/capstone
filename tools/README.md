# Federal District Data Builder

This script downloads Elections Canada federal electoral district boundaries and produces a
simplified GeoJSON file for the mobile app.

## Requirements
- Node.js
- `npx` (for `mapshaper`)
- Network access to the Elections Canada boundary ZIP

## Usage
```
node tools/build_federal_districts_data.js
```

Optional environment variables:
- `DISTRICT_ZIP_URL` (override data source URL)
- `DISTRICT_SHP_PATH` (use a local `.shp` file instead of downloading)
- `DISTRICT_NAME_FIELD` (default: `FEDENAME`)
- `DISTRICT_ID_FIELD` (default: `FEDUID`)
- `DISTRICT_SIMPLIFY` (default: `8%`)

Output:
- `mobile/src/data/federalDistricts2023.json`
