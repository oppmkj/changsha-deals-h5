import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ 缺少 Supabase 环境变量。请确保 .env 或者 .env.local 已正确设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。')
}

export const supabase = createClient(
    supabaseUrl || 'http://localhost:54321', // 默认回退本地占位防止报错
    supabaseAnonKey || 'public-anon-key'
)
