/**
 * @module Toast.tsx
 * @description 全局 Toast 通知组件 + Context Provider + useToast Hook
 * @features
 *   - 支持 success/info/warning/error 四种类型
 *   - 自动消失（可配置时长）
 *   - 多条 Toast 堆叠显示
 *   - 暗黑模式适配
 *   - 进入/退出动画
 * @dependencies react
 * @last_updated 2026-02-28 - 初始创建
 */
import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

/** Toast 类型 */
type ToastType = 'success' | 'info' | 'warning' | 'error'

interface ToastItem {
    id: number
    message: string
    type: ToastType
    duration: number
    exiting?: boolean
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType, duration?: number) => void
    success: (message: string) => void
    error: (message: string) => void
    info: (message: string) => void
    warning: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

/** Toast 图标映射 */
const ICONS: Record<ToastType, string> = {
    success: 'check_circle',
    info: 'info',
    warning: 'warning',
    error: 'error',
}

/** Toast 颜色映射 */
const COLORS: Record<ToastType, string> = {
    success: 'bg-emerald-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
}

/** Toast Provider — 包裹在 App 最外层 */
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])
    const idRef = useRef(0)

    const removeToast = useCallback((id: number) => {
        // 先标记退出动画
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
        // 300ms 后真正移除
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 300)
    }, [])

    const addToast = useCallback((message: string, type: ToastType = 'info', duration = 2500) => {
        const id = ++idRef.current
        setToasts(prev => [...prev, { id, message, type, duration }])

        // 自动消失
        setTimeout(() => removeToast(id), duration)
    }, [removeToast])

    const contextValue: ToastContextValue = {
        toast: addToast,
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        info: (msg) => addToast(msg, 'info'),
        warning: (msg) => addToast(msg, 'warning'),
    }

    return (
        <ToastContext.Provider value={contextValue}>
            {children}

            {/* Toast 容器 — 固定在顶部居中 */}
            <div className="fixed top-0 inset-x-0 z-[9999] flex flex-col items-center gap-2 pt-[env(safe-area-inset-top,12px)] px-4 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg backdrop-blur-md text-white text-sm font-semibold max-w-[90vw] transition-all duration-300 ${t.exiting
                                ? 'opacity-0 -translate-y-2 scale-95'
                                : 'opacity-100 translate-y-0 scale-100 animate-in slide-in-from-top-4 fade-in'
                            } ${COLORS[t.type]}/90`}
                        onClick={() => removeToast(t.id)}
                    >
                        <span className="material-symbols-outlined text-[20px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {ICONS[t.type]}
                        </span>
                        <span className="flex-1 leading-snug">{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

/** 获取 Toast 方法的 Hook */
export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext)
    if (!ctx) {
        throw new Error('useToast 必须在 ToastProvider 内使用')
    }
    return ctx
}
