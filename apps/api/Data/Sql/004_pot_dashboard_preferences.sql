alter table if exists pots
    add column if not exists show_on_dashboard boolean not null default true;