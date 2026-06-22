-- ============================================================
-- SRM DOCUMENTS - BASE DE DONNEES UNIQUE SUPABASE / POSTGRESQL
-- Exécuter ce fichier une seule fois dans Supabase > SQL Editor.
-- Le compte propriétaire initial utilise l’identifiant hossame.
-- Le mot de passe est enregistré sous forme de hash bcrypt, jamais affiché dans l’interface.
-- ============================================================

create extension if not exists pgcrypto;
set search_path = public, extensions;

-- ---------- Tables ----------
create table if not exists public.app_settings (
    id smallint primary key default 1 check (id = 1),
    app_name text not null default 'SRM Workspace',
    department text not null default 'Direction Clientèle — Département Grands Comptes',
    version text not null default '5.0.0',
    default_city text not null default 'FES',
    creditor text not null default 'SRM-FM',
    developer_name text not null default 'Hossame El Bezzari',
    developer_matricule text not null default '2373',
    session_hours integer not null default 8 check (session_hours between 1 and 168),
    updated_at timestamptz not null default now()
);

create table if not exists public.users (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    matricule text not null unique,
    username text not null unique,
    password_hash text not null,
    role text not null default 'user' check (role in ('admin','user')),
    status text not null default 'active' check (status in ('active','disabled')),
    is_owner boolean not null default false,
    avatar_url text,
    last_login_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.user_permissions (
    user_id uuid not null references public.users(id) on delete cascade,
    module text not null check (module in ('dashboard','calcul','order','notice','history','admin','about')),
    can_view boolean not null default false,
    can_create boolean not null default false,
    can_edit boolean not null default false,
    can_delete boolean not null default false,
    can_export_pdf boolean not null default false,
    can_export_docx boolean not null default false,
    primary key (user_id, module)
);

create table if not exists public.sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    token_hash text not null unique,
    user_agent text,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null,
    last_seen_at timestamptz not null default now()
);

create table if not exists public.clients (
    id uuid primary key default gen_random_uuid(),
    client_number text not null unique,
    client_type text not null default 'company' check (client_type in ('company','person')),
    name text not null,
    cin_ice text,
    phone text,
    email text,
    represented_by text,
    address text,
    city text,
    tournee text,
    status text not null default 'active' check (status in ('active','inactive')),
    created_by uuid references public.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.contracts (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    contract_number text not null unique,
    service_code text not null check (service_code in ('EAU','BT','MT')),
    service_label text not null,
    address text,
    balance numeric(14,2) not null default 0,
    status text not null default 'active' check (status in ('active','inactive')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.arrears (
    id uuid primary key default gen_random_uuid(),
    contract_id uuid not null references public.contracts(id) on delete cascade,
    invoice_number text not null,
    product_month text not null,
    balance numeric(14,2) not null default 0,
    status text not null default 'unpaid' check (status in ('unpaid','paid','cancelled')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(contract_id, invoice_number)
);

create table if not exists public.documents (
    id uuid primary key default gen_random_uuid(),
    reference text not null unique,
    document_type text not null check (document_type in ('calcul','order','notice')),
    client_id uuid references public.clients(id) on delete set null,
    created_by uuid not null references public.users(id) on delete restrict,
    total_amount numeric(14,2) not null default 0,
    status text not null default 'generated' check (status in ('draft','generated','archived')),
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
    id bigint generated always as identity primary key,
    user_id uuid references public.users(id) on delete set null,
    action text not null,
    module text,
    description text not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_sessions_hash on public.sessions(token_hash);
create index if not exists idx_sessions_user on public.sessions(user_id);
create index if not exists idx_contracts_client on public.contracts(client_id);
create index if not exists idx_arrears_contract on public.arrears(contract_id);
create index if not exists idx_documents_user on public.documents(created_by);
create index if not exists idx_activity_created on public.activity_logs(created_at desc);

-- ---------- Sécurité : aucune table n'est accessible directement ----------
alter table public.app_settings enable row level security;
alter table public.users enable row level security;
alter table public.user_permissions enable row level security;
alter table public.sessions enable row level security;
alter table public.clients enable row level security;
alter table public.contracts enable row level security;
alter table public.arrears enable row level security;
alter table public.documents enable row level security;
alter table public.activity_logs enable row level security;

revoke all on table public.app_settings, public.users, public.user_permissions, public.sessions, public.clients, public.contracts, public.arrears, public.documents, public.activity_logs from anon, authenticated;
revoke all on sequence public.activity_logs_id_seq from anon, authenticated;

-- ---------- Fonctions internes ----------
create or replace function public._session_user_id(p_token text)
returns uuid
language sql
security definer
stable
set search_path = public, extensions
as $$
    select s.user_id
    from public.sessions s
    join public.users u on u.id = s.user_id
    where s.token_hash = encode(digest(coalesce(p_token,''), 'sha256'), 'hex')
      and s.expires_at > now()
      and u.status = 'active'
    limit 1;
$$;

create or replace function public._is_admin(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
    select coalesce((select role = 'admin' from public.users where id = p_user_id and status = 'active'), false);
$$;

create or replace function public._is_owner(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
    select coalesce((select is_owner from public.users where id = p_user_id and status = 'active'), false);
$$;

create or replace function public._has_permission(p_user_id uuid, p_module text, p_action text default 'view')
returns boolean
language sql
security definer
stable
set search_path = public
as $$
    select coalesce(
        (select case p_action
            when 'view' then can_view
            when 'create' then can_create
            when 'edit' then can_edit
            when 'delete' then can_delete
            when 'export_pdf' then can_export_pdf
            when 'export_docx' then can_export_docx
            else false
        end
        from public.user_permissions
        where user_id = p_user_id and module = p_module),
        false
    );
$$;

create or replace function public._permissions_json(p_user_id uuid)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
    select coalesce(
        jsonb_object_agg(
            module,
            jsonb_build_object(
                'view', can_view,
                'create', can_create,
                'edit', can_edit,
                'delete', can_delete,
                'export_pdf', can_export_pdf,
                'export_docx', can_export_docx
            )
        ),
        '{}'::jsonb
    )
    from public.user_permissions
    where user_id = p_user_id;
$$;

create or replace function public._apply_default_permissions(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    m text;
    full_access boolean := p_role = 'admin';
begin
    foreach m in array array['dashboard','calcul','order','notice','history','admin','about'] loop
        insert into public.user_permissions(
            user_id,module,can_view,can_create,can_edit,can_delete,can_export_pdf,can_export_docx
        ) values (
            p_user_id,
            m,
            case when m in ('dashboard','about') then true else full_access end,
            case when m in ('calcul','order','notice','admin') then full_access else false end,
            case when m in ('calcul','order','notice','admin') then full_access else false end,
            case when m in ('history','admin') then full_access else false end,
            case when m in ('calcul','order','notice') then full_access else false end,
            case when m in ('calcul','order','notice') then full_access else false end
        )
        on conflict(user_id,module) do update set
            can_view = excluded.can_view,
            can_create = excluded.can_create,
            can_edit = excluded.can_edit,
            can_delete = excluded.can_delete,
            can_export_pdf = excluded.can_export_pdf,
            can_export_docx = excluded.can_export_docx;
    end loop;
end;
$$;

-- Ne pas exposer les helpers internes.
revoke all on function public._session_user_id(text) from public, anon, authenticated;
revoke all on function public._is_admin(uuid) from public, anon, authenticated;
revoke all on function public._is_owner(uuid) from public, anon, authenticated;
revoke all on function public._has_permission(uuid,text,text) from public, anon, authenticated;
revoke all on function public._permissions_json(uuid) from public, anon, authenticated;
revoke all on function public._apply_default_permissions(uuid,text) from public, anon, authenticated;

-- ---------- Authentification ----------
create or replace function public.login_user(p_login text, p_password text, p_user_agent text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_user public.users%rowtype;
    v_token text;
    v_hours integer;
begin
    select * into v_user
    from public.users
    where lower(username) = lower(trim(p_login))
       or lower(matricule) = lower(trim(p_login))
    limit 1;

    if v_user.id is null or v_user.status <> 'active' or crypt(coalesce(p_password,''), v_user.password_hash) <> v_user.password_hash then
        return jsonb_build_object('ok', false, 'message', 'Identifiant ou mot de passe incorrect.');
    end if;

    select session_hours into v_hours from public.app_settings where id = 1;
    v_hours := coalesce(v_hours, 8);
    v_token := encode(gen_random_bytes(32), 'hex');

    delete from public.sessions where expires_at <= now();
    insert into public.sessions(user_id, token_hash, user_agent, expires_at)
    values (v_user.id, encode(digest(v_token, 'sha256'), 'hex'), left(p_user_agent, 500), now() + make_interval(hours => v_hours));

    update public.users set last_login_at = now(), updated_at = now() where id = v_user.id;
    insert into public.activity_logs(user_id, action, module, description)
    values (v_user.id, 'login', 'auth', v_user.full_name || ' s''est connecté.');

    return jsonb_build_object(
        'ok', true,
        'token', v_token,
        'user', jsonb_build_object(
            'id', v_user.id,
            'name', v_user.full_name,
            'username', v_user.username,
            'matricule', v_user.matricule,
            'role', v_user.role,
            'is_owner', v_user.is_owner,
            'avatar_url', v_user.avatar_url,
            'last_login_at', now()
        ),
        'permissions', public._permissions_json(v_user.id)
    );
end;
$$;

grant execute on function public.login_user(text,text,text) to anon, authenticated;

create or replace function public.logout_user(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_user_id uuid := public._session_user_id(p_token);
begin
    if v_user_id is not null then
        insert into public.activity_logs(user_id, action, module, description)
        select id, 'logout', 'auth', full_name || ' s''est déconnecté.' from public.users where id = v_user_id;
    end if;
    delete from public.sessions where token_hash = encode(digest(coalesce(p_token,''), 'sha256'), 'hex');
    return true;
end;
$$;

grant execute on function public.logout_user(text) to anon, authenticated;

-- ---------- Bootstrap application ----------
create or replace function public.app_bootstrap(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_user_id uuid := public._session_user_id(p_token);
    v_user public.users%rowtype;
    v_app jsonb;
    v_clients jsonb;
begin
    if v_user_id is null then
        raise exception 'SESSION_INVALID';
    end if;

    update public.sessions set last_seen_at = now()
    where token_hash = encode(digest(coalesce(p_token,''), 'sha256'), 'hex');

    select * into v_user from public.users where id = v_user_id;
    select to_jsonb(s) into v_app from (
        select app_name as name, department, version, default_city as "defaultCity",
               creditor, developer_name as "developerName",
               developer_matricule as "developerMatricule"
        from public.app_settings where id = 1
    ) s;

    if public._has_permission(v_user_id,'calcul','view')
       or public._has_permission(v_user_id,'order','view')
       or public._has_permission(v_user_id,'notice','view') then
        select coalesce(jsonb_agg(client_row order by client_row->>'name'), '[]'::jsonb)
        into v_clients
        from (
        select jsonb_build_object(
            'id', c.id,
            'clientNumber', c.client_number,
            'type', c.client_type,
            'name', c.name,
            'cin', coalesce(c.cin_ice,''),
            'phone', coalesce(c.phone,''),
            'email', coalesce(c.email,''),
            'representedBy', coalesce(c.represented_by,''),
            'address', coalesce(c.address,''),
            'city', coalesce(c.city,''),
            'tourne', coalesce(c.tournee,''),
            'contracts', coalesce((
                select jsonb_agg(jsonb_build_object(
                    'id', ct.id,
                    'number', ct.contract_number,
                    'address', coalesce(ct.address,''),
                    'serviceCode', ct.service_code,
                    'serviceLabel', ct.service_label,
                    'balance', ct.balance,
                    'arrears', coalesce((
                        select jsonb_agg(jsonb_build_object(
                            'id', a.id,
                            'invoice', a.invoice_number,
                            'product', a.product_month,
                            'balance', a.balance
                        ) order by a.product_month)
                        from public.arrears a
                        where a.contract_id = ct.id and a.status = 'unpaid'
                    ), '[]'::jsonb)
                ) order by ct.contract_number)
                from public.contracts ct
                where ct.client_id = c.id and ct.status = 'active'
            ), '[]'::jsonb)
        ) as client_row
            from public.clients c
            where c.status = 'active'
        ) q;
    else
        v_clients := '[]'::jsonb;
    end if;

    return jsonb_build_object(
        'app', v_app,
        'user', jsonb_build_object(
            'id', v_user.id,
            'name', v_user.full_name,
            'username', v_user.username,
            'matricule', v_user.matricule,
            'role', v_user.role,
            'is_owner', v_user.is_owner,
            'avatar_url', v_user.avatar_url,
            'last_login_at', v_user.last_login_at
        ),
        'permissions', public._permissions_json(v_user_id),
        'clients', v_clients
    );
end;
$$;

grant execute on function public.app_bootstrap(text) to anon, authenticated;

-- ---------- Dashboard / historique ----------
create or replace function public.dashboard_data(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid := public._session_user_id(p_token);
    v_admin boolean;
begin
    if v_user_id is null then raise exception 'SESSION_INVALID'; end if;
    if not public._has_permission(v_user_id,'dashboard','view') then raise exception 'PERMISSION_DENIED'; end if;
    v_admin := public._is_admin(v_user_id);

    return jsonb_build_object(
        'stats', jsonb_build_object(
            'users', case when v_admin then (select count(*) from public.users) else 1 end,
            'activeUsers', case when v_admin then (select count(*) from public.users where status='active') else 1 end,
            'clients', (select count(*) from public.clients where status='active'),
            'contracts', (select count(*) from public.contracts where status='active'),
            'documents', case when v_admin then (select count(*) from public.documents) else (select count(*) from public.documents where created_by=v_user_id) end
        ),
        'recent', coalesce((
            select jsonb_agg(x order by x->>'created_at' desc)
            from (
                select jsonb_build_object(
                    'id', l.id,
                    'user_name', coalesce(u.full_name,'Utilisateur supprimé'),
                    'action', l.action,
                    'module', l.module,
                    'description', l.description,
                    'created_at', l.created_at
                ) x
                from public.activity_logs l
                left join public.users u on u.id=l.user_id
                where v_admin or l.user_id=v_user_id
                order by l.created_at desc
                limit 12
            ) r
        ), '[]'::jsonb)
    );
end;
$$;

grant execute on function public.dashboard_data(text) to anon, authenticated;

create or replace function public.list_activity(p_token text, p_limit integer default 100)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid := public._session_user_id(p_token);
    v_admin boolean;
begin
    if v_user_id is null then raise exception 'SESSION_INVALID'; end if;
    if not public._has_permission(v_user_id,'history','view') then raise exception 'PERMISSION_DENIED'; end if;
    v_admin := public._is_admin(v_user_id);

    return coalesce((
        select jsonb_agg(row_data order by row_data->>'created_at' desc)
        from (
            select jsonb_build_object(
                'id', l.id,
                'user_id', l.user_id,
                'user_name', coalesce(u.full_name,'Utilisateur supprimé'),
                'action', l.action,
                'module', l.module,
                'description', l.description,
                'metadata', l.metadata,
                'created_at', l.created_at
            ) row_data
            from public.activity_logs l
            left join public.users u on u.id=l.user_id
            where v_admin or l.user_id=v_user_id
            order by l.created_at desc
            limit greatest(1, least(coalesce(p_limit,100),500))
        ) q
    ), '[]'::jsonb);
end;
$$;

grant execute on function public.list_activity(text,integer) to anon, authenticated;

create or replace function public.record_document_action(
    p_token text,
    p_module text,
    p_format text,
    p_client_id uuid default null,
    p_total numeric default 0,
    p_data jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid := public._session_user_id(p_token);
    v_action text;
    v_reference text;
    v_document_id uuid;
begin
    if v_user_id is null then raise exception 'SESSION_INVALID'; end if;
    if p_module not in ('calcul','order','notice') then raise exception 'MODULE_INVALID'; end if;
    if p_format not in ('pdf','docx','save') then raise exception 'FORMAT_INVALID'; end if;

    v_action := case when p_format='pdf' then 'export_pdf' when p_format='docx' then 'export_docx' else 'save' end;
    if p_format in ('pdf','docx') and not public._has_permission(v_user_id,p_module,'export_'||p_format) then
        raise exception 'PERMISSION_DENIED';
    end if;
    if p_format='save' and not public._has_permission(v_user_id,p_module,'create') then
        raise exception 'PERMISSION_DENIED';
    end if;

    v_reference := upper(p_module) || '-' || to_char(now(),'YYYYMMDD-HH24MISS') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6);
    insert into public.documents(reference,document_type,client_id,created_by,total_amount,data)
    values(v_reference,p_module,p_client_id,v_user_id,coalesce(p_total,0),coalesce(p_data,'{}'::jsonb))
    returning id into v_document_id;

    insert into public.activity_logs(user_id,action,module,description,metadata)
    values(v_user_id,v_action,p_module,
           case p_format when 'pdf' then 'Export PDF effectué.' when 'docx' then 'Export DOCX effectué.' else 'Document enregistré.' end,
           jsonb_build_object('document_id',v_document_id,'reference',v_reference,'client_id',p_client_id,'total',p_total));

    return jsonb_build_object('ok',true,'id',v_document_id,'reference',v_reference);
end;
$$;

grant execute on function public.record_document_action(text,text,text,uuid,numeric,jsonb) to anon, authenticated;

-- ---------- Administration utilisateurs ----------
create or replace function public.admin_list_users(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_caller uuid := public._session_user_id(p_token);
begin
    if v_caller is null or not public._is_admin(v_caller) or not public._has_permission(v_caller,'admin','view') then
        raise exception 'PERMISSION_DENIED';
    end if;

    return coalesce((
        select jsonb_agg(jsonb_build_object(
            'id', u.id,
            'name', u.full_name,
            'matricule', u.matricule,
            'username', u.username,
            'role', u.role,
            'status', u.status,
            'is_owner', u.is_owner,
            'avatar_url', u.avatar_url,
            'last_login_at', u.last_login_at,
            'created_at', u.created_at,
            'permissions', public._permissions_json(u.id)
        ) order by u.is_owner desc, u.full_name)
        from public.users u
    ), '[]'::jsonb);
end;
$$;

grant execute on function public.admin_list_users(text) to anon, authenticated;

create or replace function public.admin_create_user(
    p_token text,
    p_full_name text,
    p_matricule text,
    p_username text,
    p_password text,
    p_role text default 'user'
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_caller uuid := public._session_user_id(p_token);
    v_new_id uuid;
    v_role text := lower(coalesce(p_role,'user'));
begin
    if v_caller is null or not public._is_admin(v_caller) or not public._has_permission(v_caller,'admin','create') then
        raise exception 'PERMISSION_DENIED';
    end if;
    if v_role not in ('admin','user') then raise exception 'ROLE_INVALID'; end if;
    if v_role='admin' and not public._is_owner(v_caller) then raise exception 'OWNER_REQUIRED'; end if;
    if length(trim(coalesce(p_password,''))) < 6 then raise exception 'PASSWORD_TOO_SHORT'; end if;

    insert into public.users(full_name,matricule,username,password_hash,role)
    values(trim(p_full_name),trim(p_matricule),lower(trim(p_username)),crypt(p_password,gen_salt('bf',10)),v_role)
    returning id into v_new_id;

    perform public._apply_default_permissions(v_new_id,v_role);
    insert into public.activity_logs(user_id,action,module,description,metadata)
    values(v_caller,'create_user','admin','Nouvel utilisateur créé : '||trim(p_full_name),jsonb_build_object('target_user_id',v_new_id));

    return jsonb_build_object('ok',true,'id',v_new_id);
exception
    when unique_violation then raise exception 'USER_ALREADY_EXISTS';
end;
$$;

grant execute on function public.admin_create_user(text,text,text,text,text,text) to anon, authenticated;

create or replace function public.admin_update_user(
    p_token text,
    p_user_id uuid,
    p_full_name text,
    p_matricule text,
    p_username text,
    p_role text,
    p_status text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_caller uuid := public._session_user_id(p_token);
    v_target public.users%rowtype;
begin
    if v_caller is null or not public._is_admin(v_caller) or not public._has_permission(v_caller,'admin','edit') then
        raise exception 'PERMISSION_DENIED';
    end if;
    select * into v_target from public.users where id=p_user_id;
    if v_target.id is null then raise exception 'USER_NOT_FOUND'; end if;
    if v_target.is_owner and not public._is_owner(v_caller) then raise exception 'OWNER_PROTECTED'; end if;
    if v_target.is_owner then
        p_role := 'admin';
        p_status := 'active';
    end if;
    if lower(p_role)='admin' and not public._is_owner(v_caller) then raise exception 'OWNER_REQUIRED'; end if;
    if p_status not in ('active','disabled') then raise exception 'STATUS_INVALID'; end if;

    update public.users set
        full_name=trim(p_full_name), matricule=trim(p_matricule), username=lower(trim(p_username)),
        role=lower(p_role), status=p_status, updated_at=now()
    where id=p_user_id;

    delete from public.sessions where user_id=p_user_id and p_status='disabled';
    insert into public.activity_logs(user_id,action,module,description,metadata)
    values(v_caller,'update_user','admin','Utilisateur modifié : '||trim(p_full_name),jsonb_build_object('target_user_id',p_user_id));
    return true;
exception
    when unique_violation then raise exception 'USER_ALREADY_EXISTS';
end;
$$;

grant execute on function public.admin_update_user(text,uuid,text,text,text,text,text) to anon, authenticated;

create or replace function public.admin_set_permissions(p_token text, p_user_id uuid, p_permissions jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_caller uuid := public._session_user_id(p_token);
    v_target public.users%rowtype;
    v_item record;
    v_value jsonb;
begin
    if v_caller is null or not public._is_admin(v_caller) or not public._has_permission(v_caller,'admin','edit') then
        raise exception 'PERMISSION_DENIED';
    end if;
    select * into v_target from public.users where id=p_user_id;
    if v_target.id is null then raise exception 'USER_NOT_FOUND'; end if;
    if v_target.is_owner then raise exception 'OWNER_PROTECTED'; end if;
    if v_target.role='admin' and not public._is_owner(v_caller) then raise exception 'OWNER_REQUIRED'; end if;

    for v_item in select * from jsonb_each(coalesce(p_permissions,'{}'::jsonb)) loop
        if v_item.key in ('dashboard','calcul','order','notice','history','admin','about') then
            v_value := v_item.value;
            insert into public.user_permissions(user_id,module,can_view,can_create,can_edit,can_delete,can_export_pdf,can_export_docx)
            values(
                p_user_id,v_item.key,
                coalesce((v_value->>'view')::boolean,false),
                coalesce((v_value->>'create')::boolean,false),
                coalesce((v_value->>'edit')::boolean,false),
                coalesce((v_value->>'delete')::boolean,false),
                coalesce((v_value->>'export_pdf')::boolean,false),
                coalesce((v_value->>'export_docx')::boolean,false)
            )
            on conflict(user_id,module) do update set
                can_view=excluded.can_view,
                can_create=excluded.can_create,
                can_edit=excluded.can_edit,
                can_delete=excluded.can_delete,
                can_export_pdf=excluded.can_export_pdf,
                can_export_docx=excluded.can_export_docx;
        end if;
    end loop;

    insert into public.activity_logs(user_id,action,module,description,metadata)
    values(v_caller,'update_permissions','admin','Permissions mises à jour pour '||v_target.full_name,jsonb_build_object('target_user_id',p_user_id));
    return true;
end;
$$;

grant execute on function public.admin_set_permissions(text,uuid,jsonb) to anon, authenticated;

create or replace function public.admin_reset_password(p_token text, p_user_id uuid, p_new_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_caller uuid := public._session_user_id(p_token);
    v_target public.users%rowtype;
begin
    if v_caller is null or not public._is_admin(v_caller) or not public._has_permission(v_caller,'admin','edit') then
        raise exception 'PERMISSION_DENIED';
    end if;
    select * into v_target from public.users where id=p_user_id;
    if v_target.id is null then raise exception 'USER_NOT_FOUND'; end if;
    if v_target.is_owner and not public._is_owner(v_caller) then raise exception 'OWNER_PROTECTED'; end if;
    if length(coalesce(p_new_password,'')) < 6 then raise exception 'PASSWORD_TOO_SHORT'; end if;

    update public.users set password_hash=crypt(p_new_password,gen_salt('bf',10)),updated_at=now() where id=p_user_id;
    delete from public.sessions where user_id=p_user_id;
    insert into public.activity_logs(user_id,action,module,description,metadata)
    values(v_caller,'reset_password','admin','Mot de passe réinitialisé pour '||v_target.full_name,jsonb_build_object('target_user_id',p_user_id));
    return true;
end;
$$;

grant execute on function public.admin_reset_password(text,uuid,text) to anon, authenticated;

create or replace function public.admin_delete_user(p_token text, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_caller uuid := public._session_user_id(p_token);
    v_target public.users%rowtype;
begin
    if v_caller is null or not public._is_admin(v_caller) or not public._has_permission(v_caller,'admin','delete') then
        raise exception 'PERMISSION_DENIED';
    end if;
    select * into v_target from public.users where id=p_user_id;
    if v_target.id is null then raise exception 'USER_NOT_FOUND'; end if;
    if v_target.is_owner then raise exception 'OWNER_PROTECTED'; end if;
    if v_target.role='admin' and not public._is_owner(v_caller) then raise exception 'OWNER_REQUIRED'; end if;
    if p_user_id=v_caller then raise exception 'SELF_DELETE_FORBIDDEN'; end if;

    insert into public.activity_logs(user_id,action,module,description,metadata)
    values(v_caller,'delete_user','admin','Utilisateur supprimé : '||v_target.full_name,jsonb_build_object('target_user_id',p_user_id));
    delete from public.users where id=p_user_id;
    return true;
end;
$$;

grant execute on function public.admin_delete_user(text,uuid) to anon, authenticated;

-- ---------- Seed initial ----------
insert into public.app_settings(id) values(1) on conflict(id) do nothing;

do $$
declare
    v_owner uuid;
    v_client1 uuid;
    v_client2 uuid;
    v_client3 uuid;
    v_contract uuid;
begin
    select id into v_owner
    from public.users
    where is_owner = true or lower(username) = 'hossame'
    order by is_owner desc
    limit 1;

    if v_owner is null then
        insert into public.users(full_name,matricule,username,password_hash,role,status,is_owner)
        values(
            'Hossame El Bezzari',
            '2373',
            'hossame',
            '$2a$10$DJBPtmwLl8j7oQGzhfXi4erBlJhMML0rzrUt7gQpY8koeUKcztPwO',
            'admin',
            'active',
            true
        )
        returning id into v_owner;
    else
        update public.users
        set full_name = 'Hossame El Bezzari',
            matricule = '2373',
            username = 'hossame',
            password_hash = '$2a$10$DJBPtmwLl8j7oQGzhfXi4erBlJhMML0rzrUt7gQpY8koeUKcztPwO',
            role = 'admin',
            status = 'active',
            is_owner = true,
            updated_at = now()
        where id = v_owner;
    end if;

    perform public._apply_default_permissions(v_owner,'admin');

    select id into v_client1 from public.clients where client_number='1002458';
    if v_client1 is null then
        insert into public.clients(client_number,client_type,name,phone,represented_by,address,city,tournee,created_by)
        values('1002458','company','HOTEL OLYMPIC','0535 00 00 01','M. RESPONSABLE HOTEL OLYMPIC','9 AVENUE HOUMANE FATOUAKI','FES','T-12',v_owner)
        returning id into v_client1;

        insert into public.contracts(client_id,contract_number,service_code,service_label,address,balance)
        values(v_client1,'0694068','EAU','Factures de consommation Eau Potable Assainissement','9 AVENUE HOUMANE FATOUAKI, FES',1380.99)
        returning id into v_contract;
        insert into public.arrears(contract_id,invoice_number,product_month,balance) values
        (v_contract,'205445025','03/2026',680.99),(v_contract,'205778142','04/2026',700.00);

        insert into public.contracts(client_id,contract_number,service_code,service_label,address,balance)
        values(v_client1,'1387132','BT','Factures de consommation Electricité Basse Tension','CENTRE VILLE, FES',19151.66)
        returning id into v_contract;
        insert into public.arrears(contract_id,invoice_number,product_month,balance) values
        (v_contract,'202243117','01/2026',9550.00),(v_contract,'202557314','02/2026',9601.66);
    end if;

    select id into v_client2 from public.clients where client_number='1003871';
    if v_client2 is null then
        insert into public.clients(client_number,client_type,name,cin_ice,phone,represented_by,address,city,tournee,created_by)
        values('1003871','person','MOHAMED EL AMRANI','AB123456','0612 34 56 78','MOHAMED EL AMRANI','12 RUE IBN KHALDOUN','MEKNES','T-07',v_owner)
        returning id into v_client2;
        insert into public.contracts(client_id,contract_number,service_code,service_label,address,balance)
        values(v_client2,'0755123','EAU','Factures de consommation Eau Potable Assainissement','12 RUE IBN KHALDOUN, MEKNES',2450.50)
        returning id into v_contract;
        insert into public.arrears(contract_id,invoice_number,product_month,balance) values
        (v_contract,'301245789','02/2026',1200.50),(v_contract,'301689745','03/2026',1250.00);
    end if;

    select id into v_client3 from public.clients where client_number='1005130';
    if v_client3 is null then
        insert into public.clients(client_number,client_type,name,phone,represented_by,address,city,tournee,created_by)
        values('1005130','company','CLINIQUE AL ANDALOUS','0535 00 00 03','DIRECTEUR DE LA CLINIQUE','AVENUE DES FAR','FES','T-21',v_owner)
        returning id into v_client3;
        insert into public.contracts(client_id,contract_number,service_code,service_label,address,balance)
        values(v_client3,'0911442','MT','Factures de consommation Electricité Moyenne Tension','AVENUE DES FAR, FES',38740.25)
        returning id into v_contract;
        insert into public.arrears(contract_id,invoice_number,product_month,balance) values
        (v_contract,'410258963','03/2026',18740.25),(v_contract,'410698521','04/2026',20000.00);
    end if;
end $$;

-- Les fonctions seulement restent accessibles aux clés publiques Supabase.
