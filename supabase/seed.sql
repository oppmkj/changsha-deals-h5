-- 初始化长湘优惠平台数据库 Schema 与基础数据

-- 1. 创建 merchants (商家) 表
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    address TEXT NOT NULL,
    lat FLOAT8 NOT NULL,
    lng FLOAT8 NOT NULL,
    district TEXT NOT NULL,
    mall TEXT,
    avg_spend INTEGER,
    popularity_score INTEGER NOT NULL DEFAULT 0,
    rating FLOAT4,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 创建 deals (优惠) 表
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    platform TEXT NOT NULL,
    scene TEXT NOT NULL,
    discount_type TEXT NOT NULL,
    discount_value FLOAT8 NOT NULL,
    threshold_amount INTEGER,
    max_discount INTEGER,
    price FLOAT8,
    original_price FLOAT8,
    stackable BOOLEAN NOT NULL DEFAULT false,
    stack_group TEXT,
    stack_exclusive_type TEXT,
    applies_stage TEXT NOT NULL DEFAULT 'BASE',
    card_required TEXT,
    membership_required TEXT,
    conditions TEXT,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_to TIMESTAMP WITH TIME ZONE,
    affiliate_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    recurrence_type TEXT NOT NULL DEFAULT 'NONE',
    recurrence_rule TEXT,
    notify_on_new BOOLEAN NOT NULL DEFAULT true,
    estimated_min_save INTEGER,
    estimated_max_save INTEGER,
    voucher_claim_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 创建 profiles 表 (关联 Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT,
    nickname TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 开启 RLS 策略 (Row Level Security)
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 任何人可读 merchants 和 deals
CREATE POLICY "Allow public read access on merchants" ON public.merchants FOR SELECT USING (true);
CREATE POLICY "Allow public read access on deals" ON public.deals FOR SELECT USING (true);

-- 认证用户可读修自己的 profile
CREATE POLICY "Allow users to read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- =========================================================================
-- Seed Data 插入 (将原有的前端硬编码 UUID 替换以符合关联结构)
-- 注意：这里给商家手动指派预设 UUID，确保 Deals 关联无误
-- =========================================================================

-- 清空原有测试数据（如果有）
TRUNCATE TABLE public.deals CASCADE;
TRUNCATE TABLE public.merchants CASCADE;

-- 插入商家
INSERT INTO public.merchants (id, name, category, address, lat, lng, district, mall, avg_spend, popularity_score, rating, source)
VALUES 
('11111111-1111-1111-1111-111111111111', '费大厨辣椒炒肉', 'food', '长沙 IFS 国金中心 L7', 28.1972, 112.9769, '芙蓉区', 'IFS 国金中心', 85, 92, 4.6, 'manual'),
('22222222-2222-2222-2222-222222222222', '茶颜悦色·五一广场旗舰店', 'tea', '五一广场地铁站2号口', 28.1952, 112.9738, '天心区', NULL, 18, 98, 4.8, 'manual'),
('33333333-3333-3333-3333-333333333333', '黑色经典臭豆腐', 'food', '太平街口', 28.1931, 112.9719, '天心区', NULL, 25, 95, 4.5, 'manual'),
('44444444-4444-4444-4444-444444444444', '虾小龙·长沙小龙虾', 'food', 'IFS 国金中心 L6', 28.1971, 112.9768, '芙蓉区', 'IFS 国金中心', 120, 88, 4.4, 'manual'),
('55555555-5555-5555-5555-555555555555', '文和友老长沙龙虾馆', 'food', '海信广场ΜΑLL', 28.1964, 112.9788, '芙蓉区', '海信广场', 150, 90, 4.3, 'manual'),
('66666666-6666-6666-6666-666666666666', '墨茉点心局·IFS 店', 'dessert', 'IFS 国金中心 B1', 28.1973, 112.977, '芙蓉区', 'IFS 国金中心', 35, 87, 4.5, 'manual');

-- 插入优惠记录 (关联商家 UUID)
INSERT INTO public.deals (merchant_id, title, platform, scene, discount_type, discount_value, threshold_amount, max_discount, price, original_price, stackable, stack_group, stack_exclusive_type, applies_stage, card_required, conditions, affiliate_url)
VALUES
('11111111-1111-1111-1111-111111111111', '双人套餐·招牌辣椒炒肉+剁椒鱼头', '美团', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 128, 186, false, NULL, NULL, 'BASE', NULL, NULL, 'https://meitu.an/example'),
('11111111-1111-1111-1111-111111111111', '抖音团购·3人聚餐套餐', '抖音', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 198, 280, false, NULL, NULL, 'BASE', NULL, NULL, 'https://douyin.com/example'),
('11111111-1111-1111-1111-111111111111', '招行信用卡满100减30', '招商银行', 'dine_in', 'FULL_REDUCE', 30, 100, 30, NULL, NULL, false, 'bank_dine', 'HARD', 'BASE', '招行信用卡', '每周四限量', NULL),
('11111111-1111-1111-1111-111111111111', '建行龙支付满150减40', '建设银行', 'dine_in', 'FULL_REDUCE', 40, 150, 40, NULL, NULL, false, 'bank_dine', 'HARD', 'BASE', '建行信用卡', '每周六日', NULL),
('22222222-2222-2222-2222-222222222222', '幽兰拿铁+声声乌龙双杯套餐', '美团', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 28, 36, false, NULL, NULL, 'BASE', NULL, NULL, 'https://meitu.an/example2'),
('33333333-3333-3333-3333-333333333333', '经典臭豆腐+糖油粑粑组合', '抖音', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 19.9, 32, false, NULL, NULL, 'BASE', NULL, NULL, 'https://douyin.com/example2'),
('55555555-5555-5555-5555-555555555555', '美团85折券', '美团', 'dine_in', 'PERCENTAGE', 0.85, NULL, 50, NULL, NULL, false, NULL, NULL, 'BASE', NULL, NULL, 'https://meitu.an/example3'),
('66666666-6666-6666-6666-666666666666', '人气爆款3件套', '美团', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 29.9, 42, false, NULL, NULL, 'BASE', NULL, NULL, 'https://meitu.an/example4');

-- =========================================================================
-- 4. 用户收藏表 (user_favorites)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- 防止重复收藏同一商家
    UNIQUE(user_id, merchant_id)
);

-- 开启 RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- 用户只能操作自己的收藏
CREATE POLICY "Users can view own favorites"
    ON public.user_favorites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
    ON public.user_favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
    ON public.user_favorites FOR DELETE
    USING (auth.uid() = user_id);

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_merchant_id ON public.user_favorites(merchant_id);

-- =========================================================================
-- 5. 埋点追踪表 (click_logs)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.click_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
    platform TEXT,
    user_id UUID,
    extra TEXT,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 允许匿名和认证用户写入日志
ALTER TABLE public.click_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert click_logs" ON public.click_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read click_logs" ON public.click_logs FOR SELECT USING (true);

-- 索引加速查询
CREATE INDEX IF NOT EXISTS idx_click_logs_event_type ON public.click_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_click_logs_created_at ON public.click_logs(created_at);


