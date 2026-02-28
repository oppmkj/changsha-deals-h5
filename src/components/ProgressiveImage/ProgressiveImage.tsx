/**
 * @module ProgressiveImage.tsx
 * @description 渐进式图片加载组件
 * @features
 *   - 加载前显示灰色占位底色
 *   - 图片加载完成后 fade-in 过渡
 *   - 支持 lazy loading
 *   - 加载失败显示 fallback 图标
 * @dependencies react
 * @last_updated 2026-02-28 - 初始创建
 */
import { useState, useCallback } from 'react'

interface ProgressiveImageProps {
    src: string
    alt: string
    className?: string
    /** 占位区的额外样式 */
    placeholderClassName?: string
}

export default function ProgressiveImage({
    src,
    alt,
    className = '',
    placeholderClassName = '',
}: ProgressiveImageProps) {
    const [loaded, setLoaded] = useState(false)
    const [error, setError] = useState(false)

    const handleLoad = useCallback(() => setLoaded(true), [])
    const handleError = useCallback(() => setError(true), [])

    return (
        <div className={`relative overflow-hidden ${placeholderClassName}`}>
            {/* 占位底色 */}
            {!loaded && !error && (
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse" />
            )}

            {/* 加载失败 fallback */}
            {error && (
                <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">
                        broken_image
                    </span>
                </div>
            )}

            {/* 实际图片 */}
            {!error && (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    onLoad={handleLoad}
                    onError={handleError}
                    className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                />
            )}
        </div>
    )
}
