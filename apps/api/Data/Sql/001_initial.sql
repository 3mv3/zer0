create table if not exists households (
    id uuid primary key,
    name text not null,
    base_currency text not null,
    owner_name text not null,
    partner_name text not null,
    created_utc timestamptz not null default now()
);

create table if not exists pay_cycles (
    id uuid primary key,
    household_id uuid not null references households(id),
    label text not null,
    start_date date not null,
    end_date date not null,
    is_current boolean not null default false
);

create table if not exists pots (
    id uuid primary key,
    household_id uuid not null references households(id),
    name text not null,
    pot_type text not null,
    planned_amount numeric(12, 2) not null,
    actual_amount numeric(12, 2) not null,
    remaining_amount numeric(12, 2) not null,
    owner_name text not null,
    overspend_rule text not null,
    carry_forward_enabled boolean not null default false
);

create table if not exists events (
    id uuid primary key,
    household_id uuid not null references households(id),
    name text not null,
    event_type text not null,
    status text not null,
    due_date date not null,
    spend_window_start date not null,
    spend_window_end date not null,
    planned_amount numeric(12, 2) not null,
    funded_amount numeric(12, 2) not null,
    actual_amount numeric(12, 2) not null,
    notes text not null default ''
);

create table if not exists event_items (
    id uuid primary key,
    event_id uuid not null references events(id) on delete cascade,
    name text not null,
    planned_amount numeric(12, 2) not null,
    actual_amount numeric(12, 2) not null,
    status text not null
);

create table if not exists imported_transactions (
    id uuid primary key,
    household_id uuid not null references households(id),
    account_name text not null,
    merchant text not null,
    amount numeric(12, 2) not null,
    transaction_date date not null,
    category text not null,
    funding_source text not null,
    owner_name text not null,
    is_acknowledged boolean not null default false,
    is_split boolean not null default false,
    refund_pending boolean not null default false,
    notes text not null default ''
);

create table if not exists transaction_splits (
    id uuid primary key,
    transaction_id uuid not null references imported_transactions(id) on delete cascade,
    category text not null,
    funding_source text not null,
    amount numeric(12, 2) not null,
    notes text not null default ''
);
