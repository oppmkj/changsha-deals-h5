/**
 * @module Skeleton.tsx
 * @description 通用骨架屏基础组件
 * @features
 *   - SkeletonBlock：矩形占位块（支持圆角、自定义尺寸）
 *   - SkeletonLine：文字行占位
 *   - SkeletonCircle：头像/圆形占位
 *   - 统一脉冲动画
 * @dependencies 无外部依赖
 * @last_updated 2026-02-28 - 初始创建
 */

interface SkeletonBlockProps {
    width?: string
    height?: string
    rounded?: string
    className?: string
}

/** 矩形骨架占位块 */
export function SkeletonBlock({
    width = '100%',
    height = '16px',
    rounded = 'rounded-lg',
    className = '',
}: SkeletonBlockProps) {
    return (
        <div
            className={`bg-slate-200 dark:bg-slate-700 animate-pulse ${rounded} ${className}`}
            style={{ width, height }}
        />
    )
}

interface SkeletonLineProps {
    width?: string
    className?: string
}

/** 文字行骨架占位 */
export function SkeletonLine({ width = '100%', className = '' }: SkeletonLineProps) {
    return (
        <div
            className={`h-3 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-full ${className}`}
            style={{ width }}
        />
    )
}

interface SkeletonCircleProps {
    size?: string
    className?: string
}

/** 圆形骨架占位 */
export function SkeletonCircle({ size = '40px', className = '' }: SkeletonCircleProps) {
    return (
        <div
            className={`bg-slate-200 dark:bg-slate-700 animate-pulse rounded-full ${className}`}
            style={{ width: size, height: size }}
        />
    )
}
