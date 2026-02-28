/**
 * @module Calendar.tsx
 * @description 优惠日历页 — 按周视图展示每天可用的限时优惠
 * @features
 *   - 横滑周日历选择日期
 *   - 按选中日期过滤有效优惠列表
 *   - 显示当日优惠数量气泡
 *   - 点击优惠跳转详情页
 * @dependencies react, react-router-dom, useDeals
 * @last_updated 2026-02-27 - 完整重写占位页
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeals } from '../../hooks/useDeals'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { Deal } from '../../models/deal'

/** 星期中文名 */
const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']

/** 获取当前周的 7 天日期 */
function getWeekDays(baseDate: Date): Date[] {
    const day = baseDate.getDay()
    const monday = new Date(baseDate)
    monday.setDate(baseDate.getDate() - ((day + 6) % 7)) // 从周一开始
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        days.push(d)
    }
    return days
}

/** 判断一个 deal 在某一天是否有效 */
function isDealValidOnDate(deal: Deal, date: Date): boolean {
    if (!deal.isActive) return false
    const dateStr = formatDateStr(date)

    // 检查日期范围
    if (deal.validFrom && dateStr < deal.validFrom) return false
    if (deal.validTo && dateStr > deal.validTo) return false

    // 检查周期性规则
    if (deal.recurrenceType === 'WEEKLY' && deal.recurrenceRule) {
        const dayOfWeek = date.getDay()
        const allowedDays = deal.recurrenceRule.split(',').map(Number)
        if (!allowedDays.includes(dayOfWeek)) return false
    }

    return true
}

/** 格式化日期为 YYYY-MM-DD */
function formatDateStr(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

/** 判断两个日期是否同一天 */
function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate()
}

export default function Calendar() {
    const navigate = useNavigate()
    const { deals, merchants, isLoading } = useDeals()
    usePageTitle('优惠日历')

    const today = new Date()
    const [selectedDate, setSelectedDate] = useState(today)
    const [weekOffset, setWeekOffset] = useState(0)

    // 当前展示的周
    const currentWeekBase = useMemo(() => {
        const d = new Date(today)
        d.setDate(d.getDate() + weekOffset * 7)
        return d
    }, [weekOffset])

    const weekDays = useMemo(() => getWeekDays(currentWeekBase), [currentWeekBase])

    // 每天的优惠数量（用于气泡标记）
    const dailyCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        for (const day of weekDays) {
            const key = formatDateStr(day)
            counts[key] = deals.filter(d => isDealValidOnDate(d, day)).length
        }
        return counts
    }, [weekDays, deals])

    // 选中日期的有效优惠
    const dayDeals = useMemo(() => {
        return deals.filter(d => isDealValidOnDate(d, selectedDate))
    }, [deals, selectedDate])

    // 月份文案
    const monthLabel = `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月`

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-display pb-24">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pt-6 pb-2 px-5">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-black text-slate-900 dark:text-white">优惠日历</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setWeekOffset(w => w - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 min-w-[90px] text-center">{monthLabel}</span>
                        <button
                            onClick={() => setWeekOffset(w => w + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>
                </div>

                {/* 周日历 */}
                <div className="flex justify-between gap-1">
                    {weekDays.map(day => {
                        const key = formatDateStr(day)
                        const isSelected = isSameDay(day, selectedDate)
                        const isToday = isSameDay(day, today)
                        const count = dailyCounts[key] || 0

                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedDate(day)}
                                className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all active:scale-95 ${isSelected
                                    ? 'bg-gradient-to-b from-[#FF4500] to-[#FF8C00] text-white shadow-lg shadow-orange-500/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <span className={`text-[10px] font-bold mb-1 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                                    {WEEKDAY_NAMES[day.getDay()]}
                                </span>
                                <span className={`text-base font-black leading-none ${isToday && !isSelected ? 'text-[#FF4500]' : ''}`}>
                                    {day.getDate()}
                                </span>
                                {count > 0 && (
                                    <span className={`mt-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold ${isSelected
                                        ? 'bg-white/30 text-white'
                                        : 'bg-orange-100 dark:bg-orange-500/20 text-[#FF4500]'
                                        }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </header>

            {/* 当日优惠列表 */}
            <main className="px-5 pt-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {isSameDay(selectedDate, today) ? '今日优惠' : `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日优惠`}
                    </h2>
                    <span className="text-xs font-semibold text-slate-400">{dayDeals.length} 个</span>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl h-24 animate-pulse" />
                        ))}
                    </div>
                ) : dayDeals.length === 0 ? (
                    <div className="text-center py-16">
                        <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-slate-600 mb-3 block">event_busy</span>
                        <p className="text-sm text-slate-500 font-medium">这天暂无可用优惠</p>
                        <p className="text-xs text-slate-400 mt-1">换一天看看？</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {dayDeals.map(deal => {
                            const merchant = merchants.find(m => m.id === deal.merchantId)
                            const saving = deal.originalPrice && deal.price
                                ? deal.originalPrice - deal.price
                                : deal.discountValue || 0

                            return (
                                <div
                                    key={deal.id}
                                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-3 cursor-pointer active:bg-slate-50 dark:active:bg-slate-700 transition-colors shadow-sm"
                                    onClick={() => navigate(`/deal/${deal.id}`)}
                                >
                                    {/* 图标 */}
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-[24px] text-[#FF4500]">
                                            {deal.discountType === 'GROUP_BUY' ? 'restaurant' : 'confirmation_number'}
                                        </span>
                                    </div>

                                    {/* 信息 */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{deal.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-400">{merchant?.name || deal.platform}</span>
                                            {deal.recurrenceType !== 'NONE' && (
                                                <>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                                                        {deal.recurrenceType === 'WEEKLY' ? '每周' : '每月'}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* 价格 */}
                                    <div className="text-right shrink-0">
                                        <span className="text-lg font-black text-[#FF4500]">
                                            {saving > 0 ? `省¥${Math.round(saving)}` : `¥${deal.price || deal.discountValue}`}
                                        </span>
                                        {deal.originalPrice && deal.price && (
                                            <p className="text-[11px] text-slate-400 line-through">¥{deal.originalPrice}</p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
