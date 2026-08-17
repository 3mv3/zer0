# Zero Sum Finance App - Product Spec

## Product Summary

This application replaces the current spreadsheet-driven zero-sum finance workflow with a ledger-backed planning app for one household.

The app must support two parallel planning views:

- Pay-cycle budgeting for monthly cashflow from the 25th to the 25th
- Calendar-month forecasting for gifts, events, holidays, and sinking fund planning

The app is both a planner and a transaction tracker.

## Phase 1 Scope

Phase 1 should support only current active plans and current live accounts.

In-scope accounts:

- Joint account
- AMEX
- BA card
- Savings
- Emergency fund
- Cash

In-scope modules:

- Bank-connected transaction feed
- Transaction inbox and acknowledgment workflow
- Pay-cycle budget view
- Gifts and event planning
- Sinking fund forecast
- Savings tracker
- Debt tracker
- Refund tracking
- Partner reimbursement tracking
- Bill tracker
- Audit trail

Out of scope for phase 1:

- Historical workbook migration beyond active plans
- Automatic classification
- Advanced debt payoff optimization
- Net worth modeling beyond later expansion

## Core Product Rules

### Time Model

- Monthly budgets use pay cycles from the 25th to the 25th
- Gifts, events, holidays, and sinking fund planning use calendar months
- The system must allow a planned event in a calendar month to influence a pay-cycle budget where dates overlap

### Access Model

- Budgets, forecasts, and planning structures are read-only for the partner
- Transactions made on the partner's card, or transactions routed to categories assigned to the partner, must be sent to the partner for classification and breakdown
- The partner must be able to view what they currently owe and mark transfers as sent

### Transaction Accountability

- Every transaction must be acknowledged
- An unacknowledged transaction is an exception state and should be visually prominent
- A transaction is only acknowledged when:
  - category is assigned
  - funding source is assigned
  - split is checked
  - refund status is checked
  - user explicitly confirms it

### Funding Source Rules

- For phase 1, a funding source can only be a person or a pot
- A pot is a generic source bucket and may represent:
  - a household budget
  - a personal budget
  - a sinking fund pot
  - a savings pot
  - an emergency fund pot
  - a refund pending bucket
  - another planned source of money
- Transactions may be split across multiple funding sources
- Each split line must point to exactly one funding source

### Overspend Handling

Per pot, configure one of these behaviors:

- reduce remaining allowance
- take from another funding source
- require manual resolution

Manual resolution must create a visible issue that remains open until explicitly resolved.

### Carry Forward

- Carry-forward behavior is configurable per pot
- Examples:
  - food may not carry forward
  - holidays usually do carry forward
  - contingency may carry with rules later

### Refund Handling

- Refunds must reduce available spend pressure immediately, before the money physically returns
- Refunds move value into a pending refund bucket immediately
- Partial refunds must partially release budget pressure immediately
- Card balances must still reflect the original card transaction until the actual refund settles

### Partner Reimbursement Handling

- Partner-paid responsibility is a real tracked balance, not a note
- Example flow:
  - a card transaction is booked on a shared card
  - the transaction or split is marked as partner-responsible
  - partner reimbursement due increases
  - if part of the purchase is returned, partner reimbursement due drops accordingly
  - when partner transfers money, the reimbursement balance is cleared against that transfer

## Domain Model

### Household and People

- `Household`
- `User`
- `Person`
- `RoleAssignment`

The `Person` model represents a real-world owner or responsible party. A `User` is a login.

### Accounts and Banking

- `InstitutionConnection`
- `Account`
- `AccountBalanceSnapshot`
- `Transaction`
- `TransactionMerchant`

Account types for phase 1:

- bank current account
- credit card
- savings account
- emergency savings account
- cash/manual account

### Transaction Processing

- `Transaction`
- `TransactionSplit`
- `TransactionAcknowledgment`
- `TransactionIssue`
- `RefundCase`
- `ReimbursementCase`

Recommended `Transaction` fields:

- external id
- account id
- posted date
- pending date if available
- amount
- merchant name
- normalized description
- transaction type
- cardholder if known
- pay-cycle id
- acknowledgment status

Recommended `TransactionSplit` fields:

- transaction id
- amount
- category id
- funding source type (`person` or `pot`)
- funding source id
- responsible person id if different
- refund expectation amount
- notes

### Planning and Budgets

- `PayCycle`
- `Category`
- `Pot`
- `PotRule`
- `BudgetAllocation`
- `BudgetAdjustment`
- `TransferPlan`

The `Pot` should be the main planning primitive. Different pot types can drive different UI behavior.

Suggested pot types:

- household budget
- personal budget
- sinking fund
- holiday
- savings
- emergency
- contingency
- refund pending
- reimbursement due

### Events and Forecasting

- `Event`
- `EventRecurrence`
- `EventInstance`
- `EventBudgetItem`
- `EventOffset`

Use one generic event model for:

- birthdays
- anniversaries
- Christmas
- one-off events
- holidays
- major life plans

Event features:

- recurrence rules
- tags
- planned amount
- actual amount
- copied-from-prior-year reference
- change history with reason
- global event status such as `planned` or `committed`

Each event budget item should support:

- planned amount
- committed amount
- paid amount
- refunded amount
- purchase date
- paid with account
- sinking fund impact month

### Savings and Debt

- `SavingsGoal`
- `SavingsMovement`
- `DebtAccount`
- `DebtSnapshot`

Debt fields for phase 1:

- lender
- current balance
- monthly payment
- interest rate
- start date
- target end date

### Bills and Audit

- `RecurringBill`
- `RecurringBillSuggestion`
- `AuditLog`
- `AuditReason`

Every meaningful action should write an audit record, including:

- what changed
- old value
- new value
- who changed it
- when it changed
- optional reason
- linked object id

## Key Workflows

### 1. Transaction Inbox

Goal: no transaction goes unaccounted for.

Workflow:

1. Transactions sync from connected accounts
2. Each new transaction enters the inbox as unacknowledged
3. The transaction is routed to the right person when needed
4. The user reviews category, funding source, and split
5. The user marks refund pending if applicable
6. The user confirms the transaction
7. Any unresolved conflict remains as an open issue

Red-state conditions:

- no category assigned
- no funding source assigned
- split total does not match transaction amount
- refund expectation not reviewed
- manual resolution required but unresolved

### 2. Pay-Cycle Budgeting

Goal: show available money by pot within the active 25th-25th cycle.

The pay-cycle view should show:

- planned allocation per pot
- actual spend per pot
- remaining available per pot
- overspend handling rule per pot
- pending refunds affecting available amount
- partner reimbursement due
- required transfers between pots

This replaces the spreadsheet behavior where weekly columns became less useful over time. Phase 1 should optimize for total cycle visibility, not week buckets.

### 3. Reallocation and Manual Resolution

Examples:

- move 100 from food to sinking fund in a specific cycle
- temporarily fund one spend from another pot
- leave an exception open until the user decides what to do

Every reallocation must create an audit entry and should optionally require a reason.

### 4. Events and Sinking Fund Forecast

Goal: convert future obligations into planned funding requirements.

Workflow:

1. Create or update recurring events and one-off events
2. Create event instances for the relevant year
3. Assign planned values and months due
4. Feed event requirements into sinking fund forecast by calendar month
5. When event items are paid, reduce future required funding and record actuals

This is the replacement for the current Gifts plus Sinking Fund spreadsheet chain.

### 5. Holiday Planning

Holiday plans are specialized events.

Required features:

- global status such as `planned` or `committed`
- line items with planned, paid, refunded, and payment method details
- offsets from normal monthly budgets such as food and fuel
- optional contributions from fun budgets
- direct sinking fund impact by month

If a holiday item is already paid, that future burden should disappear from the forecast and surface in the actual plan history.

### 6. Partner Reimbursement

Goal: accurately track what the partner owes without waiting for statement payment dates.

Workflow:

1. Shared-card transaction is created
2. Split line is marked partner-responsible
3. Reimbursement due balance increases
4. Refund expectation reduces the due balance immediately if part is being sent back
5. Partner sees current balance due
6. Partner marks a transfer as sent
7. Main user matches transfer and clears the case

### 7. Bill Tracking

Phase 1 behavior:

- manually maintain recurring bills
- detect candidate recurring transactions from the bank feed
- suggest recurring bill creation
- alert when a recurring bill changes amount materially
- show trend history over time

## MVP Screens

- Dashboard
- Transaction Inbox
- Active Pay Cycle
- Pots and Budgets
- Event Calendar
- Sinking Fund Forecast
- Holiday Plan Detail
- Savings
- Debt
- Bills
- Partner Owes
- Audit Log

## Recommended Technical Architecture

### Frontend

- Web-first application with mobile-responsive UI
- Installable PWA for quick phone access
- Later wrap with Capacitor only if native packaging is needed

Why:

- one codebase
- easier household sharing
- faster to ship than separate native apps
- enough for phase 1 read-heavy and form-heavy workflows

Recommended stack:

- Next.js
- TypeScript
- Tailwind CSS
- component library only if it does not fight dense finance workflows

### Backend

- PostgreSQL database
- Prisma or Drizzle ORM
- Next.js server routes or a separate API service if scaling later demands it
- background job runner for sync, routing, reminders, and recurring event generation

Recommended backend concerns:

- ledger-safe transaction ingest
- idempotent sync processing
- audit logging middleware
- rules engine for pot behavior and routing

### Banking Integration

For a UK-first product, use an Open Banking provider.

Recommended order:

1. TrueLayer for UK-focused bank connectivity and good Open Banking coverage
2. GoCardless Bank Account Data if pricing and connection coverage fit better
3. Plaid only if future geography becomes a stronger requirement than UK-first depth

Important limitation:

- live feed usually means near-real-time sync, not truly continuous streaming
- card and merchant enrichment quality varies by institution
- some credit-card data can lag or expose weaker metadata than debit accounts

Design assumption:

- sync on webhook where available
- otherwise poll on a short interval
- keep imported raw transactions immutable
- build user classification and planning layers on top of imported data

## Phase 1 Delivery Recommendation

### MVP Order

1. household, users, accounts, pay cycles, pots
2. bank sync and transaction inbox
3. transaction acknowledgment and split workflow
4. pay-cycle budget view
5. partner reimbursement and refund tracking
6. events and sinking fund forecast
7. holiday planning
8. savings, debt, and bill tracking
9. audit log and reporting polish

### Must-Have MVP Success Criteria

- all imported transactions are visible and cannot be forgotten
- every transaction can be acknowledged, split, and funded
- active cycle remaining amounts are trustworthy
- partner reimbursement due is always current
- refunds release budget pressure immediately
- recurring events and holidays feed the sinking fund forecast clearly
- every important planning adjustment is auditable with reason

## Unresolved But Non-Blocking Follow-Ups

- whether weekly sub-allowances should reappear later as an optional view
- whether net worth should expand beyond liquid accounts and debts
- whether auto-classification should be added once enough manual data exists
- whether notification rules should be per person, per account, or per issue type