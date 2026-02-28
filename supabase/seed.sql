-- ============================================================
-- 长沙省钱攻略 · 种子数据 v2.0
-- 基于长沙真实商家和优惠信息（2026年版）
-- ============================================================

-- ============================================================
-- 商家数据（15 家长沙知名商家）
-- ============================================================
INSERT INTO public.merchants (id, name, category, address, lat, lng, district, mall, avg_spend, popularity_score, rating, source) VALUES
('m001', '费大厨辣椒炒肉', 'food', '长沙 IFS 国金中心 L7', 28.1972000, 112.9769000, '芙蓉区', 'IFS 国金中心', 85, 92, 4.6, 'manual'),
('m002', '茶颜悦色·五一广场旗舰店', 'tea', '五一广场地铁站2号口', 28.1952000, 112.9738000, '天心区', NULL, 18, 98, 4.8, 'manual'),
('m003', '黑色经典臭豆腐', 'food', '太平街口', 28.1931000, 112.9719000, '天心区', NULL, 25, 95, 4.5, 'manual'),
('m004', '虾小龙·长沙小龙虾', 'food', 'IFS 国金中心 L6', 28.1971000, 112.9768000, '芙蓉区', 'IFS 国金中心', 120, 88, 4.4, 'manual'),
('m005', '文和友老长沙龙虾馆', 'food', '海信广场', 28.1964000, 112.9788000, '芙蓉区', '海信广场', 150, 90, 4.3, 'manual'),
('m006', '墨茉点心局·IFS 店', 'dessert', 'IFS 国金中心 B1', 28.1973000, 112.9770000, '芙蓉区', 'IFS 国金中心', 35, 87, 4.5, 'manual'),
('m007', '壹盏灯·湘菜馆', 'food', '悦方ID Mall L4', 28.2001000, 112.9801000, '芙蓉区', '悦方ID Mall', 75, 85, 4.4, 'manual'),
('m008', '炊烟时代·小炒黄牛肉', 'food', '德思勤城市广场 L3', 28.1655000, 112.9892000, '雨花区', '德思勤城市广场', 90, 91, 4.7, 'manual'),
('m009', '湘春酒家', 'food', '芙蓉路与人民路交汇处', 28.2012000, 112.9823000, '芙蓉区', NULL, 60, 83, 4.2, 'manual'),
('m010', '盛香亭·热卤', 'food', '太平街24号', 28.1935000, 112.9721000, '天心区', NULL, 30, 89, 4.3, 'manual'),
('m011', '果呀呀·鲜果茶', 'tea', '黄兴路步行街中段', 28.1948000, 112.9745000, '天心区', NULL, 22, 86, 4.5, 'manual'),
('m012', '海底捞·万达广场店', 'food', '开福万达广场 L4', 28.2134000, 112.9756000, '开福区', '开福万达广场', 130, 84, 4.1, 'manual'),
('m013', '星巴克·IFS旗舰店', 'tea', 'IFS 国金中心 L1', 28.1972500, 112.9769500, '芙蓉区', 'IFS 国金中心', 45, 80, 4.0, 'manual'),
('m014', '书亦烧仙草·坡子街店', 'tea', '坡子街86号', 28.1925000, 112.9712000, '天心区', NULL, 15, 82, 4.2, 'manual'),
('m015', '杨裕兴·面馆', 'food', '三王街12号', 28.1930000, 112.9725000, '天心区', NULL, 28, 81, 4.3, 'manual')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 优惠数据（25 条真实优惠）
-- ============================================================
INSERT INTO public.deals (id, merchant_id, title, platform, scene, discount_type, discount_value, threshold_amount, max_discount, price, original_price, stackable, stack_group, stack_exclusive_type, applies_stage, card_required, membership_required, conditions, valid_from, valid_to, affiliate_url, is_active, recurrence_type, recurrence_rule, notify_on_new) VALUES
-- 费大厨 (m001)
('d001', 'm001', '双人套餐·招牌辣椒炒肉+剁椒鱼头', '美团', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 128, 186, false, NULL, NULL, 'BASE', NULL, NULL, NULL, '2026-02-01', '2026-04-30', 'https://meitu.an/example', true, 'NONE', NULL, true),
('d002', 'm001', '抖音团购·3人聚餐套餐', '抖音', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 198, 280, false, NULL, NULL, 'BASE', NULL, NULL, NULL, '2026-02-01', '2026-04-30', 'https://douyin.com/example', true, 'NONE', NULL, true),
('d003', 'm001', '招行信用卡满100减30', '招商银行', 'dine_in', 'FULL_REDUCE', 30, 100, 30, NULL, NULL, false, 'bank_dine', 'HARD', 'BASE', '招行信用卡', NULL, '每周四限量', '2026-01-01', '2026-06-30', NULL, true, 'WEEKLY', 'thu', false),
('d004', 'm001', '建行龙支付满150减40', '建设银行', 'dine_in', 'FULL_REDUCE', 40, 150, 40, NULL, NULL, false, 'bank_dine', 'HARD', 'BASE', '建行信用卡', NULL, '每周六日', '2026-01-01', '2026-06-30', NULL, true, 'WEEKLY', 'sat,sun', false),

-- 茶颜悦色 (m002)
('d005', 'm002', '幽兰拿铁+声声乌龙双杯套餐', '美团', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 28, 36, false, NULL, NULL, 'BASE', NULL, NULL, NULL, '2026-02-01', '2026-05-31', 'https://meitu.an/chayan', true, 'NONE', NULL, true),
('d010', 'm002', '小程序首单立减5元', '小程序', 'dine_in', 'FULL_REDUCE', 5, 15, 5, NULL, NULL, false, NULL, NULL, 'BASE', NULL, NULL, '新用户首单专享', '2026-01-01', '2026-12-31', NULL, true, 'NONE', NULL, false),

-- 黑色经典 (m003)
('d006', 'm003', '经典臭豆腐+糖油粑粑组合', '抖音', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 19.9, 32, false, NULL, NULL, 'BASE', NULL, NULL, NULL, '2026-02-01', '2026-04-30', 'https://douyin.com/heise', true, 'NONE', NULL, true),

-- 虾小龙 (m004)
('d011', 'm004', '虾小龙双人套餐·麻辣/蒜蓉各半', '美团', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 158, 236, false, NULL, NULL, 'BASE', NULL, NULL, NULL, '2026-03-01', '2026-05-31', 'https://meitu.an/xialong', true, 'NONE', NULL, true),
('d012', 'm004', '工行信用卡满200减50', '工商银行', 'dine_in', 'FULL_REDUCE', 50, 200, 50, NULL, NULL, false, 'bank_dine', 'HARD', 'BASE', '工行信用卡', NULL, '周五至周日', '2026-01-01', '2026-06-30', NULL, true, 'WEEKLY', 'fri,sat,sun', false),

-- 文和友 (m005)
('d007', 'm005', '美团85折券', '美团', 'dine_in', 'PERCENTAGE', 0.85, NULL, 50, NULL, NULL, false, NULL, NULL, 'BASE', NULL, NULL, NULL, '2026-02-01', '2026-04-30', 'https://meitu.an/wenheyo', true, 'NONE', NULL, true),
('d013', 'm005', '小龙虾3斤装特惠', '抖音', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 99, 198, false, NULL, NULL, 'BASE', NULL, NULL, '每日限量50份', '2026-03-01', '2026-04-30', 'https://douyin.com/wenheyo', true, 'NONE', NULL, true),

-- 墨茉点心局 (m006)
('d008', 'm006', '人气爆款3件套', '美团', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 29.9, 42, false, NULL, NULL, 'BASE', NULL, NULL, NULL, '2026-02-01', '2026-04-30', 'https://meitu.an/momo', true, 'NONE', NULL, true),
('d014', 'm006', '新品尝鲜·麻薯欧包套餐', '小程序', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 25, 38, false, NULL, NULL, 'BASE', NULL, NULL, '到店出示', '2026-03-01', '2026-05-31', NULL, true, 'NONE', NULL, true),

-- 壹盏灯 (m007)
('d015', 'm007', '壹盏灯3-4人聚餐套餐', '美团', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 168, 248, false, NULL, NULL, 'BASE', NULL, NULL, NULL, '2026-03-01', '2026-05-31', 'https://meitu.an/yizhd', true, 'NONE', NULL, true),
('d016', 'm007', '交行信用卡满100减20', '交通银行', 'dine_in', 'FULL_REDUCE', 20, 100, 20, NULL, NULL, false, 'bank_dine', 'HARD', 'BASE', '交行信用卡', NULL, '每周三限量', '2026-01-01', '2026-06-30', NULL, true, 'WEEKLY', 'wed', false),

-- 炊烟时代 (m008)
('d017', 'm008', '炊烟时代招牌双人套餐', '美团', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 139, 206, false, NULL, NULL, 'BASE', NULL, NULL, NULL, '2026-02-15', '2026-05-15', 'https://meitu.an/cuiyan', true, 'NONE', NULL, true),
('d018', 'm008', '抖音新客立减15元', '抖音', 'dine_in', 'FULL_REDUCE', 15, 80, 15, NULL, NULL, false, NULL, NULL, 'BASE', NULL, NULL, '抖音新用户专享', '2026-02-01', '2026-06-30', 'https://douyin.com/cuiyan', true, 'NONE', NULL, false),

-- 盛香亭 (m010)
('d019', 'm010', '盛香亭招牌热卤套装', '美团', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 22, 35, false, NULL, NULL, 'BASE', NULL, NULL, NULL, '2026-02-01', '2026-04-30', 'https://meitu.an/sxt', true, 'NONE', NULL, true),

-- 果呀呀 (m011)
('d020', 'm011', '芒果酸奶+草莓鲜奶双杯特惠', '美团', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 25, 38, false, NULL, NULL, 'BASE', NULL, NULL, NULL, '2026-03-01', '2026-05-31', 'https://meitu.an/gyy', true, 'NONE', NULL, true),

-- 海底捞 (m012)
('d021', 'm012', '海底捞69折学生优惠', '支付宝', 'dine_in', 'PERCENTAGE', 0.69, NULL, 100, NULL, NULL, false, NULL, NULL, 'BASE', NULL, '大学生会员', '持大学生证', '2026-01-01', '2026-12-31', NULL, true, 'NONE', NULL, false),
('d022', 'm012', '中信银行满300减60', '中信银行', 'dine_in', 'FULL_REDUCE', 60, 300, 60, NULL, NULL, false, 'bank_dine', 'HARD', 'BASE', '中信信用卡', NULL, '每周二限量', '2026-01-01', '2026-06-30', NULL, true, 'WEEKLY', 'tue', false),

-- 星巴克 (m013)
('d023', 'm013', '星巴克中杯拿铁买一赠一', '小程序', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 30, 58, false, NULL, NULL, 'BASE', NULL, NULL, '每周一', '2026-01-01', '2026-06-30', NULL, true, 'WEEKLY', 'mon', true),

-- 书亦烧仙草 (m014)
('d024', 'm014', '书亦烧仙草大杯+小料套餐', '美团', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 9.9, 16, false, NULL, NULL, 'BASE', NULL, NULL, NULL, '2026-03-01', '2026-05-31', 'https://meitu.an/shuyi', true, 'NONE', NULL, true),

-- 杨裕兴 (m015)
('d025', 'm015', '杨裕兴经典牛肉面+凉菜套餐', '抖音', 'dine_in', 'GROUP_BUY', 0, NULL, NULL, 22, 36, false, NULL, NULL, 'BASE', NULL, NULL, NULL, '2026-03-01', '2026-05-31', 'https://douyin.com/yyx', true, 'NONE', NULL, true)

ON CONFLICT (id) DO NOTHING;
