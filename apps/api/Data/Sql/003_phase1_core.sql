alter table if exists imported_transactions
    add column if not exists source_provider text not null default '';

alter table if exists imported_transactions
    add column if not exists external_transaction_id text not null default '';

create table if not exists audit_entries (
    id uuid primary key,
    entity_type text not null,
    entity_id uuid not null,
    action text not null,
    summary text not null,
    detail_json text not null default '{}',
    created_utc timestamptz not null default now()
);

create index if not exists ix_audit_entries_created_utc
    on audit_entries (created_utc desc);