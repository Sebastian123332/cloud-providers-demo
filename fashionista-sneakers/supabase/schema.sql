-- Fashionista Sneakers — esquema para la versión en producción (Supabase / Postgres).
-- Refleja el modelo de la demo: un producto tiene una fila de stock por talla.

create table deportes (
  nombre text primary key
);

create table productos (
  id          text primary key,                 -- código, ej. FS-0001 (el mismo del Excel / sistema de inventario)
  marca       text not null,
  nombre      text not null,
  genero      text not null check (genero in ('Hombre','Mujer','Niños','Unisex')),
  categoria   text not null check (categoria in ('Calzado','Ropa','Accesorios')),
  deporte     text references deportes(nombre) on update cascade,
  color       text,
  precio      integer not null check (precio >= 0),        -- colones
  oferta      integer check (oferta is null or oferta >= 0),
  foto_url    text,                                         -- Cloudflare R2 o Supabase Storage
  activo      boolean not null default true,
  nuevo       boolean not null default false,
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table stock (
  producto_id text references productos(id) on delete cascade,
  talla       text not null,
  cantidad    integer not null default 0 check (cantidad >= 0),
  orden       smallint not null default 0,
  primary key (producto_id, talla)
);

create table pedidos (
  id        bigint generated always as identity primary key,
  codigo    text unique not null,                -- FS-1234
  cliente   text,
  telefono  text,
  entrega   text,
  direccion text,
  pago      text,                                -- SINPE, tarjeta, efectivo
  total     integer not null,
  estado    text not null default 'Pendiente' check (estado in ('Pendiente','Pagado','Enviado','Entregado','Cancelado')),
  items     jsonb not null,
  creado    timestamptz not null default now()
);

create index productos_filtros on productos (activo, genero, categoria, deporte, marca);
create index productos_busqueda on productos using gin (to_tsvector('spanish', marca || ' ' || nombre));

-- Vista para la tienda: solo productos visibles, con existencias totales.
create view catalogo as
  select p.*, coalesce(sum(s.cantidad), 0) as existencias
  from productos p left join stock s on s.producto_id = p.id
  where p.activo
  group by p.id;

-- Seguridad: el público solo lee; solo el dueño (usuario autenticado) escribe.
alter table productos enable row level security;
alter table stock     enable row level security;
alter table deportes  enable row level security;
alter table pedidos   enable row level security;

create policy "lectura publica productos" on productos for select using (activo);
create policy "lectura publica stock"     on stock     for select using (true);
create policy "lectura publica deportes"  on deportes  for select using (true);
create policy "dueño edita productos" on productos for all to authenticated using (true) with check (true);
create policy "dueño edita stock"     on stock     for all to authenticated using (true) with check (true);
create policy "dueño edita deportes"  on deportes  for all to authenticated using (true) with check (true);
create policy "dueño ve pedidos"      on pedidos   for all to authenticated using (true) with check (true);
-- Los pedidos de clientes se insertan desde una Edge Function (descuenta stock en la misma transacción).

insert into deportes values ('Basketball'),('Running'),('Lifestyle'),('Fútbol'),('Training'),('Skate');
