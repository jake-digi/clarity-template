create or replace function notify_teams_on_online_order()
returns trigger
language plpgsql
as $$
declare
  body jsonb;
begin
  -- Only fire for Online orders (extra safeguard in case trigger WHEN changes)
  if NEW.method is distinct from 'Online' then
    return NEW;
  end if;

  body := jsonb_build_object(
    'order_id', NEW.id,
    'order_number', NEW.order_number,
    'order_date', NEW.order_date,
    'customer_name', NEW.name,
    'account_ref', NEW.account_ref,
    'items_gross', NEW.items_gross
  );

  perform net.http_post(
    url := current_setting('app.teams_order_webhook_url', true),
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := jsonb_build_object('order', body)
  );

  return NEW;
end;
$$;

drop trigger if exists notify_teams_on_online_order_insert on sales_orders;

create trigger notify_teams_on_online_order_insert
  after insert on sales_orders
  for each row
  when (NEW.method = 'Online')
  execute function notify_teams_on_online_order();

