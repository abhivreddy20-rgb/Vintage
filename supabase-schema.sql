create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  message text not null
);

alter table public.enquiries enable row level security;

drop policy if exists "Service role can manage enquiries" on public.enquiries;
drop policy if exists "Anyone can submit enquiries" on public.enquiries;

create policy "Service role can manage enquiries"
on public.enquiries
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create or replace function public.submit_enquiry(
  enquiry_name text,
  enquiry_email text,
  enquiry_message text
)
returns public.enquiries
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_enquiry public.enquiries;
begin
  if length(trim(enquiry_name)) = 0
    or length(trim(enquiry_email)) = 0
    or length(trim(enquiry_message)) = 0 then
    raise exception 'Name, email, and details are required.';
  end if;
  if length(trim(enquiry_name)) > 120
    or length(trim(enquiry_email)) > 254
    or length(trim(enquiry_message)) > 2000 then
    raise exception 'Enquiry is too long.';
  end if;

  insert into public.enquiries (name, email, message)
  values (trim(enquiry_name), trim(enquiry_email), trim(enquiry_message))
  returning * into saved_enquiry;

  return saved_enquiry;
end;
$$;

revoke all on function public.submit_enquiry(text, text, text) from public;
grant execute on function public.submit_enquiry(text, text, text) to anon;
