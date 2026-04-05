create schema if not exists editorial;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'directus_app') then
    create role directus_app login password 'directus_app';
  else
    alter role directus_app with login password 'directus_app';
  end if;
end
$$;

grant connect on database contexto_fc to directus_app;

grant usage on schema core to directus_app;
grant usage on schema editorial to directus_app;
grant usage, create on schema public to directus_app;

grant select on all tables in schema core to directus_app;

alter default privileges in schema core
  grant select on tables to directus_app;

alter default privileges in schema editorial
  grant select on tables to directus_app;

alter role directus_app in database contexto_fc
  set search_path = public, core, editorial;
