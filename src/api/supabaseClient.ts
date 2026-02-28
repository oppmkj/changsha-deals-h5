/**
 * Supabase 客户端实例
 * Repository 层底层封装
 */
import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey)
