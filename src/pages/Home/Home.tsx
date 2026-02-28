/**
 * @module Home.tsx
 * @description 长沙优惠 H5 核心首页
 * @features
 *   - 展示最高省钱金额聚合
 *   - 瀑布流多端动态排列
 *   - 引入骨架屏及分级载入效果
 *   - 分类过滤（全部/信用卡/美食/附近跳转）
 *   - 下拉刷新 + 分页加载更多
 *   - 分享功能
 * @dependencies react, react-router-dom, useDeals, DealCard, useShare
 * @last_updated 2026-02-27 - 添加下拉刷新和上拉分页
 */
import { useNavigate } from 'react-router-dom'
import { useDeals } from '../../hooks/useDeals'
import Banner from '../../components/Banner'
import DealCard from '../../components/DealCard'
import DealCardSkeleton from '../../components/DealCard/DealCardSkeleton'
import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { share } from '../../lib/useShare'
import { usePageTitle } from '../../hooks/usePageTitle'

/** 每页加载数量 */
const PAGE_SIZE = 6

/** 首页筛选标签配置 */
const FILTERS = [
    { label: '全部优惠', key: 'all' },
    { label: '信用卡', key: 'card' },
    { label: '美食', key: 'food' },
    { label: '附近', key: 'nearby' },
] as const

type FilterKey = typeof FILTERS[number]['key']

export default function Home() {
    const navigate = useNavigate()
    const { deals, merchants, isLoading, error, refresh } = useDeals()
    usePageTitle('首页')
    const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
    const [page, setPage] = useState(1)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const mainRef = useRef<HTMLElement>(null)
    const sentinelRef = useRef<HTMLDivElement>(null)

    // 动态计算当前所有有效折扣中的最高省钱额
    const maxSaving = useMemo(() => {
        let max = 0
        for (const deal of deals) {
            if (deal.discountType === 'GROUP_BUY' && deal.originalPrice && deal.price) {
                const save = deal.originalPrice - deal.price
                if (save > max) max = save
            } else if (deal.discountType === 'FULL_REDUCE') {
                if (deal.discountValue > max) max = deal.discountValue
            }
        }
        return max
    }, [deals])

    // 根据选中分类过滤 deals
    const filteredDeals = useMemo(() => {
        let result = deals
        if (activeFilter === 'card') {
            result = deals.filter(d => d.cardRequired)
        } else if (activeFilter === 'food') {
            const foodMerchantIds = new Set(
                merchants.filter(m => m.category === 'food').map(m => m.id)
            )
            result = deals.filter(d => foodMerchantIds.has(d.merchantId))
        }

        // 把限时优惠排在前面：即将开始 > 进行中 > 普通 > 已结束
        const now = Date.now()
        return [...result].sort((a, b) => {
            const getScore = (d: typeof a) => {
                if (!d.validFrom && !d.validTo) return 0
                const from = d.validFrom ? new Date(d.validFrom).getTime() : 0
                const to = d.validTo ? new Date(d.validTo).getTime() : Infinity
                if (from > now) return 2 // 即将开始
                if (from <= now && to > now) return 1 // 进行中
                return -1 // 已结束
            }
            return getScore(b) - getScore(a)
        })
    }, [deals, merchants, activeFilter])

    // 分页切片
    const visibleDeals = useMemo(() => {
        return filteredDeals.slice(0, page * PAGE_SIZE)
    }, [filteredDeals, page])

    const hasMore = visibleDeals.length < filteredDeals.length

    // 切换分类时重置分页
    const handleFilterClick = (key: FilterKey) => {
        if (key === 'nearby') {
            navigate('/nearby')
            return
        }
        setActiveFilter(key)
        setPage(1)
    }

    // 下拉刷新
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true)
        await refresh()
        setPage(1)
        setIsRefreshing(false)
    }, [refresh])

    // 上拉加载更多（IntersectionObserver）
    useEffect(() => {
        const sentinel = sentinelRef.current
        if (!sentinel || !hasMore) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setPage(p => p + 1)
                }
            },
            { rootMargin: '200px' }
        )
        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [hasMore, visibleDeals.length])

    // 分享
    const handleShare = async () => {
        const success = await share({
            title: `今日最高省¥${maxSaving}！长沙优惠攻略`,
            desc: '长沙本地吃喝玩乐优惠聚合平台，一键比价找最划算的！',
        })
        if (success) {
            console.info('[Home] 分享成功')
        }
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
            {/* 头部固定区域 */}
            <header className="sticky top-0 z-50 bg-white/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between px-5 pt-5 pb-2">
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <span className="material-symbols-outlined text-[18px]">location_on</span>
                        <span className="text-sm font-medium">长沙市</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
                        >
                            <span className="material-symbols-outlined text-[20px]">share</span>
                        </button>
                        <button
                            onClick={() => navigate('/search')}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
                        >
                            <span className="material-symbols-outlined text-[20px]">search</span>
                        </button>
                    </div>
                </div>
                <div className="px-5 pb-6 pt-2">
                    <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mb-1">今日预计最高可省</p>
                    <h1 className="text-5xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
                        <span className="text-gradient">¥{maxSaving.toLocaleString()}+</span>
                    </h1>
                </div>

                {/* 运营 Banner */}
                <Banner />

                {/* 滑动 Filters */}
                <div className="flex gap-3 px-5 pb-4 overflow-x-auto custom-scrollbar">
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            onClick={() => handleFilterClick(f.key)}
                            className={`flex items-center gap-1 px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold shadow-sm transition-all active:scale-95 ${activeFilter === f.key
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : 'bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* 主体内容 */}
            <main ref={mainRef} className="px-5 pt-6 space-y-8 pb-24">
                {/* 下拉刷新指示器 */}
                {isRefreshing && (
                    <div className="flex items-center justify-center py-2 -mt-4">
                        <div className="w-5 h-5 border-2 border-slate-200 border-t-[#FF4500] rounded-full animate-spin mr-2"></div>
                        <span className="text-xs text-slate-400 font-medium">刷新中...</span>
                    </div>
                )}

                <div className="flex justify-between items-end px-1">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {activeFilter === 'all' ? '推荐好价' : FILTERS.find(f => f.key === activeFilter)?.label}
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400">
                            {filteredDeals.length} 个优惠
                        </span>
                        <button
                            onClick={handleRefresh}
                            className="text-slate-400 active:scale-95 transition-transform"
                            title="刷新"
                        >
                            <span className="material-symbols-outlined text-[16px]">refresh</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-start">
                    {isLoading ? (
                        /* 骨架屏加载态 — 4 张卡片占位 */
                        <>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={i % 2 === 0 ? 'mt-6' : ''}>
                                    <DealCardSkeleton key={i} />
                                </div>
                            ))}
                        </>
                    ) : error ? (
                        <div className="col-span-2 text-center py-10 px-4">
                            <span className="material-symbols-outlined text-[48px] text-red-400 mb-2">error</span>
                            <p className="text-sm text-slate-700 font-medium">加载数据失败，可能是网络或数据库问题</p>
                            <p className="text-xs text-slate-500 mt-2 break-all">{error.message}</p>
                        </div>
                    ) : visibleDeals.length > 0 ? (
                        <>
                            {visibleDeals.map((deal, index) => (
                                <div
                                    key={deal.id}
                                    className={`page-enter ${index % 2 === 1 ? 'mt-6' : ''}`}
                                    style={{ animationDelay: `${Math.min(index, 5) * 80}ms`, animationFillMode: 'both' }}
                                >
                                    <DealCard deal={deal} />
                                </div>
                            ))}

                            {/* 加载更多哨兵 */}
                            {hasMore ? (
                                <div ref={sentinelRef} className="col-span-2 flex items-center justify-center py-4">
                                    <div className="w-5 h-5 border-2 border-slate-200 border-t-[#FF4500] rounded-full animate-spin mr-2"></div>
                                    <span className="text-xs text-slate-400 font-medium">加载更多...</span>
                                </div>
                            ) : filteredDeals.length > PAGE_SIZE && (
                                <div className="col-span-2 text-center py-4">
                                    <span className="text-xs text-slate-400 font-medium">— 已展示全部 {filteredDeals.length} 个优惠 —</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="col-span-2 text-center py-10 px-4">
                            <span className="material-symbols-outlined text-[48px] text-slate-300 mb-2">inventory_2</span>
                            <p className="text-sm text-slate-500 font-medium">
                                {activeFilter === 'all'
                                    ? '哎呀，当前还没有生效的优惠数据呢'
                                    : `暂无"${FILTERS.find(f => f.key === activeFilter)?.label}"类别的优惠`
                                }
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
