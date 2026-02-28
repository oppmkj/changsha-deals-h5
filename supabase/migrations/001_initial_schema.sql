-- ============================================================
-- 长沙省钱攻略 · Supabase 数据库迁移脚本 v1.0
-- 运行方式：在 Supabase Dashboard → SQL Editor 粘贴执行
-- ============================================================

-- 启用 UUID 生成扩展
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. 商家表
-- ============================================================
create table if not exists public.merchants (
    id              text        primary key default gen_random_uuid()::text,
    name            text        not null,
    category        text        not null default 'food',
    address         text,
    lat             numeric(10, 7),
    lng             numeric(10, 7),
    district        text,
    mall            text,
    avg_spend       integer,
    popularity_score integer,
    rating          numeric(3, 1),
    source          text        not null default 'manual',
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- ============================================================
-- 2. 优惠表
-- ============================================================
create table if not exists public.deals (
    id                  text        primary key default gen_random_uuid()::text,
    merchant_id         text        not null references public.merchants(id) on delete cascade,
    title               text        not null,
    platform            text        not null,
    scene               text        not null default 'dine_in',
    discount_type       text        not null,
    discount_value      numeric(10, 2) not null default 0,
    threshold_amount    numeric(10, 2),
    max_discount        numeric(10, 2),
    price               numeric(10, 2),
    original_price      numeric(10, 2),
    stackable           boolean     not null default false,
    stack_group         text,
    stack_exclusive_type text,
    applies_stage       text        not null default 'BASE',
    card_required       text,
    membership_required text,
    conditions          text,
    valid_from          timestamptz,
    valid_to            timestamptz,
    affiliate_url       text,
    is_active           boolean     not null default true,
    recurrence_type     text        not null default 'NONE',
    recurrence_rule     text,
    notify_on_new       boolean     not null default false,
    estimated_min_save  numeric(10, 2),
    estimated_max_save  numeric(10, 2),
    voucher_claim_url   text,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

-- ============================================================
-- 3. 用户收藏表
-- ============================================================
create table if not exists public.user_favorites (
    id          uuid        primary key default gen_random_uuid(),
    user_id     uuid        not null references auth.users(id) on delete cascade,
    merchant_id text        not null references public.merchants(id) on delete cascade,
    deal_id     text        references public.deals(id) on delete set null,
    created_at  timestamptz not null default now(),
    -- 防止重复收藏同一商家
    unique(user_id, merchant_id)
);

-- ============================================================
-- 4. 索引（查询性能）
-- ============================================================
create index if not exists idx_deals_merchant      on public.deals(merchant_id);
create index if not exists idx_deals_platform      on public.deals(platform);
create index if not exists idx_deals_active        on public.deals(is_active) where is_active = true;
create index if not exists idx_deals_valid_to      on public.deals(valid_to);
create index if not exists idx_favorites_user      on public.user_favorites(user_id);
create index if not exists idx_merchants_district  on public.merchants(district);

-- ============================================================
-- 5. Row Level Security（多用户数据隔离）
-- ============================================================
alter table public.merchants       enable row level security;
alter table public.deals           enable row level security;
alter table public.user_favorites  enable row level security;

-- 商家/优惠：所有人可读，只有管理员可写（通过 Supabase Dashboard 角色配置）
create policy "公开读取商家" on public.merchants for select using (true);
create policy "公开读取优惠" on public.deals     for select using (true);

-- 收藏：用户只能读写自己的数据
create policy "用户读自己收藏"   on public.user_favorites for select using (auth.uid() = user_id);
create policy "用户写自己收藏"   on public.user_favorites for insert with check (auth.uid() = user_id);
create policy "用户删自己收藏"   on public.user_favorites for delete using (auth.uid() = user_id);

-- ============================================================
-- 6. 自动更新 updated_at 触发器
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger trg_merchants_updated_at
    before update on public.merchants
    for each row execute function public.set_updated_at();

create trigger trg_deals_updated_at
    before update on public.deals
    for each row execute function public.set_updated_at();
