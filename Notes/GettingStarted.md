# Getting started with Route Genie

## Salvatore GSD-23523 ticketThe RouteGenie API connects to individuals payers.
You need to connect a Payer to the API, and would then be able to make authentication requests via that payer connection, and interact with that Payer via the available endpoints from our documentation.

[Documentation](https://documenter.getpostman.com/view/26777355/2s93RZLpYS#917a28e4-8ec6-454b-8dd0-9f3b58773c1d)

Before we dive into that thought could you tell me a little about how you plan to use the API so I can get a better idea about how to steer us toward the configuration that suits your needs best?


# Billing Rules:
1. MCW/CC - First 5 miles free then rate of mileage for each. Record all miles. All others payers mileage from 0 miles charged.
2. Dead Miles:
  - I: All dead miles
  - MCW/CC: First 15 miles Free. If Ride>15 miles, all miles charged.
3. if Order no show then all other service codeds costs removed? Or charge for full ride + no show?
- No show needs to remove all other codes. This is done. Only inclusa charges a no show service code.


## Route Genie Checks
1. 5695	5/27/2025	No show	Inclusa	I	REYNALDO	TREVINO - NO show but added "Order Pick Up Wait Time Quantity" 1 for 12.6 but did not add Service code/modifier.
- Inclusa - No show only charge no show
- Else no show don't charge anything

2. 6674	5/29/2025	Completed	Inclusa	I	STEPHANIE	WINKELHAKE  T2007	RI	117	2622.6 - Wait time calc incorrect in RG
- Take out wait time charges in Payer, use invoice items instead. Find example to parse. Patrick Ferason

3. Deadhead mileage recording werid. Verify.

6623	5/28/2025	Completed	Inclusa	I	MARY	KRAUS
Order Custom Service codes Service code: S0215, Modifier: RD-TP, Quantity:4.0, Cost: 3.2 
Dead Miles Price 3.2

7032	5/30/2025	No show	Inclusa	I	MARY	KRAUS	4/14/1952
Deadhead mileage distance 4.13 
Deadhead mileage compensation "Blank"
only on no shows



4. MCW and CC
- Load fee, $0 loaded mileage first 5 miles, and $X/mi after 5 miles. Unless PU and DO address within same city of Sheboygan


5. Case Manager 
- Drop down custom field as passenger in RG. Or wait for RG to add Case Manager to report?

6. PU invoice item in report? What does that look like for Parsing?

7. **Dead miles** will not be recorded unless the Free dead mile distance exceeds the limit. Then all miles are recorded for cost. Do we want to charge all dead miles then only record for QB 

8. Multi Payers - Same Passenger: Orders 5043, 8582 Keith Proefrock. Has private pay and Shepherd Premier. How should these be invoiced. Ans: Separate payers need separate invoices

## To ask RG issues

#1095 Whats deadhead mileage vs dead miles?

1095 has 9 dead miles for testing
5634 has 16 dead miles for testing
Sol: dead miles will be calculated in script. All dead miles recorddd from 0. IF less then 15 miles do not charge MCW/CC. Charge all dead miles to Inclusa and other payers.

