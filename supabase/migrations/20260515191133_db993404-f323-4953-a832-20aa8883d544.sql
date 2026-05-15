
-- Roles
create type public.app_role as enum ('admin', 'customer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'customer',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "Users view own roles" on public.user_roles for select using (auth.uid() = user_id);
create policy "Admins view all roles" on public.user_roles for select using (public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles for all using (public.has_role(auth.uid(), 'admin'));

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Admins view all profiles" on public.profiles for select using (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + customer role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "Categories are public" on public.categories for select using (true);
create policy "Admins manage categories" on public.categories for all using (public.has_role(auth.uid(), 'admin'));

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  brand text,
  description text,
  notes text,
  fragrance_family text,
  volume_ml int,
  price_cents int not null check (price_cents >= 0),
  stock int not null default 0 check (stock >= 0),
  category_id uuid references public.categories(id) on delete set null,
  featured boolean not null default false,
  active boolean not null default true,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "Products are public" on public.products for select using (active = true or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage products" on public.products for all using (public.has_role(auth.uid(), 'admin'));

create index products_category_idx on public.products(category_id);
create index products_featured_idx on public.products(featured) where featured = true;

-- Product images (gallery)
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.product_images enable row level security;
create policy "Product images public" on public.product_images for select using (true);
create policy "Admins manage product images" on public.product_images for all using (public.has_role(auth.uid(), 'admin'));

-- Addresses
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  recipient text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'BR',
  phone text,
  created_at timestamptz not null default now()
);
alter table public.addresses enable row level security;
create policy "Users manage own addresses" on public.addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins view all addresses" on public.addresses for select using (public.has_role(auth.uid(), 'admin'));

-- Orders
create type public.order_status as enum ('pending_payment','paid','processing','shipped','delivered','cancelled');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('MP-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status public.order_status not null default 'pending_payment',
  subtotal_cents int not null,
  shipping_cents int not null default 0,
  total_cents int not null,
  shipping_recipient text not null,
  shipping_line1 text not null,
  shipping_line2 text,
  shipping_city text not null,
  shipping_state text not null,
  shipping_postal_code text not null,
  shipping_country text not null default 'BR',
  shipping_phone text,
  payment_method text,
  payment_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "Users view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users insert own orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "Admins view all orders" on public.orders for select using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update orders" on public.orders for update using (public.has_role(auth.uid(), 'admin'));

create index orders_user_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);

-- Order items
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_brand text,
  unit_price_cents int not null,
  quantity int not null check (quantity > 0),
  line_total_cents int not null,
  image_url text
);
alter table public.order_items enable row level security;
create policy "Users view own order items" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "Users insert own order items" on public.order_items for insert with check (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "Admins view all order items" on public.order_items for select using (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger set_products_updated_at before update on public.products for each row execute procedure public.set_updated_at();
create trigger set_orders_updated_at before update on public.orders for each row execute procedure public.set_updated_at();
create trigger set_profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();

-- Storage bucket for product images
insert into storage.buckets (id, name, public) values ('products', 'products', true);

create policy "Product images public read" on storage.objects for select using (bucket_id = 'products');
create policy "Admins upload product images" on storage.objects for insert with check (
  bucket_id = 'products' and public.has_role(auth.uid(), 'admin')
);
create policy "Admins update product images" on storage.objects for update using (
  bucket_id = 'products' and public.has_role(auth.uid(), 'admin')
);
create policy "Admins delete product images" on storage.objects for delete using (
  bucket_id = 'products' and public.has_role(auth.uid(), 'admin')
);
