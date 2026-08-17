# FFFDMS Backend Calculations, Fuel Request Workflow & Fraud Detection Logic

**Project:** Fleet Fuel Fraud Detection & Management System (FFFDMS)  
**Target Audience:** Backend Developers, Monitor/Intermediary Mobile Developers, Admin Portal Developers & System Auditors  
**Document Version:** `2.0.0`  
**Date:** August 2026  

---

## 1. Overview

The Fleet Fuel Fraud Detection & Management System (FFFDMS) uses a controlled communication model between the **Admin** and a **Monitor/Intermediary**.

The **driver does not have a system account and does not communicate directly with the backend**.

Instead:

```text
Driver
   │
   │ Physical communication / instruction
   ▼
Monitor / Intermediary
   │
   │ Mobile/Web application
   ▼
Backend
   │
   ▼
Admin Portal
   │
   ▼
Admin
```

The Admin communicates only with the Monitor/Intermediary through the system.

The Monitor/Intermediary is responsible for submitting fuel requests and providing the information required by the Admin. The Admin reviews requests, approves or rejects them, and the Monitor receives the corresponding response.

Currently, the system has **one Monitor/Intermediary**, but the architecture must support **multiple monitors in the future**.

The Driver remains an entity managed by the Admin and associated with a vehicle, but **the Driver does not have a login account**.

---

# 2. System Actors

## 2.1 Admin

The Admin operates the Admin Portal.

The Admin is responsible for:

- Managing drivers
- Managing vehicles
- Managing monitors/intermediaries
- Reviewing fuel requests
- Reviewing odometer images
- Comparing entered odometer values with the image
- Approving or rejecting pre-fuel requests
- Reviewing completed fuel transactions
- Monitoring fraud/risk alerts
- Reviewing transaction history
- Investigating suspicious transactions
- Managing the overall fleet fuel process

The Admin communicates through the system only with the Monitor/Intermediary.

---

## 2.2 Monitor / Intermediary

The Monitor is the communication intermediary between the drivers and the Admin.

The Monitor:

- Has a system account
- Logs into the Monitor application
- Controls/coordinates fuel requests for drivers
- Selects the relevant driver and vehicle
- Creates the initial fuel request before fueling
- Captures and submits the odometer image
- Receives Admin approval/rejection
- Coordinates the actual fueling
- Submits the completed fueling information after fuel is filled
- Uploads the fuel receipt
- Provides the final odometer information
- Receives responses and request statuses from the Admin

### Important

The Monitor is **not the Driver**.

The Monitor is an authenticated system user.

The Driver is only a managed entity and has **no system account**.

---

## 2.3 Driver

The Driver:

- Does not have a username/password
- Does not log into the system
- Does not directly submit requests
- Does not directly receive backend responses
- Exists in the Admin Portal as a managed driver record
- Is associated with a vehicle
- Is represented in fuel requests through the Monitor

Example:

```text
Driver:
Abebe Kebede

Driver Account:
NONE

Vehicle:
AA-3-12345

Monitor:
Monitor 01
```

The backend should identify the driver through the fuel request/transaction relationship rather than through driver authentication.

---

# 3. Communication Model

The communication model is:

```text
                    ┌─────────────────┐
                    │      ADMIN      │
                    │   Admin Portal  │
                    └────────┬────────┘
                             │
                             │ Request / Response
                             │
                    ┌────────▼────────┐
                    │     BACKEND     │
                    │  API + Database │
                    └────────┬────────┘
                             │
                             │ Request / Response
                             │
                    ┌────────▼────────┐
                    │     MONITOR     │
                    │ Mobile/Web App  │
                    └────────┬────────┘
                             │
                             │ Physical coordination
                             │
                    ┌────────▼────────┐
                    │     DRIVER      │
                    │ No System Login │
                    └─────────────────┘
```

### Core Principle

The Admin does not communicate directly with a Driver through the application.

All operational requests and responses pass between:

```text
Admin ↔ Backend ↔ Monitor
```

The Driver is represented as a managed entity inside the system.

---

# 4. Fuel Process Phases

The fuel process has **two major phases**.

## Phase 1 — Pre-Fueling Request

Before fuel is filled, the Monitor creates a fuel request.

The request contains:

- Fuel type
- Requested fuel quantity
- Price per liter
- Current odometer reading
- Odometer reading image

The purpose of this phase is to allow the Admin to verify the request before fueling takes place.

---

## Phase 2 — Post-Fueling Completion

After the Admin approves the request and the fuel is filled, the Monitor submits the actual fueling information.

The completion request contains:

- Fuel station name/location
- Fuel type
- Fuel quantity
- Price per liter
- Odometer reading
- Receipt number
- Fuel date/time
- Fuel receipt image

The backend then performs the complete transaction calculations and fraud detection.

---

# 5. Phase 1 — Pre-Fueling Request

## 5.1 Purpose

The first request is a **fuel authorization request**, not yet a completed fuel transaction.

The Monitor submits the request to the backend.

The backend creates a pending request.

The Admin sees the request in a dedicated Admin Portal tab.

Example Admin Portal tab:

```text
Fuel Requests
```

The Admin can then:

- Open the request
- View driver information
- View vehicle information
- View requested fuel information
- Open the odometer image
- Zoom the image
- Compare the image reading with the entered odometer value
- Approve the request
- Reject the request
- Provide a rejection reason where applicable

---

# 6. Phase 1 Input Fields

The Monitor submits the following information.

| Field | Type | Required | Description |
|---|---|---|---|
| `driverId` | ID | Yes | Driver associated with the request |
| `vehicleId` | ID | Yes | Vehicle associated with the request |
| `fuelType` | Text | Yes | `PETROL` or `DIESEL` |
| `fuelQuantity` | Number | Yes | Requested fuel quantity in liters |
| `pricePerLiter` | Number | Yes | Current/requested price per liter |
| `odometerReading` | Number | Yes | Current vehicle odometer reading |
| `odometerImage` | File | Yes | Photo of the actual vehicle odometer |

### Important

`odometerImage` is **mandatory**.

The system must not allow the Monitor to submit a Phase 1 request without an odometer image.

The purpose is to reduce the possibility of manually entering a false odometer value.

---

# 7. Odometer Verification

The odometer information consists of two pieces of evidence:

```text
1. odometerReading
2. odometerImage
```

The Admin must verify both.

Example:

```text
Entered Odometer:
45,300 km

Odometer Image:
[Image showing 45,300 km]
```

The Admin should be able to:

- Open the image
- Zoom in
- View the original image
- Compare the displayed odometer digits with the entered number

### Verification Rule

The entered value and visible image value should match.

If they do not match:

```text
Request = REJECTED
```

The Admin should provide a rejection reason.

Example:

```text
"Entered odometer reading does not match the uploaded odometer image."
```

---

# 8. Phase 1 Odometer Validation

The backend must also compare the submitted odometer value with the vehicle's previous stored odometer.

```text
O_current >= O_prev
```

If:

```text
O_current < O_prev
```

the backend rejects the request.

Response:

```text
HTTP 400 Bad Request
```

Example message:

```text
"Odometer cannot be less than previous reading (45,000 km)."
```

This prevents a Monitor from submitting an odometer value lower than the last known vehicle reading.

---

# 9. Phase 1 Request Status

A Phase 1 request should have a lifecycle similar to:

```text
PENDING
   │
   ├──────────────► APPROVED
   │
   └──────────────► REJECTED
```

### PENDING

The request has been submitted and is waiting for Admin review.

### APPROVED

The Admin has reviewed the request and authorized the Monitor to proceed with fueling.

### REJECTED

The Admin has rejected the request.

A rejection should contain a reason.

Example:

```json
{
  "status": "REJECTED",
  "rejectionReason": "Odometer image does not match the entered reading."
}
```

---

# 10. Admin Fuel Request Tab

The Admin Portal must provide a dedicated tab for Phase 1 requests.

Recommended tab:

```text
Fuel Requests
```

The Admin should be able to see:

| Information | Description |
|---|---|
| Request ID | Unique request identifier |
| Driver | Managed driver |
| Vehicle | Assigned vehicle |
| Plate Number | Vehicle plate |
| Monitor | Monitor who submitted the request |
| Fuel Type | PETROL/DIESEL |
| Requested Quantity | Requested liters |
| Price/Liter | Requested price |
| Odometer Reading | Entered odometer |
| Odometer Image | Uploaded image |
| Request Date | Submission date/time |
| Status | PENDING/APPROVED/REJECTED |

---

# 11. Admin Request Review

When the Admin opens a pending request, the backend should provide all required information.

Example:

```text
Fuel Request
──────────────────────────────
Request ID: FR-000001

Driver:
Abebe Kebede

Vehicle:
Isuzu Truck

Plate:
AA-3-12345

Monitor:
Monitor 01

Fuel Type:
DIESEL

Requested Quantity:
45 L

Price/Liter:
72.50 ETB

Odometer:
45,300 km

Previous Odometer:
45,000 km

Distance Since Last Reading:
300 km

Odometer Image:
[View / Zoom]

Status:
PENDING
──────────────────────────────
[ APPROVE ]     [ REJECT ]
```

---

# 12. Admin Approval

When the Admin approves the request:

```text
Request Status = APPROVED
```

The backend records:

- Admin ID
- Approval timestamp
- Request status
- Original request information

Example:

```json
{
  "status": "APPROVED",
  "approvedBy": "adminId",
  "approvedAt": "2026-08-17T09:00:00.000Z"
}
```

The Monitor receives the approval response.

Only an approved request should proceed to the post-fueling completion phase.

---

# 13. Admin Rejection

When the Admin rejects a request:

```text
Request Status = REJECTED
```

The backend should record:

- Admin ID
- Rejection timestamp
- Rejection reason

Example:

```json
{
  "status": "REJECTED",
  "rejectedBy": "adminId",
  "rejectedAt": "2026-08-17T09:00:00.000Z",
  "rejectionReason": "Odometer image does not match entered reading."
}
```

The Monitor receives the rejection response.

A rejected request must not be converted into a completed fuel transaction.

---

# 14. Phase 2 — Post-Fueling Completion Request

After the Admin approves the Phase 1 request and the fuel has actually been filled, the Monitor submits the second request.

This request represents the actual fuel transaction.

---

# 15. Phase 2 Input Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `fuelRequestId` | ID | Yes | Approved Phase 1 request |
| `fuelStationName` | Text | Yes | Fuel station name/location |
| `fuelType` | Text | Yes | `PETROL` or `DIESEL` |
| `fuelQuantity` | Number | Yes | Actual fuel quantity in liters |
| `pricePerLiter` | Number | Yes | Actual price per liter |
| `odometerReading` | Number | Yes | Current vehicle odometer reading |
| `receiptNumber` | Text | Yes | Fuel station receipt number |
| `fuelDate` | ISO Date | Yes | Actual fuel purchase date/time |
| `receiptImage` | File | No | Fuel receipt image |

---

# 16. Phase 2 Validation

Before creating the final transaction, the backend must verify:

### 16.1 Request Exists

```text
fuelRequestId must exist
```

### 16.2 Request Is Approved

```text
fuelRequest.status == APPROVED
```

A request that is:

```text
PENDING
```

or:

```text
REJECTED
```

cannot be completed.

### 16.3 Monitor Authorization

The authenticated Monitor must be authorized to submit the request.

The backend should verify that the Monitor has access to the relevant request.

### 16.4 Driver Exists

The associated driver must exist and be active.

### 16.5 Vehicle Exists

The associated vehicle must exist and be active.

### 16.6 Odometer Validation

The final odometer must not be lower than the vehicle's current stored odometer.

```text
O_current >= O_prev
```

---

# 17. Phase 1 vs Phase 2

| Feature | Phase 1 | Phase 2 |
|---|---|---|
| Purpose | Request authorization | Record actual fueling |
| Driver | Selected/identified | Same driver |
| Vehicle | Selected/identified | Same vehicle |
| Fuel Type | Required | Required |
| Fuel Quantity | Requested quantity | Actual quantity |
| Price/Liter | Requested price | Actual price |
| Odometer | Required | Required |
| Odometer Image | **Required** | Not specified |
| Fuel Station | Not required | Required |
| Receipt Number | Not required | Required |
| Fuel Date | Not required | Required |
| Receipt Image | Not required | Optional |
| Admin Approval | Required | Based on approved Phase 1 request |
| Fraud Calculation | Preliminary/validation only | Full transaction calculation |
| Risk Scoring | Not final | Full fraud engine |
| Transaction Created | No | Yes |

---

# 18. Relationship Between Requests and Transactions

A Phase 1 request and Phase 2 transaction must be linked.

```text
Fuel Request
      │
      │ fuelRequestId
      ▼
Fuel Transaction
```

Example:

```text
Fuel Request:
FR-000001

Status:
APPROVED

        │
        ▼

Fuel Transaction:
FT-000001

fuelRequestId:
FR-000001
```

This creates a complete audit trail from:

```text
Request → Approval → Fueling → Transaction → Fraud Analysis
```

---

# 19. Phase 2 Core Mathematical Calculations

After the actual fueling information is submitted, the backend performs the full calculations.

---

## 19.1 Total Fuel Cost

```text
Total Amount = round(Q_actual × P_actual, 2)
```

Example:

```text
Q_actual = 45.5 L
P_actual = 65.00 ETB/L

Total Amount = 45.5 × 65
             = 2957.50 ETB
```

---

## 19.2 Distance Traveled

```text
Distance Traveled = O_current - O_prev
```

Example:

```text
O_prev = 125,400 km
O_current = 125,700 km

Distance Traveled = 300 km
```

---

## 19.3 Expected Fuel Consumption

Using the vehicle's Average Fuel Consumption (`AFE`):

```text
Expected Fuel = Distance Traveled / AFE
```

Example:

```text
Distance = 300 km
AFE = 10 km/L

Expected Fuel = 300 / 10
              = 30 L
```

---

## 19.4 Fuel Difference

```text
Fuel Difference = Q_actual - Expected Fuel
```

Example:

```text
Q_actual = 45 L
Expected Fuel = 30 L

Fuel Difference = +15 L
```

---

## 19.5 Variance Percentage

```text
Variance Percentage =
((Q_actual - Expected Fuel) / Expected Fuel) × 100
```

Example:

```text
Q_actual = 45 L
Expected Fuel = 30 L

Variance =
((45 - 30) / 30) × 100
= 50%
```

### Edge Case

If:

```text
Distance Traveled = 0
```

and:

```text
Q_actual > 0
```

then:

```text
Variance Percentage = 100%
```

---

# 20. Phase 1 Preliminary Calculation

The Phase 1 request contains fuel quantity, price, and odometer information.

Therefore, the backend may calculate preliminary values to assist the Admin during review:

```text
Estimated Total Amount
Distance Since Previous Odometer
Estimated Fuel Consumption
Estimated Variance
```

These values are **not the final transaction calculations**.

The final calculations must be performed again using the actual Phase 2 fueling information.

This is important because:

```text
Requested Quantity ≠ necessarily Actual Quantity
```

and:

```text
Requested Price ≠ necessarily Actual Price
```

---

# 21. Transaction Status Logic

The final transaction status is determined from the Phase 2 variance percentage.

| Status | Variance | Description |
|---|---:|---|
| `NORMAL` | `< 15%` | Consumption aligns with expected baseline |
| `WARNING` | `15% – 30%` | Moderate excess fuel claimed |
| `HIGH_RISK` | `> 30%` | Severe over-consumption detected |

Logic:

```text
IF variance < 15%
    status = NORMAL

ELSE IF variance >= 15% AND variance <= 30%
    status = WARNING

ELSE
    status = HIGH_RISK
```

---

# 22. Fraud Detection & Risk Scoring

The backend executes the fraud detection engine after the Phase 2 transaction is submitted.

Each triggered rule adds points to:

```text
riskScore
```

and an explanation to:

```text
fraudReasons
```

---

# 23. Risk Level Categories

```text
IF Risk Score <= 30
    Risk Level = LOW

ELSE IF Risk Score >= 31 AND Risk Score <= 60
    Risk Level = MEDIUM

ELSE IF Risk Score >= 61 AND Risk Score <= 100
    Risk Level = HIGH

ELSE
    Risk Level = CRITICAL
```

---

# 24. Active Fraud Rules

The backend evaluates the following fraud rules.

| Rule Code | Rule Description | Trigger Condition | Score |
|---|---|---|---:|
| `EXPECTED_FUEL_EXCEEDED` | Fuel exceeds expected consumption | Variance `> 20%` | +30 |
| `SEVERE_FUEL_VARIANCE` | Severe fuel variance | Variance `> 40%` | +50 |
| `MULTIPLE_FUELING_SAME_DAY` | Multiple fueling same day | Vehicle fueled `>= 2` times on same calendar date | +20 |
| `MONTHLY_ABOVE_AVERAGE` | Monthly consumption above average | Current month fuel volume `> 30%` above 6-month historical monthly average | +20 |
| `DUPLICATE_RECEIPT` | Duplicate receipt number | Same `receiptNumber` already exists | +50 |
| `LATE_RECEIPT` | Late submission | `submittedAt - fuelDate > 3 days` | +10 |
| `OUTSIDE_WORKING_HOURS` | Off-hours fueling | Fueling time `< 08:00` or `>= 18:00` | +10 |
| `REPEATED_FUEL_STATION` | Station bias | Same station used for `> 70%` of submissions during last 3 months | +10 |
| `REPEATED_ROUNDED_QUANTITIES` | Suspicious rounding | `>= 4` of last 5 transactions have fuel quantities divisible by 5 | +10 |

---

# 25. Fraud Rule Details

## 25.1 EXPECTED_FUEL_EXCEEDED

Trigger:

```text
Variance Percentage > 20%
```

Score:

```text
+30
```

---

## 25.2 SEVERE_FUEL_VARIANCE

Trigger:

```text
Variance Percentage > 40%
```

Score:

```text
+50
```

This rule can be triggered together with `EXPECTED_FUEL_EXCEEDED`.

---

## 25.3 MULTIPLE_FUELING_SAME_DAY

Trigger:

```text
Vehicle fueling count on the same date >= 2
```

Score:

```text
+20
```

---

## 25.4 MONTHLY_ABOVE_AVERAGE

Historical period:

```text
6 months
```

Trigger:

```text
Current Month Fuel >
6-Month Historical Monthly Average × 1.30
```

Score:

```text
+20
```

---

## 25.5 DUPLICATE_RECEIPT

Trigger:

```text
Same receiptNumber already exists in database
```

Score:

```text
+50
```

---

## 25.6 LATE_RECEIPT

Trigger:

```text
submittedAt - fuelDate > 3 days
```

Score:

```text
+10
```

---

## 25.7 OUTSIDE_WORKING_HOURS

Approved hours:

```text
08:00 - 18:00
```

Trigger:

```text
Fueling time < 08:00
OR
Fueling time >= 18:00
```

Score:

```text
+10
```

---

## 25.8 REPEATED_FUEL_STATION

Historical period:

```text
Last 3 months
```

Trigger:

```text
Same station usage > 70%
```

Score:

```text
+10
```

---

## 25.9 REPEATED_ROUNDED_QUANTITIES

Historical transactions:

```text
Last 5 fuel transactions
```

Trigger:

```text
At least 4 of the last 5 transactions
have fuel quantities divisible by 5
```

Score:

```text
+10
```

---

# 26. Important Difference Between Phase 1 and Fraud Detection

Phase 1 is primarily a **preventive authorization and verification process**.

Phase 2 is the **actual transaction and fraud analysis process**.

Therefore:

```text
PHASE 1
Request
   ↓
Odometer Verification
   ↓
Admin Review
   ↓
Approve / Reject
```

Then:

```text
PHASE 2
Actual Fueling
   ↓
Final Fuel Information
   ↓
Receipt
   ↓
Backend Calculations
   ↓
Fraud Detection
   ↓
Risk Score
   ↓
Transaction
```

---

# 27. Example End-to-End Scenario

## 27.1 Initial State

```text
Driver:
Abebe Kebede

Vehicle:
Isuzu Truck

Plate:
AA-3-12345

Monitor:
Monitor 01

Previous Odometer:
45,000 km

Average Fuel Consumption:
10 km/L
```

The Driver needs fuel.

The Driver communicates with the Monitor.

The Driver does not log into the system.

---

## 27.2 Phase 1 Request

The Monitor submits:

```text
driverId: DRIVER-001
vehicleId: VEHICLE-001

fuelType: DIESEL
fuelQuantity: 45 L
pricePerLiter: 72.50 ETB
odometerReading: 45,300 km

odometerImage:
[uploaded image]
```

The backend validates:

```text
45,300 >= 45,000
```

The request is accepted and stored as:

```text
status = PENDING
```

---

## 27.3 Admin Review

The Admin opens:

```text
Fuel Requests
```

The Admin sees:

```text
Driver:
Abebe Kebede

Vehicle:
Isuzu Truck

Plate:
AA-3-12345

Monitor:
Monitor 01

Fuel:
45 L DIESEL

Odometer:
45,300 km

Previous:
45,000 km

Odometer Image:
[View / Zoom]
```

The Admin verifies that the image shows:

```text
45,300 km
```

which matches the entered value.

The Admin approves the request.

```text
status = APPROVED
```

---

# 28. Phase 2 Completion

The Monitor proceeds with fueling.

After fuel is filled, the Monitor submits:

```text
fuelRequestId: FR-000001

fuelStationName: NOC Bole
fuelType: DIESEL
fuelQuantity: 45 Liters
pricePerLiter: 72.50 ETB
odometerReading: 45,300 km
receiptNumber: RCP-003
fuelDate: 2026-08-17T14:00:00.000Z
receiptImage: [uploaded receipt]
```

The backend verifies:

```text
FR-000001 exists
FR-000001.status == APPROVED
Monitor is authorized
Driver exists
Vehicle exists
Odometer is valid
```

The transaction can now be processed.

---

# 29. Final Calculation Example

Given:

```text
Fuel Quantity = 45 L
Price = 72.50 ETB/L
Previous Odometer = 45,000 km
Current Odometer = 45,300 km
AFE = 10 km/L
```

### Total Amount

```text
45 × 72.50
= 3262.50 ETB
```

### Distance

```text
45,300 - 45,000
= 300 km
```

### Expected Fuel

```text
300 / 10
= 30 L
```

### Fuel Difference

```text
45 - 30
= +15 L
```

### Variance

```text
((45 - 30) / 30) × 100
= 50%
```

### Transaction Status

```text
50% > 30%

status = HIGH_RISK
```

The fraud engine then evaluates all active rules.

---

# 30. Example Fraud Score

If the following rules are triggered:

```text
EXPECTED_FUEL_EXCEEDED       +30
SEVERE_FUEL_VARIANCE         +50
DUPLICATE_RECEIPT             +50
OUTSIDE_WORKING_HOURS         +10
```

Then:

```text
Risk Score = 30 + 50 + 50 + 10
           = 140
```

Therefore:

```text
Risk Level = CRITICAL
```

---

# 31. Final Transaction Record

Example:

```json
{
  "_id": "FT-000001",
  "fuelRequestId": "FR-000001",
  "driverId": "DRIVER-001",
  "vehicleId": "VEHICLE-001",
  "monitorId": "MONITOR-001",

  "fuelStationName": "NOC Bole",
  "fuelType": "DIESEL",
  "fuelQuantity": 45,
  "pricePerLiter": 72.5,
  "totalAmount": 3262.5,

  "previousOdometer": 45000,
  "odometerReading": 45300,
  "distanceTraveled": 300,

  "expectedFuel": 30,
  "fuelDifference": 15,
  "variancePercentage": 50,

  "receiptNumber": "RCP-003",
  "fuelDate": "2026-08-17T14:00:00.000Z",

  "status": "HIGH_RISK",
  "riskScore": 140,
  "riskLevel": "CRITICAL",

  "fraudReasons": [
    "Fuel exceeds expected consumption by more than 20%.",
    "Fuel exceeds expected consumption by more than 40%.",
    "Duplicate receipt number detected.",
    "Fuel transaction occurred outside approved working hours."
  ],

  "reviewStatus": "PENDING"
}
```

---

# 32. Audit Trail

Because the Admin and Monitor communicate through the system, the backend should maintain an audit trail.

The system should record:

### Phase 1

```text
Request Created
Submitted By Monitor
Submitted At
Odometer Image
Odometer Reading
Admin Reviewed
Admin Approved/Rejected
Approval/Rejection Time
Rejection Reason
```

### Phase 2

```text
Completion Submitted
Submitted By Monitor
Fuel Station
Actual Fuel Quantity
Actual Price
Final Odometer
Receipt Number
Receipt Image
Fuel Date
Transaction Created
Fraud Analysis Completed
Risk Score
Risk Level
Review Status
```

This allows the organization to reconstruct the complete history of every fueling event.

---

# 33. Monitor Authentication

Only the Monitor/Intermediary and Admin should have system accounts.

Example:

```text
Admin Account
    ↓
Admin Portal

Monitor Account
    ↓
Monitor Mobile/Web App
```

The Driver does not have an authentication account.

### Current System

```text
1 Admin
1 Monitor
Many Drivers
Many Vehicles
```

### Future System

```text
Many Admins
Many Monitors
Many Drivers
Many Vehicles
```

The database and authorization model should therefore use `monitorId` rather than assuming there will always be exactly one Monitor.

---

# 34. Driver Data Model Concept

A Driver should be stored as a managed entity.

Example:

```json
{
  "_id": "DRIVER-001",
  "fullName": "Abebe Kebede",
  "phoneNumber": "+251911223344",
  "licenseNumber": "ETH-DL-987654",
  "status": "ACTIVE",
  "assignedVehicleId": "VEHICLE-001"
}
```

There should be no:

```text
username
password
login credentials
JWT account
```

for the Driver.

---

# 35. Monitor Data Model Concept

A Monitor should have an authenticated account.

Example:

```json
{
  "_id": "MONITOR-001",
  "username": "monitor01",
  "fullName": "Monitor 01",
  "role": "MONITOR",
  "isActive": true
}
```

The Monitor's identity should be attached to every request submitted by the Monitor.

---

# 36. Important Backend Principles

## 36.1 Driver Is Not an Authenticated User

The Driver is a managed fleet entity.

```text
Driver ≠ System User
```

---

## 36.2 Monitor Is the Operational User

The Monitor is responsible for communicating fuel requests and completed transactions.

```text
Monitor = Authenticated Operational User
```

---

## 36.3 Admin Is the Approver

The Admin controls the authorization workflow.

```text
Monitor → Request → Admin
Admin → Approval/Rejection → Monitor
```

---

## 36.4 Phase 1 Must Be Completed Before Phase 2

The backend must not accept a final transaction unless its associated request has been approved.

```text
PENDING  → Cannot complete
REJECTED → Cannot complete
APPROVED → Can complete
```

---

## 36.5 Odometer Image Is Mandatory in Phase 1

The entered odometer value alone is not sufficient.

The Monitor must provide:

```text
odometerReading
+
odometerImage
```

The Admin uses the image as verification evidence.

---

## 36.6 Final Fraud Analysis Uses Actual Fueling Data

Fraud calculations should use Phase 2 data because it represents what actually happened at the fuel station.

The Phase 1 values are authorization/request values.

---

## 36.7 Requested and Actual Values Must Be Auditable

The backend should preserve both phases.

For example:

```text
Requested Quantity:
45 L

Actual Quantity:
47 L
```

The system should not overwrite the original request.

Both values must remain available for auditing.

---

# 37. Complete Backend Processing Flow

```text
Driver needs fuel
        │
        ▼
Driver communicates with Monitor
        │
        ▼
Monitor selects Driver + Vehicle
        │
        ▼
Monitor creates Phase 1 Request
        │
        ├── Fuel Type
        ├── Requested Quantity
        ├── Price/Liter
        ├── Odometer
        └── Odometer Image
        │
        ▼
Backend validates request
        │
        ▼
Request = PENDING
        │
        ▼
Admin Portal
"Fuel Requests" Tab
        │
        ▼
Admin reviews request
        │
        ├───────────────┐
        ▼               ▼
    APPROVE           REJECT
        │               │
        │               └──► Monitor receives rejection
        │
        ▼
Monitor proceeds with fueling
        │
        ▼
Actual fuel is filled
        │
        ▼
Monitor submits Phase 2
        │
        ├── Fuel Station
        ├── Fuel Type
        ├── Actual Quantity
        ├── Actual Price
        ├── Odometer
        ├── Receipt Number
        ├── Fuel Date
        └── Receipt Image
        │
        ▼
Backend validates approved request
        │
        ▼
Calculate Total Amount
        │
        ▼
Calculate Distance
        │
        ▼
Calculate Expected Fuel
        │
        ▼
Calculate Fuel Difference
        │
        ▼
Calculate Variance
        │
        ▼
Determine Transaction Status
        │
        ▼
Run Fraud Rules
        │
        ▼
Calculate Risk Score
        │
        ▼
Determine Risk Level
        │
        ▼
Store Final Transaction
        │
        ▼
Update Vehicle Odometer
        │
        ▼
Generate Fraud/Risk Notifications
        │
        ▼
Admin Reviews Transaction
```

---

# 38. Formula Quick Reference

| Calculation | Formula |
|---|---|
| Total Amount | `Q_actual × PricePerLiter` |
| Distance | `O_current - O_prev` |
| Expected Fuel | `Distance / AFE` |
| Fuel Difference | `Q_actual - Expected Fuel` |
| Variance % | `((Q_actual - Expected Fuel) / Expected Fuel) × 100` |
| Risk Score | `Sum of all triggered fraud rule points` |

---

# 39. Status Quick Reference

## Phase 1 Request Status

```text
PENDING
   │
   ├──► APPROVED
   │
   └──► REJECTED
```

## Final Transaction Status

```text
Variance < 15%
    ↓
NORMAL

15% ≤ Variance ≤ 30%
    ↓
WARNING

Variance > 30%
    ↓
HIGH_RISK
```

## Risk Level

```text
Score ≤ 30
    ↓
LOW

31 ≤ Score ≤ 60
    ↓
MEDIUM

61 ≤ Score ≤ 100
    ↓
HIGH

Score > 100
    ↓
CRITICAL
```

---

# 40. Fraud Rule Quick Reference

```text
EXPECTED_FUEL_EXCEEDED       +30
SEVERE_FUEL_VARIANCE         +50
MULTIPLE_FUELING_SAME_DAY    +20
MONTHLY_ABOVE_AVERAGE        +20
DUPLICATE_RECEIPT             +50
LATE_RECEIPT                  +10
OUTSIDE_WORKING_HOURS         +10
REPEATED_FUEL_STATION         +10
REPEATED_ROUNDED_QUANTITIES   +10
```

Maximum possible score:

```text
30 + 50 + 20 + 20 + 50 + 10 + 10 + 10 + 10
= 210
```

Therefore:

```text
Maximum Risk Level = CRITICAL
```

---

# 41. Recommended API-Level Concept

The backend should conceptually separate the two phases.

## Phase 1 APIs

```text
POST   /fuel-requests
GET    /fuel-requests
GET    /fuel-requests/:id
PATCH  /fuel-requests/:id/approve
PATCH  /fuel-requests/:id/reject
```

The Admin uses the approval/rejection endpoints.

The Monitor uses the request creation and request-status endpoints.

---

## Phase 2 API

```text
POST /fuel-transactions
GET  /fuel-transactions/:id
GET  /fuel-transactions
```

The Phase 2 transaction must contain:

```text
fuelRequestId
```

and the backend must verify:

```text
fuelRequest.status == APPROVED
```

before creating the transaction.

---

# 42. Final Architecture Summary

The final business architecture is:

```text
                         ADMIN
                           │
                           │
                    Admin Portal
                           │
                           ▼
                    ┌────────────┐
                    │   Backend  │
                    └─────┬──────┘
                          │
                          │
                    Monitor Account
                          │
                    Monitor App
                          │
                          ▼
                       Drivers
                    (No Accounts)
```

The fuel workflow is:

```text
DRIVER
  │
  │ communicates with
  ▼
MONITOR
  │
  │ Phase 1 Request
  ▼
BACKEND
  │
  ▼
ADMIN
  │
  ├── APPROVE ──────────────► MONITOR
  │
  └── REJECT ───────────────► MONITOR
                                │
                                ▼
                         Actual Fueling
                                │
                                ▼
                           MONITOR
                                │
                                │ Phase 2
                                ▼
                            BACKEND
                                │
                                ▼
                       Calculations
                                │
                                ▼
                       Fraud Detection
                                │
                                ▼
                         Risk Scoring
                                │
                                ▼
                         Final Transaction
                                │
                                ▼
                              ADMIN
```

---

## Document End

**Project:** Fleet Fuel Fraud Detection & Management System  
**Document:** Backend Calculations, Fuel Request Workflow & Fraud Detection Logic  
**Version:** `2.0.0`  
**Date:** August 2026
