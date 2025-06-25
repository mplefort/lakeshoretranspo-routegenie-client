# Change Log
## Billing Rules outside route genie:
1. MCW/CC - First 5 miles free then rate of mileage for each. Record all miles. All others payers mileage from 0 miles charged.
2. Dead Miles:
  - I: All dead miles
  - MCW/CC: First 15 miles Free. If Ride>15 miles, all miles charged.
3. If Order no show then all other service codeds costs removed? Or charge for full ride + no show?
- No show needs to remove all other codes. This is done. Only inclusa charges a no show service code.

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
