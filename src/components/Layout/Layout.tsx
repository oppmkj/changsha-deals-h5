/**
 * @module Layout.tsx
 * @description 应用全局底部导航栏布局容器
 * @features
 *   - 玻璃态毛玻璃浮动底部导航
 *   - 支持 5 个 Tab 切换及 neon-glow 高亮
 *   - 页面内容通过 Outlet 渲染 + 路由切换动画
 *   - 左右滑动手势切换 Tab
 *   - ARIA 无障碍标签（role=navigation, tablist, tab）
 * @dependencies react, react-router-dom
 * @last_updated 2026-02-28 - 添加滑动手势切换和 ARIA 无障碍支持
 */
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useRef, useCallback } from 'react'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import './Layout.css'

interface TabItem {
    key: string
    path: string
    label: string
    icon: string
    isCenter?: boolean
}

const TABS: TabItem[] = [
    { key: 'home', path: '/', label: '首页', icon: 'home' },
    { key: 'nearby', path: '/nearby', label: '优惠', icon: 'local_activity' },
    { key: 'calendar', path: '/calendar', label: '日历', icon: 'calendar_month', isCenter: true },
    { key: 'explore', path: '/search', label: '发现', icon: 'explore' },
    { key: 'profile', path: '/profile', label: '我的', icon: 'person' },
]

/** 滑动手势阈值（px） */
const SWIPE_THRESHOLD = 50

export default function Layout() {
    const navigate = useNavigate()
    const location = useLocation()
    const isOnline = useOnlineStatus()

    // 手势跟踪
    const touchStartX = useRef(0)
    const touchStartY = useRef(0)

    function isActive(path: string): boolean {
        if (path === '/') return location.pathname === '/'
        return location.pathname.startsWith(path)
    }

    /** 获取当前 Tab 索引 */
    const getCurrentIndex = useCallback((): number => {
        const idx = TABS.findIndex(t => isActive(t.path))
        return idx >= 0 ? idx : 0
    }, [location.pathname])

    /** 手势开始 */
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
        touchStartY.current = e.touches[0].clientY
    }, [])

    /** 手势结束，判断滑动方向 */
    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current
        const dy = e.changedTouches[0].clientY - touchStartY.current

        // 纵向滑动幅度大于横向，忽略（用户在滚动页面）
        if (Math.abs(dy) > Math.abs(dx)) return
        // 未达到阈值
        if (Math.abs(dx) < SWIPE_THRESHOLD) return

        const current = getCurrentIndex()

        if (dx < 0 && current < TABS.length - 1) {
            // 左滑 → 下一个 Tab
            navigate(TABS[current + 1].path)
        } else if (dx > 0 && current > 0) {
            // 右滑 → 上一个 Tab
            navigate(TABS[current - 1].path)
        }
    }, [getCurrentIndex, navigate])

    return (
        <div
            className="relative min-h-screen"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <main className="pb-32" role="main" aria-label="页面内容">
                {/* 离线横幅 */}
                {!isOnline && (
                    <div className="sticky top-0 z-50 bg-amber-500 text-white text-xs font-bold text-center py-2 px-4 flex items-center justify-center gap-1.5 shadow-md">
                        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">wifi_off</span>
                        当前网络已断开，部分功能可能不可用
                    </div>
                )}
                <div key={location.pathname} className="page-enter">
                    <Outlet />
                </div>
            </main>

            <nav
                className="fixed bottom-0 left-0 right-0 glass-nav border-t border-white/5 px-6 pt-3 pb-8 z-[60] rounded-t-3xl shadow-2xl"
                role="navigation"
                aria-label="底部导航"
            >
                <div
                    className="flex justify-between items-center max-w-md mx-auto relative px-4"
                    role="tablist"
                    aria-label="页面切换"
                >
                    {TABS.map((tab) => {
                        const active = isActive(tab.path)
                        return (
                            <a
                                key={tab.key}
                                role="tab"
                                aria-selected={active}
                                aria-label={tab.label}
                                tabIndex={active ? 0 : -1}
                                className={`flex flex-col items-center gap-1.5 cursor-pointer group transition-colors ${active ? 'text-primary active-indicator' : 'text-slate-500 hover:text-white'
                                    }`}
                                onClick={(e) => {
                                    e.preventDefault()
                                    navigate(tab.path)
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        navigate(tab.path)
                                    }
                                }}
                            >
                                <span
                                    className={`material-symbols-outlined text-[26px] ${active ? 'neon-glow' : 'group-hover:text-primary transition-colors'
                                        }`}
                                    style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                                    aria-hidden="true"
                                >
                                    {tab.icon}
                                </span>
                                <span
                                    className={`text-[10px] font-bold tracking-tight ${active ? 'neon-glow' : ''
                                        }`}
                                >
                                    {tab.label}
                                </span>
                            </a>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}
