/**
 * @module useAuth.ts
 * @description 封装 Supabase Auth 身份验证与会话管理
 * @features
 *   - 提供 OTP 手机号登录与核销
 *   - 支持一键演示 Mock 流
 *   - 暴露出状态位
 *   - signOut 增加 try/catch 保护
 * @dependencies @supabase/supabase-js, react
 * @last_updated 2026-02-27 - signOut 增加错误处理，防止网络异常导致 UI 状态卡死
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

// 演示模式下使用的 Mock 用户（无需 Supabase）
const MOCK_USER: User = {
    id: 'mock-user-001',
    email: undefined,
    phone: '13800000000',
    app_metadata: {},
    user_metadata: { name: '演示用户', avatar_url: null },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString(),
}

type AuthStep = 'idle' | 'phone' | 'otp' | 'loading' | 'success'

interface UseAuthResult {
    user: User | null
    session: Session | null
    isLoading: boolean
    isUsingMock: boolean
    authStep: AuthStep
    errorMsg: string | null
    setAuthStep: (step: AuthStep) => void
    signInWithPhone: (phone: string) => Promise<void>
    verifyOtp: (phone: string, token: string) => Promise<void>
    signOut: () => Promise<void>
    // 演示模式下直接"快速登录"
    mockSignIn: () => void
}

export function useAuth(): UseAuthResult {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isUsingMock, setIsUsingMock] = useState(false)
    const [authStep, setAuthStep] = useState<AuthStep>('idle')
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const isSupabaseConfigured = (): boolean => {
        const url = import.meta.env.VITE_SUPABASE_URL
        return !!url && url !== 'http://localhost:54321'
    }

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            // 演示模式：检查 localStorage 是否有缓存的 mock 登录状态
            const mockLoggedIn = localStorage.getItem('changsha_deals_mock_logged_in')
            if (mockLoggedIn === 'true') {
                setUser(MOCK_USER)
                setIsUsingMock(true)
            }
            setIsLoading(false)
            return
        }

        // 真实 Supabase 模式：监听会话状态变化
        setIsLoading(true)
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            setIsLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signInWithPhone = async (phone: string) => {
        setErrorMsg(null)
        if (!isSupabaseConfigured()) {
            // 演示模式：发送"验证码"（始终成功，假延迟）
            setAuthStep('loading')
            await new Promise(r => setTimeout(r, 800))
            setAuthStep('otp')
            return
        }

        try {
            setAuthStep('loading')
            const { error } = await supabase.auth.signInWithOtp({
                phone: phone.startsWith('+86') ? phone : `+86${phone}`,
                options: { channel: 'sms' }
            })
            if (error) throw error
            setAuthStep('otp')
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : '发送验证码失败，请检查手机号'
            setErrorMsg(message)
            setAuthStep('phone')
        }
    }

    const verifyOtp = async (phone: string, token: string) => {
        setErrorMsg(null)
        if (!isSupabaseConfigured()) {
            // 演示模式：任意 6 位即视为验证成功
            if (token.length === 6) {
                setAuthStep('loading')
                await new Promise(r => setTimeout(r, 600))
                setUser(MOCK_USER)
                setIsUsingMock(true)
                localStorage.setItem('changsha_deals_mock_logged_in', 'true')
                setAuthStep('success')
            } else {
                setErrorMsg('请输入 6 位验证码')
            }
            return
        }

        try {
            setAuthStep('loading')
            const { data, error } = await supabase.auth.verifyOtp({
                phone: phone.startsWith('+86') ? phone : `+86${phone}`,
                token,
                type: 'sms'
            })
            if (error) throw error
            setUser(data.user)
            setSession(data.session)
            setAuthStep('success')
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : '验证码错误或已过期'
            setErrorMsg(message)
            setAuthStep('otp')
        }
    }

    const signOut = async () => {
        if (!isSupabaseConfigured()) {
            setUser(null)
            setIsUsingMock(false)
            localStorage.removeItem('changsha_deals_mock_logged_in')
            setAuthStep('idle')
            return
        }
        try {
            await supabase.auth.signOut()
        } catch (err) {
            console.warn('[useAuth] signOut 失败，已本地清除状态', err)
        } finally {
            // 无论网络成功与否都清空本地状态，避免用户卡死在登录态
            setUser(null)
            setSession(null)
            setAuthStep('idle')
        }
    }

    const mockSignIn = () => {
        setUser(MOCK_USER)
        setIsUsingMock(true)
        localStorage.setItem('changsha_deals_mock_logged_in', 'true')
        setAuthStep('success')
    }

    return {
        user, session, isLoading, isUsingMock,
        authStep, errorMsg,
        setAuthStep,
        signInWithPhone, verifyOtp, signOut, mockSignIn
    }
}
