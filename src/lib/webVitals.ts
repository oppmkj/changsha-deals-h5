/**
 * @module webVitals.ts
 * @description Web Vitals 性能指标采集上报
 * @features
 *   - 采集 LCP / FID / CLS / FCP / TTFB
 *   - 开发环境输出到控制台
 *   - 生产环境可对接上报接口
 * @dependencies web-vitals
 * @last_updated 2026-02-28 - 初始创建
 */
import type { Metric } from 'web-vitals'

type MetricHandler = (name: string, value: number, rating: string) => void

/** 默认处理器：控制台输出 */
const defaultHandler: MetricHandler = (name, value, rating) => {
    const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌'
    console.info(`[Web Vitals] ${emoji} ${name}: ${value.toFixed(1)}ms (${rating})`)
}

const toHandler = (handler: MetricHandler) => (m: Metric) =>
    handler(m.name, m.value, m.rating)

/** 异步动态加载 web-vitals 并采集指标 */
export async function initWebVitals(handler: MetricHandler = defaultHandler) {
    try {
        const { onCLS, onINP, onFCP, onLCP, onTTFB } = await import('web-vitals')
        const h = toHandler(handler)
        onCLS(h)
        onINP(h)
        onFCP(h)
        onLCP(h)
        onTTFB(h)
    } catch (err) {
        console.warn('[Web Vitals] 加载失败，跳过指标采集', err)
    }
}
