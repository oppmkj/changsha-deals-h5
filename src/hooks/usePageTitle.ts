/**
 * @module usePageTitle.ts
 * @description 动态页面标题 Hook，每个页面独立设置 document.title
 * @features
 *   - 挂载时设置页面标题
 *   - 卸载时恢复默认标题
 *   - 支持动态参数（如优惠名称）
 * @dependencies react
 * @last_updated 2026-02-27 - 初始创建
 */
import { useEffect } from 'react'

const DEFAULT_TITLE = '长沙省钱攻略 — 优惠比价决策平台'

/**
 * 设置当前页面的 document.title
 * @param title - 页面标题，会追加默认后缀
 * @param withSuffix - 是否追加应用名后缀，默认 true
 */
export function usePageTitle(title: string, withSuffix = true): void {
    useEffect(() => {
        const fullTitle = withSuffix ? `${title} | 长沙省钱攻略` : title
        document.title = fullTitle

        return () => {
            document.title = DEFAULT_TITLE
        }
    }, [title, withSuffix])
}
