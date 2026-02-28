/**
 * @module Profile.tsx
 * @description 用户个人中心与浏览足迹
 * @features
 *   - 接入全站优惠产生的省钱总计
 *   - 浏览历史（基于埋点日志）
 *   - 联动使用者的真实收藏或脱机本地收藏
 *   - 管理鉴权状态及页面设定区
 * @dependencies react, react-router-dom, useDeals, useAuth, useFavorites, tracker
 * @last_updated 2026-02-27 - 将卡券模块替换为浏览历史
 */
import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useDeals } from '../../hooks/useDeals'
import { useAuth } from '../../hooks/useAuth'
import { useFavorites } from '../../hooks/useFavorites'
import { getLocalLogs } from '../../lib/tracker'
import { useTheme } from '../../hooks/useTheme'
import AuthModal from '../../components/AuthModal/AuthModal'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useToast } from '../../components/Toast'
import type { Deal } from '../../models/deal'

export default function Profile() {
    const navigate = useNavigate()
    const { deals, merchants, isUsingFallback } = useDeals()
    usePageTitle('我的')
    const { user, isUsingMock, signOut } = useAuth()
    const { favorites, isLoading: favsLoading } = useFavorites(user?.id)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history')
    const { isDark, toggle: toggleTheme } = useTheme()
    const { info } = useToast()

    /** 浏览历史条目类型 */
    interface BrowsingHistoryItem {
        deal: Deal
        viewedAt: string
        timeAgo: string
    }

    /** 将时间戳转为"x分钟前"格式 */
    const formatTimeAgo = (timestamp: string): string => {
        const diff = Date.now() - new Date(timestamp).getTime()
        const minutes = Math.floor(diff / 60000)
        if (minutes < 1) return '刚刚'
        if (minutes < 60) return `${minutes}分钟前`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}小时前`
        const days = Math.floor(hours / 24)
        return `${days}天前`
    }

    // 从埋点日志构建浏览历史（去重，最近 20 条）
    const browsingHistory = useMemo<BrowsingHistoryItem[]>(() => {
        const logs = getLocalLogs()
        const clickLogs = logs
            .filter((log: Record<string, unknown>) => log.event_type === 'deal_click' && log.deal_id)
            .reverse() // 最新的在前

        // 按 deal_id 去重，只保留每个 deal 最近一次点击
        const seen = new Set<string>()
        const uniqueLogs: { dealId: string; timestamp: string }[] = []
        for (const log of clickLogs) {
            const dealId = log.deal_id as string
            if (!seen.has(dealId)) {
                seen.add(dealId)
                uniqueLogs.push({
                    dealId,
                    timestamp: (log.created_at || log.timestamp || new Date().toISOString()) as string,
                })
            }
        }

        return uniqueLogs
            .slice(0, 20)
            .map(entry => {
                const deal = deals.find(d => d.id === entry.dealId)
                if (!deal) return null
                return {
                    deal,
                    viewedAt: entry.timestamp,
                    timeAgo: formatTimeAgo(entry.timestamp),
                }
            })
            .filter(Boolean) as BrowsingHistoryItem[]
    }, [deals])

    // 省钱统计
    const stats = useMemo(() => {
        const totalSaved = deals.reduce((sum, d) => {
            const save = (d.originalPrice || 0) - (d.price || 0)
            return sum + (save > 0 ? save : d.discountValue || 0)
        }, 0)
        return {
            dealsUsed: deals.length,
            totalSaved: Math.round(totalSaved),
            platforms: new Set(deals.map(d => d.platform)).size,
        }
    }, [deals])

    // 将收藏 ID 映射回完整的 merchantData
    const savedMerchants = useMemo(() => {
        return favorites
            .map(fav => merchants.find(m => m.id === fav.merchantId))
            .filter(Boolean) as typeof merchants
    }, [favorites, merchants])

    /** 根据 merchantId 找到第一个关联 deal 并跳转 */
    const navigateToMerchantDeal = (merchantId: string) => {
        const relatedDeal = deals.find(d => d.merchantId === merchantId)
        if (relatedDeal) {
            navigate(`/deal/${relatedDeal.id}`)
        } else {
            navigate(`/search`)
        }
    }

    const displayName = user
        ? (user.user_metadata?.name || user.phone || '长沙优惠用户')
        : '未登录'
    const displayPhone = user?.phone
        ? `${user.phone.slice(0, 3)}****${user.phone.slice(-4)}`
        : '点击登录，开始省钱之旅'

    const handleSignOut = async () => {
        await signOut()
    }

    return (
        <>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-display pb-24">
                {/* Header 渐变区 */}
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-12 pb-16 px-5 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-8 -right-8 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl"></div>
                    </div>

                    <div className="relative z-10 flex items-center gap-4">
                        {/* 头像 */}
                        <div
                            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF4500] to-[#FF8C00] flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0 text-white text-xl font-black cursor-pointer"
                            onClick={() => !user && setShowAuthModal(true)}
                        >
                            {user ? displayName.slice(-1) : <span className="material-symbols-outlined text-[28px]">person</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-white font-black text-lg leading-tight truncate">{displayName}</h1>
                                {user && (
                                    <span className="shrink-0 px-2 py-0.5 bg-amber-400/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-400/30">
                                        {isUsingMock ? '演示会员' : '正式会员'}
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-400 text-sm font-medium">{displayPhone}</p>
                        </div>
                        {user ? (
                            <button className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-slate-300 active:bg-white/20">
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowAuthModal(true)}
                                className="shrink-0 px-4 py-2 bg-[#FF4500] text-white text-xs font-bold rounded-full active:scale-95 transition-transform"
                            >
                                登录
                            </button>
                        )}
                    </div>

                    {isUsingFallback && (
                        <div className="relative z-10 mt-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium px-3 py-2 rounded-xl">
                            <span className="material-symbols-outlined text-[14px]">info</span>
                            演示模式：配置 Supabase 环境变量后即可接入真实账户
                        </div>
                    )}
                </div>

                {/* 统计卡片（悬浮） */}
                <div className="mx-4 -mt-8 relative z-20">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg shadow-slate-900/10 border border-slate-100 dark:border-slate-700/50 p-5">
                        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-700">
                            <div className="text-center pr-4">
                                <div className="text-2xl font-black text-[#FF4500] leading-none mb-1">¥{stats.totalSaved}</div>
                                <div className="text-[11px] text-slate-500 font-medium">累计省钱</div>
                            </div>
                            <div className="text-center px-4">
                                <div className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">{savedMerchants.length}</div>
                                <div className="text-[11px] text-slate-500 font-medium">收藏商家</div>
                            </div>
                            <div className="text-center pl-4">
                                <div className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">{stats.platforms}</div>
                                <div className="text-[11px] text-slate-500 font-medium">平台覆盖</div>
                            </div>
                        </div>
                    </div>
                </div>

                <main className="px-4 pt-5 space-y-4">
                    {/* 快捷操作 */}
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { icon: 'history', label: '浏览历史', color: 'text-orange-500 bg-orange-50 dark:bg-orange-500/10', action: () => setActiveTab('history') },
                            { icon: 'favorite', label: '收藏夹', color: 'text-pink-500 bg-pink-50 dark:bg-pink-500/10', action: () => setActiveTab('favorites') },
                            { icon: 'receipt_long', label: '消费记录', color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10', action: () => navigate('/search') },
                            { icon: 'card_giftcard', label: '邀请有礼', color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10', action: () => info('邀请好友功能即将上线，敬请期待！') },
                        ].map(item => (
                            <button key={item.label} onClick={item.action} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
                                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center shadow-sm`}>
                                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                                </div>
                                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-tight text-center">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab 切换栏 */}
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1">
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'history'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500'
                                }`}
                        >
                            浏览历史
                        </button>
                        <button
                            onClick={() => setActiveTab('favorites')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'favorites'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500'
                                }`}
                        >
                            收藏商家
                        </button>
                    </div>

                    {/* 浏览历史区域 */}
                    {activeTab === 'history' && (
                        <section>
                            {browsingHistory.length === 0 ? (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 flex flex-col items-center gap-3">
                                    <span className="material-symbols-outlined text-[40px] text-slate-300">explore</span>
                                    <p className="text-sm text-slate-500 font-medium">还没有浏览记录</p>
                                    <button
                                        onClick={() => navigate('/')}
                                        className="mt-1 px-4 py-2 text-xs font-bold text-[#FF4500] bg-orange-50 rounded-full active:scale-95 transition-transform"
                                    >
                                        去首页发现优惠
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {browsingHistory.map(item => (
                                        <div
                                            key={item.deal.id + '-' + item.viewedAt}
                                            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-3 cursor-pointer active:bg-slate-50 transition-colors"
                                            onClick={() => navigate(`/deal/${item.deal.id}`)}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[20px] text-[#FF4500]">storefront</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.deal.title}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-slate-400">{item.deal.platform}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span className="text-xs text-slate-400">{item.timeAgo}</span>
                                                </div>
                                            </div>
                                            <span className="text-sm font-black text-[#FF4500] shrink-0">¥{item.deal.price || item.deal.discountValue}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {/* 收藏的商家（使用真实数据） */}
                    {activeTab === 'favorites' && (
                        <section>
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                    收藏的商家 {savedMerchants.length > 0 && <span className="text-xs text-slate-400 font-normal ml-1">({savedMerchants.length})</span>}
                                </h2>
                                {savedMerchants.length > 2 && (
                                    <button className="text-xs text-primary font-bold">查看全部</button>
                                )}
                            </div>

                            {favsLoading ? (
                                <div className="flex items-center justify-center py-8 text-slate-400">
                                    <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mr-2"></div>
                                    加载收藏中...
                                </div>
                            ) : !user ? (
                                <div
                                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center gap-3 cursor-pointer active:bg-slate-50 transition-colors"
                                    onClick={() => setShowAuthModal(true)}
                                >
                                    <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[24px] text-[#FF4500]">favorite</span>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">登录后查看收藏</p>
                                        <p className="text-xs text-slate-400 mt-0.5">收藏心仪商家，不错过任何优惠</p>
                                    </div>
                                </div>
                            ) : savedMerchants.length === 0 ? (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center gap-3">
                                    <span className="material-symbols-outlined text-4xl text-slate-300">bookmark_border</span>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-slate-500">还没有收藏哦</p>
                                        <p className="text-xs text-slate-400 mt-0.5">去详情页点击 ❤️ 收藏你最爱的商家</p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/')}
                                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-full"
                                    >
                                        去发现好店
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {savedMerchants.slice(0, 5).map(merchant => (
                                        <div
                                            key={merchant.id}
                                            className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center gap-3 active:bg-slate-50 transition-colors cursor-pointer"
                                            onClick={() => navigateToMerchantDeal(merchant.id)}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-slate-400 text-[20px]">storefront</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{merchant.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-slate-400">{merchant.category}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span className="text-xs text-slate-400">{merchant.district}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span className="text-xs text-orange-500 font-bold flex items-center gap-0.5">
                                                        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                        {merchant.rating?.toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-slate-300 text-[20px]">chevron_right</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {/* 设置区 */}
                    <section>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">设置</h2>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm divide-y divide-slate-100 dark:divide-slate-700/50">
                            {[
                                { icon: 'notifications', label: '消息通知', badge: 2 },
                                { icon: 'credit_card', label: '绑定信用卡', badge: null },
                                { icon: 'lock', label: '隐私设置', badge: null },
                                { icon: 'info', label: '关于长湘优惠 v0.3.0', badge: null },
                            ].map((item, idx) => (
                                <button
                                    key={item.label}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 dark:active:bg-slate-700/50 transition-colors ${idx === 0 ? 'rounded-t-2xl' : ''}`}
                                >
                                    <span className="material-symbols-outlined text-slate-400 text-[22px]">{item.icon}</span>
                                    <span className="flex-1 text-left text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                                    {item.badge && (
                                        <span className="w-5 h-5 rounded-full bg-[#FF4500] text-white text-[10px] font-black flex items-center justify-center">
                                            {item.badge}
                                        </span>
                                    )}
                                    <span className="material-symbols-outlined text-slate-300 text-[18px]">chevron_right</span>
                                </button>
                            ))}

                            {/* 暗黑模式开关 */}
                            <div className="w-full flex items-center gap-3 px-4 py-3.5 rounded-b-2xl">
                                <span className="material-symbols-outlined text-slate-400 text-[22px]">{isDark ? 'dark_mode' : 'light_mode'}</span>
                                <span className="flex-1 text-left text-sm font-medium text-slate-700 dark:text-slate-200">暗黑模式</span>
                                <button
                                    onClick={toggleTheme}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${isDark ? 'bg-[#FF4500]' : 'bg-slate-200'
                                        }`}
                                >
                                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isDark ? 'left-[22px]' : 'left-0.5'
                                        }`} />
                                </button>
                            </div>
                        </div>
                    </section>

                    {user ? (
                        <button
                            onClick={handleSignOut}
                            className="w-full py-3.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl text-sm font-bold text-red-400 shadow-sm active:bg-red-50 transition-colors"
                        >
                            退出登录
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="w-full py-3.5 bg-[linear-gradient(135deg,#FF4500_0%,#FF8C00_100%)] text-white rounded-2xl text-sm font-bold shadow-lg shadow-orange-200/50 active:scale-[0.98] transition-all"
                        >
                            登录 / 注册，开启省钱之旅 →
                        </button>
                    )}
                </main>
            </div>

            {/* 登录弹窗 */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </>
    )
}
