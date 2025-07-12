# Change Log
## Billing Rules outside route genie:
1. MCW/CC - First 5 miles free then rate of mileage for each. Record all miles. All others payers mileage from 0 miles charged.
2. Dead Miles:
    - I: All dead miles
    - MCW/CC: First 15 miles Free. If Ride>15 miles, all miles charged.
3. No show removes all other codes. This is done. Only inclusa charges a no show service code.
4. Billing Freq Filter: Daily, Weekly, Monthly. Creates qb sync only for selected frequency and Blanks in billing freq

## V1.0.8
- Fix bug on mappings

## V1.0.7
- Auto updater added
- Show log version on start

## V1.0.6
- Google cached mileage rounded to nearest mile on pull for loaded/unloaded miles.
- show logs from View menu
- show mileage cache db from View menu

## V1.0.5
- Electron Forge for compiling
- Auto updated add

## V1.0.4
- Google maps API added to replace RG
- data/mileage_cache.db to store cache of Google Maps routes. Schema below. Use DB Browser to edit overwrite fields as needed.
CREATE TABLE mileage_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          passenger_last_name TEXT NOT NULL,
          passenger_first_name TEXT NOT NULL,
          PU_address TEXT NOT NULL,
          DO_address TEXT NOT NULL,
          RG_miles REAL NOT NULL,
          Google_miles REAL NOT NULL,
          overwrite_miles REAL,
          RG_dead_miles REAL NOT NULL,
          Google_dead_miles REAL NOT NULL,
          overwrite_dead_miles REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

## V1.0.3
- Billing frequency filter added
- Invoice numbers always sequential increment.

## V1.0.2
- QB invoice description includes " | RG_ORDER_IDs" for back tracing.

## V1.0.1
- Add service start/end date tracking in QB sync from RouteGenie Date Of Service
- Track earliest and latest service dates per invoice for QB Service Start Date and Service End Date fields
- Updated QB sync headers to match latest QuickBooks import template

## V1.0.0
- PP_X mapped to PP service codes
- QB sync invoices now group by Passenger Name / Auth number
- QB invoice num starting from input
- Cleaned up logging, singleton setup of logger for all modules to share
- MCW/CC Free if <5 miles, then full mileage charge. All other payers pay full mileage
