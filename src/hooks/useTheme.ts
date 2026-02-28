/**
 * @module useTheme.ts
 * @description 全局主题切换 Hook（亮色/暗黑模式）
 * @features
 *   - 读取 localStorage 持久化的主题偏好
 *   - 支持 system（跟随系统）、light、dark 三种模式
 *   - 切换时同步更新 <html> 的 class="dark"
 *   - 监听系统主题变化自动响应
 * @dependencies react
 * @last_updated 2026-02-27 - 初始创建
 */
import { useState, useEffect, useCallback } from 'react'

type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'changsha_deals_theme'

/** 获取系统偏好的主题 */
function getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** 将主题应用到 <html> 元素 */
function applyTheme(resolved: 'light' | 'dark'): void {
    const root = document.documentElement
    if (resolved === 'dark') {
        root.classList.add('dark')
    } else {
        root.classList.remove('dark')
    }
}

export function useTheme() {
    const [mode, setModeState] = useState<ThemeMode>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
            return stored || 'light'
        } catch {
            return 'light'
        }
    })

    /** 当前实际解析后的主题（light 或 dark） */
    const resolvedTheme: 'light' | 'dark' = mode === 'system' ? getSystemTheme() : mode
    const isDark = resolvedTheme === 'dark'

    /** 切换主题 */
    const setMode = useCallback((newMode: ThemeMode) => {
        setModeState(newMode)
        try {
            localStorage.setItem(STORAGE_KEY, newMode)
        } catch {
            console.warn('[useTheme] localStorage 写入失败')
        }
    }, [])

    /** 快捷切换：亮 ↔ 暗 */
    const toggle = useCallback(() => {
        setMode(isDark ? 'light' : 'dark')
    }, [isDark, setMode])

    // 应用主题到 DOM
    useEffect(() => {
        applyTheme(resolvedTheme)
    }, [resolvedTheme])

    // 监听系统主题变化（仅 system 模式时有效）
    useEffect(() => {
        if (mode !== 'system') return
        const mql = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = () => applyTheme(getSystemTheme())
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [mode])

    return { mode, setMode, toggle, isDark, resolvedTheme }
}
