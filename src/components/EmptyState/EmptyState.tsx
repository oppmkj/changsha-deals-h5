/**
 * @module EmptyState.tsx
 * @description 通用空状态组件
 * @features
 *   - 支持自定义图标、标题、描述和操作按钮
 *   - 预设多种场景：无搜索结果 / 无数据 / 无收藏
 *   - 暗黑模式适配
 * @dependencies 无外部依赖
 * @last_updated 2026-02-28 - 初始创建
 */

interface EmptyStateProps {
    /** Material Symbols 图标名 */
    icon?: string
    /** 主标题 */
    title?: string
    /** 描述文案 */
    description?: string
    /** 操作按钮文案 */
    actionLabel?: string
    /** 操作按钮回调 */
    onAction?: () => void
}

/** 预设场景 */
export const EMPTY_PRESETS = {
    noData: {
        icon: 'sentiment_calm',
        title: '暂无数据',
        description: '稍后再来看看吧，好价随时更新',
    },
    noSearch: {
        icon: 'search_off',
        title: '没找到相关优惠',
        description: '换个关键词试试，或浏览推荐内容',
    },
    noFavorites: {
        icon: 'favorite_border',
        title: '还没有收藏',
        description: '浏览优惠时点击 ❤️ 即可收藏',
    },
    noCalendar: {
        icon: 'event_busy',
        title: '今日暂无优惠',
        description: '换个日期看看，总有惊喜等着你',
    },
    networkError: {
        icon: 'wifi_off',
        title: '网络开小差了',
        description: '请检查网络连接后重试',
    },
} as const

export default function EmptyState({
    icon = 'sentiment_calm',
    title = '暂无数据',
    description = '稍后再来看看吧',
    actionLabel,
    onAction,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
                <span
                    className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600"
                    style={{ fontVariationSettings: "'FILL' 0" }}
                >
                    {icon}
                </span>
            </div>

            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-2">
                {title}
            </h3>
            <p className="text-sm text-slate-400 max-w-[240px] mb-6">
                {description}
            </p>

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm active:scale-95 transition-transform"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    )
}
