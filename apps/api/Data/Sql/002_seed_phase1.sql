insert into households (id, name, base_currency, owner_name, partner_name)
values (
    '25f335ab-9d0d-4cd8-a7c3-2f05963c70c1',
    'Varley Household',
    'GBP',
    'Matt',
    'Kris'
)
on conflict (id) do update
set
    name = excluded.name,
    base_currency = excluded.base_currency,
    owner_name = excluded.owner_name,
    partner_name = excluded.partner_name;

with cycle as (
    select
        case
            when extract(day from current_date)::int < 25 then (date_trunc('month', current_date) - interval '1 month' + interval '24 day')::date
            else (date_trunc('month', current_date) + interval '24 day')::date
        end as start_date
)
insert into pay_cycles (id, household_id, label, start_date, end_date, is_current)
select
    '350bd72b-7aad-4c26-b088-cd9f5f84af95',
    '25f335ab-9d0d-4cd8-a7c3-2f05963c70c1',
    to_char(start_date, 'DD Mon') || ' - ' || to_char((start_date + interval '1 month')::date, 'DD Mon'),
    start_date,
    (start_date + interval '1 month')::date,
    true
from cycle
on conflict (id) do update
set
    label = excluded.label,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    is_current = excluded.is_current;

update pay_cycles
set is_current = false
where id <> '350bd72b-7aad-4c26-b088-cd9f5f84af95';

insert into accounts (id, household_id, name, account_type, balance, currency, is_joint)
values
    ('6f9ec0b2-7f04-4869-b9c7-5556ec8a9445', '25f335ab-9d0d-4cd8-a7c3-2f05963c70c1', 'Joint', 'bank', 2150.24, 'GBP', true),
    ('f66af5f3-e362-4cd1-9ddf-32c630cd4f5f', '25f335ab-9d0d-4cd8-a7c3-2f05963c70c1', 'AMEX', 'credit-card', -1456.54, 'GBP', true),
    ('7c33828d-2168-42c0-a6c0-e7b3cb1e56d6', '25f335ab-9d0d-4cd8-a7c3-2f05963c70c1', 'BA', 'credit-card', -1488.45, 'GBP', true),
    ('25467066-bd35-484c-8d51-c7aa5dd2d6d2', '25f335ab-9d0d-4cd8-a7c3-2f05963c70c1', 'Emergency', 'savings', 3326.11, 'GBP', false)
on conflict (id) do update
set
    name = excluded.name,
    account_type = excluded.account_type,
    balance = excluded.balance,
    currency = excluded.currency,
    is_joint = excluded.is_joint;

insert into pots (id, household_id, name, pot_type, planned_amount, actual_amount, remaining_amount, owner_name, overspend_rule, carry_forward_enabled)
values
    ('fd005179-018e-4c51-b9a2-21e9b118f1d7', '25f335ab-9d0d-4cd8-a7c3-2f05963c70c1', 'Food', 'household-budget', 400.00, 292.81, 107.19, 'Household', 'reduce-remaining', false),
    ('8e3fc9b9-f8e0-4d99-828e-a5cedb6bd4f0', '25f335ab-9d0d-4cd8-a7c3-2f05963c70c1', 'Gift', 'sinking-fund', 250.00, 180.96, 69.04, 'Household', 'manual-resolution', true),
    ('3c58f65b-9f0c-4244-9088-5f37a20cb857', '25f335ab-9d0d-4cd8-a7c3-2f05963c70c1', 'Matt Fun', 'personal-budget', 532.68, 518.24, 14.44, 'Matt', 'take-from-another-source', false),
    ('376c6ed2-87bf-4b16-8aa1-fa645ec19098', '25f335ab-9d0d-4cd8-a7c3-2f05963c70c1', 'Monthly Contingency', 'contingency', 50.00, 68.28, -18.28, 'Household', 'manual-resolution', false)
on conflict (id) do update
set
    name = excluded.name,
    pot_type = excluded.pot_type,
    planned_amount = excluded.planned_amount,
    actual_amount = excluded.actual_amount,
    remaining_amount = excluded.remaining_amount,
    owner_name = excluded.owner_name,
    overspend_rule = excluded.overspend_rule,
    carry_forward_enabled = excluded.carry_forward_enabled;

insert into events (id, household_id, name, event_type, status, due_date, spend_window_start, spend_window_end, planned_amount, funded_amount, actual_amount, notes)
values
    ('cbe8fdb8-d26a-412c-bca4-662846415f04', '25f335ab-9d0d-4cd8-a7c3-2f05963c70c1', 'Charlotte Wedding', 'event', 'committed', (current_date + interval '10 day')::date, (current_date - interval '5 day')::date, (current_date + interval '12 day')::date, 252.98, 252.98, 252.98, 'Tracked as an active summer event and fully funded.'),
    ('16622be5-3114-42a1-b40c-cf3bcfa1c6f5', '25f335ab-9d0d-4cd8-a7c3-2f05963c70c1', 'Kris Birthday', 'birthday', 'active', (current_date + interval '18 day')::date, (current_date - interval '3 day')::date, (current_date + interval '20 day')::date, 20.00, 20.00, 35.00, 'Planned at 20 but current spend is already above forecast.'),
    ('d0da3ff7-280f-443f-8ded-4cbe7b6b6e5f', '25f335ab-9d0d-4cd8-a7c3-2f05963c70c1', 'Bali 2026', 'holiday', 'planned', (current_date + interval '45 day')::date, (current_date - interval '10 day')::date, (current_date + interval '25 day')::date, 1787.00, 1787.00, 199.00, 'Flights have started to come out, but most of the trip remains forecasted.')
on conflict (id) do update
set
    name = excluded.name,
    event_type = excluded.event_type,
    status = excluded.status,
    due_date = excluded.due_date,
    spend_window_start = excluded.spend_window_start,
    spend_window_end = excluded.spend_window_end,
    planned_amount = excluded.planned_amount,
    funded_amount = excluded.funded_amount,
    actual_amount = excluded.actual_amount,
    notes = excluded.notes;

delete from event_tags where event_id in (
    'cbe8fdb8-d26a-412c-bca4-662846415f04',
    '16622be5-3114-42a1-b40c-cf3bcfa1c6f5',
    'd0da3ff7-280f-443f-8ded-4cbe7b6b6e5f'
);

insert into event_tags (event_id, tag)
values
    ('cbe8fdb8-d26a-412c-bca4-662846415f04', 'gift'),
    ('cbe8fdb8-d26a-412c-bca4-662846415f04', 'one-off'),
    ('16622be5-3114-42a1-b40c-cf3bcfa1c6f5', 'gift'),
    ('16622be5-3114-42a1-b40c-cf3bcfa1c6f5', 'recurring'),
    ('d0da3ff7-280f-443f-8ded-4cbe7b6b6e5f', 'holiday'),
    ('d0da3ff7-280f-443f-8ded-4cbe7b6b6e5f', 'sinking-fund');

delete from event_items where event_id in (
    'cbe8fdb8-d26a-412c-bca4-662846415f04',
    '16622be5-3114-42a1-b40c-cf3bcfa1c6f5',
    'd0da3ff7-280f-443f-8ded-4cbe7b6b6e5f'
);

insert into event_items (id, event_id, name, planned_amount, actual_amount, status)
values
    ('f7e19ca8-151d-409c-9845-d3cdb589bff5', 'cbe8fdb8-d26a-412c-bca4-662846415f04', 'Gift', 200.00, 200.00, 'paid'),
    ('46051562-25ff-4a22-b1cb-8e7aa0f1dff9', 'cbe8fdb8-d26a-412c-bca4-662846415f04', 'Travel', 52.98, 52.98, 'paid'),
    ('6efc4dd5-6140-43cb-a3d5-9b83c624a684', '16622be5-3114-42a1-b40c-cf3bcfa1c6f5', 'Gift', 20.00, 35.00, 'paid'),
    ('fb311c20-1988-414e-8e70-d64e7bfa8f34', 'd0da3ff7-280f-443f-8ded-4cbe7b6b6e5f', 'Flights', 1787.00, 199.00, 'partially-paid'),
    ('ff0dfa03-df8f-4600-8a73-0418f8a7c24c', 'd0da3ff7-280f-443f-8ded-4cbe7b6b6e5f', 'Spending Money', 700.00, 0.00, 'planned');

delete from active_obligations where event_id in (
    'cbe8fdb8-d26a-412c-bca4-662846415f04',
    '16622be5-3114-42a1-b40c-cf3bcfa1c6f5',
    'd0da3ff7-280f-443f-8ded-4cbe7b6b6e5f'
);

insert into active_obligations (id, event_id, item_name, spend_window_start, spend_window_end, planned_amount, funded_amount, actual_amount, variance_amount, variance_status, resolution_status)
values
    ('dc97c3db-a4c3-430e-baac-eb07af17eab9', 'cbe8fdb8-d26a-412c-bca4-662846415f04', 'Gift', (current_date - interval '5 day')::date, (current_date + interval '12 day')::date, 252.98, 252.98, 252.98, 0.00, 'on-budget', 'resolved'),
    ('84d6da41-88e0-48df-9a49-c8c5d352f1c7', '16622be5-3114-42a1-b40c-cf3bcfa1c6f5', 'Gift', (current_date - interval '3 day')::date, (current_date + interval '20 day')::date, 20.00, 20.00, 35.00, 15.00, 'over-budget', 'open'),
    ('4cd7fc06-2d6c-4f7d-8779-445ac26bb012', 'd0da3ff7-280f-443f-8ded-4cbe7b6b6e5f', 'Flights', (current_date - interval '10 day')::date, (current_date + interval '25 day')::date, 1787.00, 1787.00, 199.00, -1588.00, 'in-progress', 'open');

insert into imported_transactions (id, household_id, account_name, merchant, amount, transaction_date, category, funding_source, owner_name, requires_partner_review, is_acknowledged, is_split, refund_pending, notes)
values
    ('33416db0-13df-4678-8036-6ebf3d7123be', '25f335ab-9d0d-4cd8-a7c3-2f05963c70c1', 'Joint', 'Tesco', 42.18, (current_date - interval '1 day')::date, 'Food', 'Food', 'Household', false, false, false, false, 'Debit transaction from the joint account.'),
    ('7aa1f4ba-201e-4767-9173-7b2a2a22fc7e', '25f335ab-9d0d-4cd8-a7c3-2f05963c70c1', 'AMEX', 'Zara', 120.00, (current_date - interval '2 day')::date, 'Unassigned', 'Kris', 'Kris', true, false, true, true, 'Kris card spend waiting for split confirmation and refund tracking.'),
    ('74d6e751-c5a8-4a48-a58a-9f43ce771376', '25f335ab-9d0d-4cd8-a7c3-2f05963c70c1', 'BA', 'British Airways', 199.00, (current_date - interval '4 day')::date, 'Holiday', 'Bali 2026', 'Household', false, true, false, false, 'Flight deposit already matched to the Bali event.')
on conflict (id) do update
set
    account_name = excluded.account_name,
    merchant = excluded.merchant,
    amount = excluded.amount,
    transaction_date = excluded.transaction_date,
    category = excluded.category,
    funding_source = excluded.funding_source,
    owner_name = excluded.owner_name,
    requires_partner_review = excluded.requires_partner_review,
    is_acknowledged = excluded.is_acknowledged,
    is_split = excluded.is_split,
    refund_pending = excluded.refund_pending,
    notes = excluded.notes;

delete from transaction_splits where transaction_id in (
    '33416db0-13df-4678-8036-6ebf3d7123be',
    '7aa1f4ba-201e-4767-9173-7b2a2a22fc7e',
    '74d6e751-c5a8-4a48-a58a-9f43ce771376'
);

insert into transaction_splits (id, transaction_id, category, funding_source, amount, notes)
values
    ('0ef08f0f-7daa-45bb-8d59-2f17764f6a72', '33416db0-13df-4678-8036-6ebf3d7123be', 'Food', 'Food', 42.18, 'Weekly groceries'),
    ('6cdbb56d-4b45-4312-990e-81c9d1bd6fca', '7aa1f4ba-201e-4767-9173-7b2a2a22fc7e', 'Clothes', 'Kris', 60.00, 'Items being kept'),
    ('834248fa-7ae8-4ee9-a2b1-9b62691b9758', '7aa1f4ba-201e-4767-9173-7b2a2a22fc7e', 'Refund Pending', 'Kris', 60.00, 'Expected return'),
    ('d50bdb50-183d-4c28-bc9b-7ffd4ced7e21', '74d6e751-c5a8-4a48-a58a-9f43ce771376', 'Holiday', 'Bali 2026', 199.00, 'Deposit');
