alter table if exists imported_transactions
    add column if not exists event_id uuid null references events(id);