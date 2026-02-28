/**
 * @module useCountdown.ts
 * @description 通用倒计时 Hook，每秒刷新剩余时间
 * @features
 *   - 支持目标时间戳倒计时
 *   - 返回天/时/分/秒和格式化字符串
 *   - 到期自动停止
 *   - 判断状态：未开始 / 进行中 / 已结束
 * @dependencies react
 * @last_updated 2026-02-28 - 初始创建
 */
import { useState, useEffect, useMemo } from 'react'

/** 倒计时状态 */
export type CountdownStatus = 'upcoming' | 'active' | 'ended'

interface CountdownResult {
    /** 剩余总秒数 */
    remaining: number
    /** 天 */
    days: number
    /** 时 */
    hours: number
    /** 分 */
    minutes: number
    /** 秒 */
    seconds: number
    /** 格式化字符串 HH:MM:SS */
    formatted: string
    /** 当前状态 */
    status: CountdownStatus
    /** 状态文案 */
    label: string
}

/**
 * 通用倒计时 Hook
 * @param validFrom - 开始时间 ISO 字符串
 * @param validTo - 结束时间 ISO 字符串
 */
export function useCountdown(validFrom: string | null, validTo: string | null): CountdownResult | null {
    const [now, setNow] = useState(() => Date.now())

    // 解析目标时间
    const fromTs = useMemo(() => validFrom ? new Date(validFrom).getTime() : null, [validFrom])
    const toTs = useMemo(() => validTo ? new Date(validTo).getTime() : null, [validTo])

    // 判断是否需要启用倒计时
    const shouldTick = useMemo(() => {
        if (!fromTs && !toTs) return false
        // 如果已经完全过期，不刷新
        if (toTs && now > toTs) return false
        return true
    }, [fromTs, toTs, now])

    useEffect(() => {
        if (!shouldTick) return
        const timer = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [shouldTick])

    // 如果没有时间信息，返回 null
    if (!fromTs && !toTs) return null

    // 计算状态
    let status: CountdownStatus = 'active'
    let targetTs = toTs || 0
    let label = '抢购中'

    if (fromTs && now < fromTs) {
        status = 'upcoming'
        targetTs = fromTs
        label = '距开抢'
    } else if (toTs && now > toTs) {
        status = 'ended'
        return { remaining: 0, days: 0, hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00', status, label: '已结束' }
    } else if (toTs) {
        status = 'active'
        targetTs = toTs
        label = '剩余'
    }

    const remaining = Math.max(0, Math.floor((targetTs - now) / 1000))
    const days = Math.floor(remaining / 86400)
    const hours = Math.floor((remaining % 86400) / 3600)
    const minutes = Math.floor((remaining % 3600) / 60)
    const seconds = remaining % 60

    const pad = (n: number) => n.toString().padStart(2, '0')
    const formatted = days > 0
        ? `${days}天 ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`

    return { remaining, days, hours, minutes, seconds, formatted, status, label }
}
