/**
 * @module Search.tsx
 * @description 搜索和多维度分类筛选结果页
 * @features
 *   - 关键词模糊匹配（支持包含匹配 + 分词匹配）
 *   - 热门搜索推荐和服务空状态
 *   - 本地维护最近搜索历史列表
 *   - 动态页面标题
 * @dependencies react, react-router-dom, useDeals, tracker, usePageTitle
 * @last_updated 2026-02-27 - 增强模糊匹配 + 热门推荐
 */
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeals } from '../../hooks/useDeals'
import { useAuth } from '../../hooks/useAuth'
import { useFavorites } from '../../hooks/useFavorites'
import { trackEvent } from '../../lib/tracker'
import { usePageTitle } from '../../hooks/usePageTitle'
import DealCard from '../../components/DealCard'
import DealCardSkeleton from '../../components/DealCard/DealCardSkeleton'

/** 热门搜索推荐词 */
const HOT_KEYWORDS = ['美食', '茶饮', '火锅', '套餐', '信用卡', '抢购', '团购', '外卖']

const HISTORY_KEY = 'changsha_deals_search_history'
const MAX_HISTORY = 8

function loadHistory(): string[] {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
function saveHistory(list: string[]) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)))
}

export default function Search() {
    const navigate = useNavigate()
    const { deals, merchants, isLoading } = useDeals()
    const { user } = useAuth()
    const { favorites } = useFavorites(user?.id)
    usePageTitle('搜索发现')

    const [keyword, setKeyword] = useState('')
    const [debouncedKeyword, setDebouncedKeyword] = useState('')
    const [activeTab, setActiveTab] = useState('all')
    const [activeDistrict, setActiveDistrict] = useState('芙蓉区 (IFS)')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [searchHistory, setSearchHistory] = useState<string[]>(loadHistory)
    const inputRef = useRef<HTMLInputElement>(null)

    // 防抖逻辑：300ms 后才执行搜索
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(keyword.trim())
        }, 300)
        return () => clearTimeout(timer)
    }, [keyword])

    // 搜索行为追踪
    useEffect(() => {
        if (debouncedKeyword) {
            trackEvent({ event: 'search_query', extra: { keyword: debouncedKeyword } })
        }
    }, [debouncedKeyword])

    // 记录搜索历史
    const addToHistory = useCallback((term: string) => {
        if (!term.trim()) return
        setSearchHistory(prev => {
            const next = [term, ...prev.filter(h => h !== term)].slice(0, MAX_HISTORY)
            saveHistory(next)
            return next
        })
    }, [])

    const clearHistory = () => {
        setSearchHistory([])
        localStorage.removeItem(HISTORY_KEY)
    }

    const filteredDeals = useMemo(() => {
        if (!debouncedKeyword) return deals

        const kw = debouncedKeyword.toLowerCase()
        const keywords = kw.split(/\s+/).filter(Boolean)

        const result = deals.filter(deal => {
            const merchant = merchants.find(m => m.id === deal.merchantId)
            const searchableText = [
                deal.title,
                merchant?.name,
                deal.platform,
                merchant?.category,
                merchant?.district,
                deal.discountType === 'GROUP_BUY' ? '套餐 团购' : '代金券 满减',
                deal.cardRequired ? `信用卡 ${deal.cardRequired}` : '',
            ].filter(Boolean).join(' ').toLowerCase()

            const matchKeywords = keywords.every(k => searchableText.includes(k))

            let matchDistrict = true
            if (activeDistrict && activeDistrict !== '全部区域' && !activeDistrict.startsWith('附近')) {
                const districtName = activeDistrict.split(' ')[0]
                matchDistrict = merchant?.district === districtName
            }

            let matchMine = true
            if (activeTab === 'mine') {
                matchMine = favorites.some(f => f.dealId === deal.id)
            }

            return matchKeywords && matchDistrict && matchMine
        })

        // 排序处理
        if (activeTab === 'sort') {
            return [...result].sort((a, b) => {
                const savingA = a.discountType === 'GROUP_BUY' ? (a.originalPrice! - a.price!) : a.discountValue
                const savingB = b.discountType === 'GROUP_BUY' ? (b.originalPrice! - b.price!) : b.discountValue
                return savingB - savingA
            })
        }

        return result
    }, [debouncedKeyword, deals, merchants, activeDistrict, activeTab, favorites])

    const toggleTab = (tab: string) => {
        if (activeTab === tab && isDropdownOpen) {
            setIsDropdownOpen(false)
            setActiveTab('')
        } else {
            setActiveTab(tab)
            if (tab === 'distance') setIsDropdownOpen(true)
            else setIsDropdownOpen(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && keyword.trim()) {
            addToHistory(keyword.trim())
        }
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="flex items-center gap-3 p-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>

                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                            <span className="material-symbols-outlined text-[20px]">search</span>
                        </div>
                        <input
                            ref={inputRef}
                            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-10 text-sm focus:ring-2 focus:ring-primary/50 transition-all font-medium outline-none"
                            placeholder="搜索周边优惠..."
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        {keyword && (
                            <button
                                onClick={() => setKeyword('')}
                                className="absolute inset-y-0 right-3 flex items-center text-slate-400 focus:outline-none"
                            >
                                <span className="material-symbols-outlined text-[18px]">cancel</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 筛选 Tabs */}
                <div className="flex gap-2 px-4 pb-4 overflow-x-auto custom-scrollbar relative z-20">
                    <button
                        onClick={() => toggleTab('all')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap text-xs transition-colors ${activeTab === 'all' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 font-semibold hover:bg-primary/10'}`}>
                        全部品类 <span className="material-symbols-outlined text-[16px]">expand_more</span>
                    </button>
                    <button
                        onClick={() => toggleTab('distance')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full border whitespace-nowrap text-xs font-bold transition-all ${activeTab === 'distance' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-900 dark:text-white'}`}>
                        3km ▾
                    </button>
                    <button
                        onClick={() => toggleTab('mine')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap text-xs transition-colors ${activeTab === 'mine' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 font-semibold'}`}>
                        收藏优惠
                    </button>
                    <button
                        onClick={() => toggleTab('sort')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap text-xs transition-colors ${activeTab === 'sort' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 font-semibold'}`}>
                        智能排序 <span className="material-symbols-outlined text-[16px]">swap_vert</span>
                    </button>
                </div>
            </header>

            <main className="relative pb-8">
                {/* 区域选择悬浮框 */}
                {isDropdownOpen && activeTab === 'distance' && (
                    <>
                        <div className="absolute inset-0 bg-black/20 z-40 h-screen" onClick={() => setIsDropdownOpen(false)}></div>
                        <div className="absolute top-0 inset-x-4 pt-2 mb-4 z-50">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 px-1">选择区域</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {['全部区域', '附近 1km', '附近 3km', '芙蓉区 (IFS)', '岳麓区 (大学城)', '开福区 (北辰)', '天心区', '雨花区', '望城区'].map(dist => (
                                        <button
                                            key={dist}
                                            onClick={() => setActiveDistrict(dist)}
                                            className={`flex items-center justify-between p-3 rounded-xl border-2 font-medium transition-all ${activeDistrict === dist ? 'bg-primary/5 border-primary text-slate-900 dark:text-white font-bold' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'}`}
                                        >
                                            <span>{dist}</span>
                                            {activeDistrict === dist && <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={() => { setActiveDistrict('全部区域'); setIsDropdownOpen(false) }}
                                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm text-slate-600">
                                        重置
                                    </button>
                                    <button
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                                        确认筛选
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* 搜索历史（当搜索框为空时展示） */}
                {!debouncedKeyword && searchHistory.length > 0 && (
                    <div className="px-4 py-4 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">搜索历史</h3>
                            <button onClick={clearHistory} className="text-xs text-slate-400 font-medium flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[14px]">delete</span>清除
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {searchHistory.map(term => (
                                <button
                                    key={term}
                                    onClick={() => { setKeyword(term); addToHistory(term) }}
                                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 搜索结果列表 */}
                <div className="px-4 py-2 space-y-4">
                    {isLoading ? (
                        <>
                            {[1, 2, 3].map(i => <DealCardSkeleton key={i} />)}
                        </>
                    ) : filteredDeals.length > 0 ? (
                        filteredDeals.map((deal, index) => (
                            <div
                                key={deal.id}
                                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                                style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
                            >
                                <DealCard
                                    deal={{ ...deal, merchantName: merchants.find(m => m.id === deal.merchantId)?.name }}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16">
                            <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 mb-4">search_off</span>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">没找到相关优惠内容</p>
                            <p className="text-xs text-slate-400 mt-2 mb-4">换个词试试？</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {HOT_KEYWORDS.map(kw => (
                                    <button
                                        key={kw}
                                        onClick={() => { setKeyword(kw); addToHistory(kw) }}
                                        className="px-3 py-1.5 bg-orange-50 dark:bg-orange-500/10 text-[#FF4500] rounded-full text-xs font-bold active:scale-95 transition-transform"
                                    >
                                        {kw}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
