/**
 * @module DealCardSkeleton.tsx
 * @description 优惠卡片的骨架屏结构体
 * @features
 *   - 提供加载时的布局骨架
 *   - 提供视觉反馈的循环闪光动画
 * @dependencies 无
 * @last_updated 2026-02-27 - 补充标准头部说明注释以符合工程规范
 */
export default function DealCardSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-[16px] overflow-hidden border border-slate-100 dark:border-slate-800 animate-pulse">
            {/* 图片占位 */}
            <div className="h-56 bg-slate-200 dark:bg-slate-800" />

            <div className="p-5 space-y-3">
                {/* 标题 + 价格 */}
                <div className="flex justify-between items-start">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/5" />
                    <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded-lg w-16" />
                </div>

                {/* 商家信息行 */}
                <div className="flex items-center gap-3">
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-24" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-12" />
                </div>

                {/* 底栏 */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-20" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                </div>
            </div>
        </div>
    )
}
