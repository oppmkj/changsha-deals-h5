/**
 * @module tracker.ts
 * @description 全链路埋点追踪系统
 * @features
 *   - 本地及远程双路事件投递
 *   - 支持从 Supabase Session 获取真实用户 ID
 *   - 用户登录态变化时自动同步缓存
 * @dependencies @supabase/supabase-js
 * @last_updated 2026-02-27 - 修复 getUserId 仅返回 mock 用户的问题
 */
import { supabase } from '../lib/supabase'

type EventType =
    | 'page_view'
    | 'deal_click'
    | 'deal_cta_click'
    | 'deal_navigate_out'
    | 'search_query'
    | 'favorite_toggle'
    | 'auth_login'

interface TrackEventParams {
    event: EventType
    dealId?: string
    merchantId?: string
    platform?: string
    extra?: Record<string, unknown>
}

const LOCAL_LOG_KEY = 'changsha_deals_click_logs'

function isSupabaseConfigured(): boolean {
    const url = import.meta.env.VITE_SUPABASE_URL
    return !!url && url !== 'http://localhost:54321'
}

/** 缓存当前用户 ID，避免每次打点都发 async 请求 */
let cachedUserId: string | null = null

/** 初始化用户 ID 缓存 */
async function initUserId(): Promise<void> {
    if (cachedUserId) return
    try {
        if (isSupabaseConfigured()) {
            const { data } = await supabase.auth.getSession()
            if (data.session?.user?.id) {
                cachedUserId = data.session.user.id
                return
            }
        }
    } catch {
        // Supabase 不可用时静默降级
    }
    // 降级：检查 mock 登录态
    const mockLoggedIn = localStorage.getItem('changsha_deals_mock_logged_in')
    if (mockLoggedIn === 'true') cachedUserId = 'mock-user-001'
}

// 启动时立即初始化
initUserId()

// 监听 Supabase 登录状态变化，实时更新缓存
if (isSupabaseConfigured()) {
    supabase.auth.onAuthStateChange((_event, session) => {
        cachedUserId = session?.user?.id ?? null
    })
}

function getUserId(): string | null {
    return cachedUserId
}

/** 本地存储 fallback（演示模式专用） */
function logToLocalStorage(params: TrackEventParams) {
    try {
        const logs = JSON.parse(localStorage.getItem(LOCAL_LOG_KEY) || '[]')
        logs.push({
            ...params,
            userId: getUserId(),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
        })
        // 最多保留最近 200 条
        if (logs.length > 200) logs.splice(0, logs.length - 200)
        localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify(logs))
    } catch {
        // ignore localStorage errors
    }
}

/**
 * 追踪埋点事件
 * - 真实 Supabase 模式：写入 click_logs 表
 * - 演示模式：写入 localStorage + console.info
 */
export async function trackEvent(params: TrackEventParams): Promise<void> {
    const payload = {
        event_type: params.event,
        deal_id: params.dealId || null,
        merchant_id: params.merchantId || null,
        platform: params.platform || null,
        extra: params.extra ? JSON.stringify(params.extra) : null,
        user_id: getUserId(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
    }

    // 控制台输出（开发调试用）
    console.info(`[📊 Track] ${params.event}`, payload)

    if (isSupabaseConfigured()) {
        try {
            await supabase.from('click_logs').insert([payload])
        } catch (err) {
            console.warn('[Tracker] Supabase insert failed, falling back to localStorage', err)
            logToLocalStorage(params)
        }
    } else {
        logToLocalStorage(params)
    }
}

/** 获取本地保存的日志（管理后台可用） */
export function getLocalLogs(): Record<string, unknown>[] {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_LOG_KEY) || '[]')
    } catch {
        return []
    }
}
