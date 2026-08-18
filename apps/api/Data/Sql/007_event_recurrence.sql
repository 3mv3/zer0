alter table if exists events
    add column if not exists recurrence_rule text not null default 'one-time';

update events
set recurrence_rule = case
    when lower(event_type) = 'birthday' then 'yearly'
    else 'one-time'
end
where recurrence_rule is null
   or recurrence_rule = '';