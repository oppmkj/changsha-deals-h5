/**
 * @module DealCardSkeleton.tsx
 * @description 优惠卡片骨架屏，与 DealCard 布局一致
 * @features
 *   - 图片区域 + 标签占位
 *   - 标题/价格/商家名行占位
 *   - 底部操作行占位
 * @dependencies Skeleton 基础组件
 * @last_updated 2026-02-28 - 初始创建
 */
import { SkeletonBlock, SkeletonLine } from './Skeleton'

export default function DealCardSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-[16px] overflow-hidden shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] dark:shadow-none border border-slate-100 dark:border-slate-800">
            {/* 图片区域 */}
            <SkeletonBlock height="224px" rounded="rounded-none" />

            {/* 内容区域 */}
            <div className="p-5 space-y-3">
                {/* 标题 + 价格 */}
                <div className="flex justify-between items-start">
                    <SkeletonLine width="60%" />
                    <SkeletonBlock width="64px" height="28px" rounded="rounded-lg" />
                </div>

                {/* 商家名 + 原价 */}
                <div className="flex justify-between items-center">
                    <SkeletonLine width="40%" />
                    <SkeletonLine width="48px" />
                </div>

                {/* 底部分隔线 + 操作行 */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <SkeletonLine width="72px" />
                    <SkeletonBlock width="80px" height="24px" rounded="rounded-lg" />
                </div>
            </div>
        </div>
    )
}
