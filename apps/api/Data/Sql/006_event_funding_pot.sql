alter table if exists events
    add column if not exists funding_pot_id uuid null references pots(id);

update events
set funding_pot_id = (
    select pots.id
    from pots
    where pots.household_id = events.household_id
        and pots.pot_type in ('big-pot', 'sinking-fund', 'holiday', 'savings', 'emergency')
    order by pots.name asc
    limit 1
)
where events.funding_pot_id is null;