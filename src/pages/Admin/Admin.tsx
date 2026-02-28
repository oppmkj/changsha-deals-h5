/**
 * @module Admin.tsx
 * @description 极简管理员综合运营后台面板
 * @features
 *   - 表单录入并推送优惠
 *   - 查看并控制商品上下架状态
 *   - 展示核心埋点分类数据分布图
 *   - 定义 ClickLogEntry 接口替代 as any 类型断言
 * @dependencies react, react-router-dom, useDeals, useAuth, tracker
 * @last_updated 2026-02-27 - 消除 as any 类型断言，增强类型安全
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeals } from '../../hooks/useDeals'
import { useAuth } from '../../hooks/useAuth'
import { getLocalLogs } from '../../lib/tracker'
import { useToast } from '../../components/Toast'
import { supabase } from '../../lib/supabase'
import { parseDealImage } from '../../lib/dealOcr'
import type { Deal } from '../../models/deal'

type AdminTab = 'deals' | 'merchants' | 'analytics'

/** 本地埋点日志条目类型定义（替代 as any） */
interface ClickLogEntry {
    event?: string
    platform?: string
    timestamp?: string
    dealId?: string
    merchantId?: string
    userId?: string | null
    extra?: Record<string, unknown>
}

interface DealFormData {
    title: string
    platform: string
    scene: string
    discountType: string
    discountValue: number
    thresholdAmount: number
    price: number
    originalPrice: number
    merchantId: string
    isActive: boolean
}

const EMPTY_FORM: DealFormData = {
    title: '',
    platform: '美团',
    scene: 'dine_in',
    discountType: 'GROUP_BUY',
    discountValue: 0,
    thresholdAmount: 0,
    price: 0,
    originalPrice: 0,
    merchantId: '',
    isActive: true,
}

export default function Admin() {
    const navigate = useNavigate()
    const { deals, merchants, refresh } = useDeals()
    const { warning, success } = useToast()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<AdminTab>('deals')
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState<DealFormData>(EMPTY_FORM)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isRecognizing, setIsRecognizing] = useState(false)
    const [uploadPreview, setUploadPreview] = useState<string | null>(null)

    /** AI 截图识别处理 */
    const handleImageUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            warning('请上传图片文件')
            return
        }
        // 预览
        const previewUrl = URL.createObjectURL(file)
        setUploadPreview(previewUrl)
        setIsRecognizing(true)

        try {
            const parsed = await parseDealImage(file)

            // 尝试自动匹配商家
            const matchedMerchant = merchants.find(m =>
                parsed.merchantName && m.name.includes(parsed.merchantName)
            )

            setFormData(prev => ({
                ...prev,
                title: parsed.title || prev.title,
                platform: parsed.platform || prev.platform,
                discountType: parsed.discountType || prev.discountType,
                discountValue: parsed.discountValue || prev.discountValue,
                thresholdAmount: parsed.thresholdAmount || prev.thresholdAmount,
                price: parsed.price || prev.price,
                originalPrice: parsed.originalPrice || prev.originalPrice,
                merchantId: matchedMerchant?.id || prev.merchantId,
            }))

            const confPct = Math.round((parsed.confidence || 0) * 100)
            success(`识别完成（置信度 ${confPct}%），请核对后提交`)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '识别失败'
            warning(msg)
        } finally {
            setIsRecognizing(false)
        }
    }

    // 埋点统计数据
    const analytics = useMemo(() => {
        const logs = getLocalLogs() as ClickLogEntry[]
        const eventCounts: Record<string, number> = {}
        const platformCounts: Record<string, number> = {}
        const hourlyData: number[] = new Array(24).fill(0)

        for (const log of logs) {
            const eventType = log.event || 'unknown'
            eventCounts[eventType] = (eventCounts[eventType] || 0) + 1

            if (log.platform) {
                platformCounts[log.platform] = (platformCounts[log.platform] || 0) + 1
            }

            if (log.timestamp) {
                const hour = new Date(log.timestamp).getHours()
                hourlyData[hour]++
            }
        }

        return { total: logs.length, eventCounts, platformCounts, hourlyData }
    }, [activeTab])

    const handleSubmit = async () => {
        if (!formData.title || !formData.merchantId) {
            warning('请填写标题并选择商家')
            return
        }

        setIsSubmitting(true)
        try {
            const newDealData = {
                merchant_id: formData.merchantId,
                title: formData.title,
                platform: formData.platform,
                scene: formData.scene,
                discount_type: formData.discountType,
                discount_value: formData.discountValue,
                threshold_amount: formData.thresholdAmount || null,
                price: formData.price || null,
                original_price: formData.originalPrice || null,
                is_active: formData.isActive
            }

            const { error } = await supabase
                .from('deals')
                .insert([newDealData])

            if (error) throw error

            success('录入成功')
            setFormData(EMPTY_FORM)
            setShowForm(false)
            await refresh() // 刷新列表
        } catch (err: any) {
            console.error('新建优惠失败', err)
            warning(err.message || '录入失败，请检查网络或权限')
        } finally {
            setIsSubmitting(false)
        }
    }

    const toggleDealActive = async (deal: Deal) => {
        try {
            const newStatus = !deal.isActive
            // 乐观更新体验可加，但此处使用刷新保证强一致性
            const { error } = await supabase
                .from('deals')
                .update({ is_active: newStatus })
                .eq('id', deal.id)

            if (error) throw error

            success(newStatus ? '已上架' : '已下架')
            await refresh()
        } catch (err: any) {
            warning('状态修改失败: ' + err.message)
        }
    }

    const tabs: { key: AdminTab; icon: string; label: string }[] = [
        { key: 'deals', icon: 'local_offer', label: '优惠管理' },
        { key: 'merchants', icon: 'storefront', label: '商家列表' },
        { key: 'analytics', icon: 'analytics', label: '数据统计' },
    ]

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-display">
            {/* 顶栏 */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-900 dark:text-white">管理后台</h1>
                        <p className="text-[11px] text-slate-400">{user ? `${user.phone || '管理员'}` : '演示模式'}</p>
                    </div>
                </div>
                {activeTab === 'deals' && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 bg-[#FF4500] text-white text-xs font-bold rounded-xl flex items-center gap-1 active:scale-95 transition-transform shadow-lg shadow-orange-200/50"
                    >
                        <span className="material-symbols-outlined text-[16px]">{showForm ? 'close' : 'add'}</span>
                        {showForm ? '取消' : '新增优惠'}
                    </button>
                )}
            </header>

            {/* Tab 导航 */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex gap-1">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === tab.key
                            ? 'border-[#FF4500] text-[#FF4500]'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <main className="p-4 max-w-3xl mx-auto space-y-4">
                {/* ===== 新增优惠表单 ===== */}
                {showForm && activeTab === 'deals' && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 animate-in fade-in slide-in-from-top-4 duration-300">
                        <h2 className="font-bold text-sm text-slate-900 dark:text-white mb-4">录入新优惠</h2>

                        {/* === 截图上传区域 === */}
                        <div className="mb-4">
                            <label
                                className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isRecognizing
                                        ? 'border-[#FF4500] bg-orange-50/50 dark:bg-orange-900/10'
                                        : 'border-slate-300 dark:border-slate-700 hover:border-[#FF4500]/50 bg-slate-50 dark:bg-slate-800/50'
                                    }`}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleImageUpload(file)
                                    }}
                                />
                                {isRecognizing ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-6 h-6 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs text-[#FF4500] font-bold">AI 正在识别中...</span>
                                    </div>
                                ) : uploadPreview ? (
                                    <div className="flex items-center gap-3">
                                        <img src={uploadPreview} alt="预览" className="h-20 rounded-lg object-cover" />
                                        <div className="text-center">
                                            <span className="material-symbols-outlined text-green-500 text-2xl">check_circle</span>
                                            <p className="text-[11px] text-slate-400 mt-1">识别完成，点击重新上传</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1.5">
                                        <span className="material-symbols-outlined text-3xl text-slate-400">photo_camera</span>
                                        <span className="text-xs font-bold text-slate-500">上传优惠截图，AI 自动识别</span>
                                        <span className="text-[10px] text-slate-400">支持美团、抖音、银行APP等截图</span>
                                    </div>
                                )}
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">优惠标题</label>
                                <input
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#FF4500]/30"
                                    placeholder="例: 双人套餐·招牌菜+饮品"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">关联商家</label>
                                <select
                                    value={formData.merchantId}
                                    onChange={e => setFormData(prev => ({ ...prev, merchantId: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none"
                                >
                                    <option value="">选择商家...</option>
                                    {merchants.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">平台</label>
                                <select
                                    value={formData.platform}
                                    onChange={e => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none"
                                >
                                    {['美团', '抖音', '招商银行', '建设银行', '中国银行', '支付宝', '微信支付'].map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">优惠类型</label>
                                <select
                                    value={formData.discountType}
                                    onChange={e => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none"
                                >
                                    <option value="GROUP_BUY">团购套餐</option>
                                    <option value="FULL_REDUCE">满减</option>
                                    <option value="PERCENTAGE">折扣</option>
                                    <option value="VOUCHER">代金券</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">折扣值</label>
                                <input
                                    type="number"
                                    value={formData.discountValue || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">现价 ¥</label>
                                <input
                                    type="number"
                                    value={formData.price || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none"
                                    placeholder="128"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">原价 ¥</label>
                                <input
                                    type="number"
                                    value={formData.originalPrice || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, originalPrice: Number(e.target.value) }))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none"
                                    placeholder="186"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`mt-4 w-full py-3 rounded-xl font-bold text-sm transition-all ${isSubmitting ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 active:scale-[0.98]'}`}
                        >
                            {isSubmitting ? '提交中...' : '提交并生效'}
                        </button>
                    </div>
                )}

                {/* ===== 优惠管理列表 ===== */}
                {activeTab === 'deals' && (
                    <div className="space-y-2">
                        <div className="text-xs text-slate-400 font-medium px-1">
                            共 {deals.length} 条优惠 · {deals.filter(d => d.isActive).length} 条生效中
                        </div>
                        {deals.map(deal => {
                            const merchant = merchants.find(m => m.id === deal.merchantId)
                            return (
                                <div key={deal.id} className={`bg-white dark:bg-slate-900 rounded-xl border p-4 flex items-center gap-3 transition-all ${deal.isActive ? 'border-slate-200 dark:border-slate-800' : 'border-red-200 dark:border-red-900/30 opacity-60'}`}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${deal.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                                            <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{deal.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                            <span>{merchant?.name || '未知商家'}</span>
                                            <span>•</span>
                                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold">{deal.platform}</span>
                                            <span>•</span>
                                            <span>{deal.price ? `¥${deal.price}` : `减${deal.discountValue}`}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleDealActive(deal)}
                                        className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${deal.isActive
                                            ? 'bg-red-50 text-red-500 dark:bg-red-500/10'
                                            : 'bg-green-50 text-green-600 dark:bg-green-500/10'
                                            }`}
                                    >
                                        {deal.isActive ? '下架' : '上架'}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* ===== 商家列表 ===== */}
                {activeTab === 'merchants' && (
                    <div className="space-y-2">
                        <div className="text-xs text-slate-400 font-medium px-1">共 {merchants.length} 家商户</div>
                        {merchants.map(m => (
                            <div key={m.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[20px] text-[#FF4500]">storefront</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{m.name}</div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                        <span>{m.category}</span>
                                        <span>•</span>
                                        <span>{m.district}</span>
                                        <span>•</span>
                                        <span className="text-orange-500 font-bold">★ {m.rating}</span>
                                        <span>•</span>
                                        <span>人均¥{m.avgSpend}</span>
                                    </div>
                                </div>
                                <div className="shrink-0 text-right">
                                    <div className="text-lg font-black text-slate-900 dark:text-white">{deals.filter(d => d.merchantId === m.id).length}</div>
                                    <div className="text-[10px] text-slate-400">在线优惠</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ===== 数据统计 ===== */}
                {activeTab === 'analytics' && (
                    <div className="space-y-4">
                        {/* 总览卡片 */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
                                <div className="text-2xl font-black text-[#FF4500]">{analytics.total}</div>
                                <div className="text-[11px] text-slate-400 font-medium mt-1">总事件数</div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{analytics.eventCounts['deal_click'] || 0}</div>
                                <div className="text-[11px] text-slate-400 font-medium mt-1">卡片点击</div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{analytics.eventCounts['deal_navigate_out'] || 0}</div>
                                <div className="text-[11px] text-slate-400 font-medium mt-1">外链跳出</div>
                            </div>
                        </div>

                        {/* 事件分布 */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">事件类型分布</h3>
                            {Object.entries(analytics.eventCounts).length === 0 ? (
                                <div className="text-center py-6 text-slate-400 text-sm">
                                    <span className="material-symbols-outlined text-3xl mb-2 block">query_stats</span>
                                    暂无统计数据<br />
                                    <span className="text-xs">浏览页面、点击卡片后数据会自动出现</span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {Object.entries(analytics.eventCounts).sort((a, b) => b[1] - a[1]).map(([key, count]) => {
                                        const max = Math.max(...Object.values(analytics.eventCounts))
                                        const pct = max > 0 ? (count / max * 100) : 0
                                        return (
                                            <div key={key}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-600 dark:text-slate-300 font-medium">{key}</span>
                                                    <span className="text-slate-400 font-bold">{count}</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-[#FF4500] to-[#FF8C00] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 平台分布 */}
                        {Object.keys(analytics.platformCounts).length > 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">平台点击分布</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(analytics.platformCounts).sort((a, b) => b[1] - a[1]).map(([platform, count]) => (
                                        <div key={platform} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex-1">{platform}</span>
                                            <span className="text-xs text-[#FF4500] font-black">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
