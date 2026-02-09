
-- ⚠️ IMPORTANTE: Execute este script no SQL Editor do Supabase para criar a estrutura do banco.

-- 1. CRIAÇÃO DAS TABELAS (Estrutura necessária para o App)

-- Tabela de Perfis (Usuários e Oficinas)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  type text, -- 'motorista' ou 'oficina'
  data jsonb, -- Armazena dados extras (veículo, endereço, serviços)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Pedidos
create table if not exists public.orders (
  id uuid primary key, -- UUID gerado pelo App
  driver_id uuid references public.profiles(id),
  workshop_id uuid references public.profiles(id),
  status text, -- 'criado', 'pago', 'concluido', etc.
  data jsonb, -- Armazena detalhes do pedido, preço, avaliação
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. HABILITAR SEGURANÇA (RLS)
alter table public.profiles enable row level security;
alter table public.orders enable row level security;

-- 3. LIMPEZA DE POLÍTICAS ANTIGAS (Para evitar erros de duplicação)
drop policy if exists "Public read workshops" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can read related orders" on public.orders;
drop policy if exists "Drivers can create orders" on public.orders;
drop policy if exists "Users can update related orders" on public.orders;

-- 4. POLÍTICAS DE PERFIL (PROFILES)

-- Qualquer um pode ler dados de OFICINAS (para listar no app)
create policy "Public read workshops"
on public.profiles for select
using ( type = 'oficina' );

-- Usuário logado pode ler seu próprio perfil
create policy "Users can read own profile"
on public.profiles for select
using ( auth.uid() = id );

-- Usuário logado pode atualizar seu próprio perfil
create policy "Users can update own profile"
on public.profiles for update
using ( auth.uid() = id );

-- Usuário logado pode inserir seu próprio perfil (ao cadastrar)
create policy "Users can insert own profile"
on public.profiles for insert
with check ( auth.uid() = id );

-- 5. POLÍTICAS DE PEDIDOS (ORDERS)

-- Usuários só veem pedidos onde são Motorista OU Oficina
create policy "Users can read related orders"
on public.orders for select
using ( auth.uid() = driver_id or auth.uid() = workshop_id );

-- Motoristas podem criar pedidos (vinculados ao seu ID)
create policy "Drivers can create orders"
on public.orders for insert
with check ( auth.uid() = driver_id );

-- Motoristas e Oficinas envolvidos podem atualizar o status do pedido
create policy "Users can update related orders"
on public.orders for update
using ( auth.uid() = driver_id or auth.uid() = workshop_id );
