/**
 * @module DealDetail.tsx
 * @description 单个优惠的比价展示与转化沉浸页
 * @features
 *   - 自动拉起凑单智能计算器
 *   - 控制转化 CTA 与授权阻塞拦截
 *   - 产生访问、点击及离开时打点记录
 * @dependencies react-router-dom, useDeals, useAuth, useFavorites, tracker
 * @last_updated 2026-02-27 - 修复 Hook 规则违反：useEffect 移到条件 return 之前
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { useDeals } from '../../hooks/useDeals'
import { useAuth } from '../../hooks/useAuth'
import { useFavorites } from '../../hooks/useFavorites'
import { trackEvent } from '../../lib/tracker'
import { share } from '../../lib/useShare'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useToast } from '../../components/Toast'
import CountdownBadge from '../../components/CountdownBadge'
import AuthModal from '../../components/AuthModal/AuthModal'

export default function DealDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { deals, merchants, isLoading } = useDeals()

    const [spendAmount, setSpendAmount] = useState<number>(100)
    const [showActionSheet, setShowActionSheet] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [heartAnimating, setHeartAnimating] = useState(false)
    const { info } = useToast()

    const { user } = useAuth()
    const { isFavorited, toggleFavorite } = useFavorites(user?.id)

    // 从真实数据中寻找对应的 Deal 和 Merchant
    const deal = useMemo(() => {
        if (!id || deals.length === 0) return null
        return deals.find(d => d.id === id) || deals[0]
    }, [id, deals])

    const merchant = useMemo(() => {
        if (!deal || merchants.length === 0) return null
        return merchants.find(m => m.id === deal.merchantId)
    }, [deal, merchants])

    // 动态页面标题
    usePageTitle(deal && merchant ? `${merchant.name} - ${deal.title}` : '优惠详情')

    // 页面曝光埋点（必须在所有条件 return 之前，遵守 React Hook 规则）
    useEffect(() => {
        if (deal && merchant) {
            trackEvent({
                event: 'page_view',
                dealId: deal.id,
                merchantId: merchant.id,
                platform: deal.platform,
                extra: { page: 'deal_detail', title: deal.title }
            })
        }
    }, [deal?.id, merchant?.id])

    const handleFavoriteClick = () => {
        if (!user) {
            setShowAuthModal(true)
            return
        }
        if (deal && merchant) {
            // 触发心跳动画
            setHeartAnimating(true)
            setTimeout(() => setHeartAnimating(false), 600)
            toggleFavorite(merchant.id, deal.id)
        }
    }

    // 如果仍在加载，展示骨架屏/Loading
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">加载优惠详情中...</p>
            </div>
        )
    }

    if (!deal || !merchant) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">sentiment_dissatisfied</span>
                <p className="text-slate-600 font-bold text-lg mb-4">糟糕，优惠不见了</p>
                <button onClick={() => navigate(-1)} className="px-6 py-2 bg-slate-900 text-white rounded-full">返回上一页</button>
            </div>
        )
    }

    // 动态计算 "凑单省更多" 逻辑
    const threshold = deal.thresholdAmount || 150
    const differenceToNextTier = spendAmount < threshold ? threshold - spendAmount : 0
    const rawCurrentSave = deal.discountType === 'FULL_REDUCE' ? (spendAmount >= threshold ? deal.discountValue : 0)
        : (deal.originalPrice && deal.price ? (deal.originalPrice - deal.price) : deal.discountValue)
    const currentSave = Number(rawCurrentSave.toFixed(2))

    const handleCtaClick = () => {
        trackEvent({
            event: 'deal_cta_click',
            dealId: deal.id,
            merchantId: merchant.id,
            platform: deal.platform,
            extra: { spend_amount: spendAmount }
        })
        setShowActionSheet(true)
    }

    const handleNavigateOut = (platform: string) => {
        trackEvent({
            event: 'deal_navigate_out',
            dealId: deal.id,
            merchantId: merchant.id,
            platform,
            extra: { target_url: deal.affiliateUrl }
        })
        info(`即将跳往 ${platform}，当前版本仅作展示。`)
        setShowActionSheet(false)
    }

    const handleShare = () => {
        share({
            title: `${deal.title} — 长沙省钱攻略`,
            desc: `${merchant.name} | ${deal.platform} | 省¥${currentSave}`,
        })
    }

    return (
        <>
            <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100 selection:bg-primary/20">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex justify-between items-center h-14 px-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                        </button>
                        <h1 className="font-bold text-base truncate max-w-[200px]">{merchant.name}</h1>
                        <div className="flex items-center gap-1 -mr-2">
                            <button
                                onClick={handleFavoriteClick}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                            >
                                <span
                                    className={`material-symbols-outlined text-[24px] transition-all group-active:scale-125 ${isFavorited(merchant.id)
                                        ? 'text-red-500'
                                        : 'text-slate-400'
                                        } ${heartAnimating ? 'heart-beat' : ''}`}
                                    style={isFavorited(merchant.id) ? { fontVariationSettings: "'FILL' 1" } : {}}
                                >
                                    favorite
                                </span>
                            </button>
                            <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <span className="material-symbols-outlined text-[24px]">share</span>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="px-4 pt-4 space-y-4">
                    {/* 限时抢购倒计时条 */}
                    <CountdownBadge validFrom={deal.validFrom} validTo={deal.validTo} />
                    {/* 商家信息头部卡片 */}
                    <section className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10"></div>
                        <div className="flex gap-4 items-start">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 shrink-0 overflow-hidden shadow-inner">
                                <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&h=150&fit=crop" alt="logo" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight">{merchant.name}</h2>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="flex items-center text-orange-500 font-bold text-sm bg-orange-50 px-1.5 py-0.5 rounded">
                                        <span className="material-symbols-outlined text-[14px] mr-0.5">star</span>
                                        {merchant.rating?.toFixed(1) || '4.5'}
                                    </span>
                                    <span className="text-xs text-slate-500">{merchant.category} · 人均 ¥{merchant.avgSpend || 50}</span>
                                </div>
                                <div className="flex items-start gap-1 text-slate-500">
                                    <span className="material-symbols-outlined text-[14px] mt-0.5 shrink-0">location_on</span>
                                    <span className="text-xs leading-relaxed line-clamp-2">{merchant.address}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 核心优惠亮点区 */}
                    <section className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-slate-800 rounded-3xl p-5 border border-orange-100 dark:border-orange-900/30">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="inline-block px-2 py-1 bg-gradient-to-r from-[#FF4500] to-[#FF8C00] text-white text-[10px] font-black rounded-lg rounded-bl-none shadow-sm shadow-orange-200 mb-2 tracking-wider">
                                    {deal.platform} 特供
                                </span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-orange-50">{deal.title}</h3>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-500 line-through mb-1">¥{deal.originalPrice || 200}</div>
                                <div className="flex items-baseline justify-end gap-0.5 text-[#FF4500] drop-shadow-sm">
                                    <span className="text-sm font-bold">¥</span>
                                    <span className="text-3xl font-black tracking-tighter">{deal.price || Number((deal.originalPrice ? deal.originalPrice - currentSave : 50).toFixed(2))}</span>
                                </div>
                            </div>
                        </div>

                        {/* 算账计算器交互区域 */}
                        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-4 mt-4 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">预计消费金额</span>
                                <div className="relative w-32">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                                    <input
                                        type="number"
                                        value={spendAmount}
                                        onChange={(e) => setSpendAmount(Number(e.target.value))}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 pl-7 pr-3 text-right font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-[#FF4500]/50 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="h-px w-full bg-slate-200 border-dashed border-b dark:border-slate-700 my-3"></div>

                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">用券后预计实付</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">¥</span>
                                    <span className="text-xl font-black text-slate-900 dark:text-white">{(Math.max(0, spendAmount - currentSave)).toFixed(1)}</span>
                                </div>
                            </div>

                            {differenceToNextTier > 0 && deal.discountType === 'FULL_REDUCE' && (
                                <div className="mt-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs px-3 py-2 rounded-lg font-medium flex items-center justify-between">
                                    <span>再凑 ¥{differenceToNextTier} 可减 ¥{deal.discountValue}</span>
                                    <span className="font-bold underline decoration-red-300 underline-offset-2 cursor-pointer">去凑单 &gt;</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 渠道比价列表 */}
                    <section className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[20px]">compare_arrows</span>
                            全网渠道比价
                        </h3>
                        <div className="space-y-4">
                            {[
                                { name: '美团', price: Math.max(0, spendAmount * 0.9).toFixed(1), tag: '团购 9 折', icon: 'local_mall' },
                                { name: '招商银行', price: Math.max(0, spendAmount - (spendAmount >= 100 ? 30 : 0)).toFixed(1), tag: '满 100 减 30', icon: 'account_balance' }
                            ].map((ch, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm ${idx === 0 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                                            <span className="material-symbols-outlined text-[16px]">{ch.icon}</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">{ch.name}</div>
                                            <div className="text-[10px] text-slate-500 font-medium">{ch.tag}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-slate-900 dark:text-white">¥{ch.price}</div>
                                        <button className="text-[10px] font-bold text-primary mt-0.5">去看看 &gt;</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 优惠规则说明 */}
                    <section className="px-2 pb-8">
                        <h4 className="text-xs font-bold text-slate-400 mb-2">使用须知</h4>
                        <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc pl-4 marker:text-slate-300">
                            <li>此优惠需前往对应平台（{deal.platform}）小程序或 App 内领取并核销。</li>
                            {deal.stackable ? <li>本优惠可与其他活动叠加使用。</li> : <li>本优惠不可与其他平台代金券、套餐叠加。</li>}
                            <li>最终价格以商家实体店收银系统扫码核销为准。</li>
                        </ul>
                    </section>
                </main>

                {/* Bottom fixed CTA button */}
                <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-40">
                    <button
                        onClick={handleCtaClick}
                        className="w-full h-14 bg-[linear-gradient(135deg,#FF4500_0%,#FF8C00_100%)] text-white rounded-2xl font-black text-lg shadow-lg shadow-orange-200/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                        <span className="relative z-10 font-bold">👉 立即省 ¥{currentSave} 去购买</span>
                        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform relative z-10">arrow_forward</span>
                    </button>
                </div>

                {/* Simulated ActionSheet/Dialog Intercept */}
                {showActionSheet && (
                    <>
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in" onClick={() => setShowActionSheet(false)}></div>
                        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl z-50 p-6 animate-in slide-in-from-bottom-full duration-300 ease-out shadow-2xl">
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">即将离开长湘优惠</h3>
                            <p className="text-sm text-slate-500 text-center mb-8">我们将引导您前往 <span className="font-bold text-slate-900 dark:text-white">{deal.platform}</span> 完成最终购买和核销</p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handleNavigateOut(deal.platform)}
                                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold active:scale-[0.98] transition-transform"
                                >
                                    确认前往
                                </button>
                                <button
                                    onClick={() => setShowActionSheet(false)}
                                    className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold active:scale-[0.98] transition-transform"
                                >
                                    稍后再说
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* 登录弹窗 */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={() => {
                    // 登录成功后自动触发收藏
                    if (deal && merchant) toggleFavorite(merchant.id, deal.id)
                }}
            />
        </>
    )
}
