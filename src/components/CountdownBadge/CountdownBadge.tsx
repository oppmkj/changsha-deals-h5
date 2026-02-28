/**
 * @module CountdownBadge.tsx
 * @description 限时抢购倒计时徽章组件
 * @features
 *   - 即将开抢：紫色"距开抢 HH:MM:SS"
 *   - 抢购中：红色闪烁"🔥 剩余 HH:MM:SS"
 *   - 已结束：灰色"已结束"
 *   - 支持紧凑模式（用于 DealCard）和展开模式（用于 DealDetail）
 * @dependencies react, useCountdown
 * @last_updated 2026-02-28 - 初始创建
 */
import { useCountdown } from '../../hooks/useCountdown'

interface CountdownBadgeProps {
    validFrom: string | null
    validTo: string | null
    /** 紧凑模式（DealCard 用） */
    compact?: boolean
}

/** 状态对应的样式配置 */
const STATUS_STYLES = {
    upcoming: {
        bg: 'bg-violet-500/10 dark:bg-violet-500/20',
        text: 'text-violet-600 dark:text-violet-400',
        icon: 'schedule',
        pulse: false,
    },
    active: {
        bg: 'bg-red-500/10 dark:bg-red-500/20',
        text: 'text-red-600 dark:text-red-400',
        icon: 'local_fire_department',
        pulse: true,
    },
    ended: {
        bg: 'bg-slate-200/60 dark:bg-slate-700/40',
        text: 'text-slate-400 dark:text-slate-500',
        icon: 'event_busy',
        pulse: false,
    },
}

export default function CountdownBadge({ validFrom, validTo, compact = false }: CountdownBadgeProps) {
    const countdown = useCountdown(validFrom, validTo)

    // 没有时间信息就不渲染
    if (!countdown) return null

    const style = STATUS_STYLES[countdown.status]

    // 紧凑模式（DealCard 右上角标签）
    if (compact) {
        if (countdown.status === 'ended') return null
        return (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${style.bg} ${style.text} ${style.pulse ? 'animate-pulse' : ''}`}>
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {style.icon}
                </span>
                {countdown.status === 'upcoming' ? '即将开抢' : countdown.formatted}
            </div>
        )
    }

    // 展开模式（DealDetail 倒计时条）
    return (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl ${style.bg} ${style.pulse ? 'animate-pulse' : ''}`}>
            <div className="flex items-center gap-2">
                <span
                    className={`material-symbols-outlined text-[22px] ${style.text}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                >
                    {style.icon}
                </span>
                <span className={`text-sm font-bold ${style.text}`}>
                    {countdown.label}
                </span>
            </div>

            {countdown.status !== 'ended' ? (
                <div className="flex items-center gap-1">
                    {[countdown.hours, countdown.minutes, countdown.seconds].map((val, i) => (
                        <div key={i} className="flex items-center gap-1">
                            {i > 0 && <span className={`text-lg font-black ${style.text}`}>:</span>}
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-black tabular-nums ${countdown.status === 'active'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-violet-500 text-white'
                                }`}>
                                {val.toString().padStart(2, '0')}
                            </span>
                        </div>
                    ))}
                    {countdown.days > 0 && (
                        <span className={`ml-1 text-xs font-bold ${style.text}`}>
                            +{countdown.days}天
                        </span>
                    )}
                </div>
            ) : (
                <span className={`text-sm font-bold ${style.text}`}>已结束</span>
            )}
        </div>
    )
}
