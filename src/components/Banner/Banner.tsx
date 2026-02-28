/**
 * @module Banner.tsx
 * @description 首页运营横幅轮播组件
 * @features
 *   - CSS Snap 平滑横向滚动
 *   - 自动轮播（支持触摸暂停）
 *   - 底部指示器同步
 * @dependencies react
 * @last_updated 2026-02-28 - 初始创建
 */
import { useEffect, useRef, useState } from 'react'

export interface BannerItem {
    id: string
    title: string
    subtitle: string
    bgGradient: string
    actionText?: string
    url?: string
}

// 默认占位数据
const DEFAULT_BANNERS: BannerItem[] = [
    {
        id: '1',
        title: '周末狂欢低至5折',
        subtitle: '精选餐饮特惠，五一广场商圈',
        bgGradient: 'bg-gradient-to-r from-orange-500 to-red-500',
        actionText: '立即抢购',
    },
    {
        id: '2',
        title: '新店开业专享',
        subtitle: '茶颜悦色新品买一送一',
        bgGradient: 'bg-gradient-to-r from-teal-400 to-emerald-600',
        actionText: '查看详情',
    },
    {
        id: '3',
        title: '信用卡羊毛大全',
        subtitle: '招行/交行周三五折全攻略',
        bgGradient: 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
        actionText: '去使用',
    },
]

interface BannerProps {
    items?: BannerItem[]
    autoPlayInterval?: number
}

export default function Banner({ items = DEFAULT_BANNERS, autoPlayInterval = 3000 }: BannerProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)

    // 监听滚动事件，更新 activeIndex
    const handleScroll = () => {
        if (!scrollRef.current) return
        const scrollLeft = scrollRef.current.scrollLeft
        const width = scrollRef.current.offsetWidth
        const index = Math.round(scrollLeft / width)
        if (index !== activeIndex) {
            setActiveIndex(index)
        }
    }

    // 自动轮播逻辑
    useEffect(() => {
        if (isHovered || items.length <= 1) return

        const timer = setInterval(() => {
            if (!scrollRef.current) return
            const width = scrollRef.current.offsetWidth
            const nextIndex = (activeIndex + 1) % items.length
            scrollRef.current.scrollTo({
                left: nextIndex * width,
                behavior: 'smooth'
            })
            // 注意：实际 setActiveIndex 会在 scroll 事件中触发，但如果不可见可能不触发，所以用定时器驱动滚动
        }, autoPlayInterval)

        return () => clearInterval(timer)
    }, [activeIndex, items.length, autoPlayInterval, isHovered])

    if (!items.length) return null

    return (
        <div
            className="relative w-full overflow-hidden my-4 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setIsHovered(false)}
        >
            {/* 滚动容器 */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex gap-3 px-5 overflow-x-auto snap-x snap-mandatory hide-scrollbar sm:px-6"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`relative shrink-0 w-full sm:w-[calc(100%-2rem)] md:w-full h-36 ${item.bgGradient} rounded-3xl snap-center shadow-lg shadow-black/5 flex items-center p-6 text-white overflow-hidden active:scale-[0.98] transition-transform cursor-pointer`}
                        onClick={() => {
                            if (item.url) window.location.href = item.url
                        }}
                    >
                        {/* 装饰性背景 */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
                        <div className="absolute bottom-0 left-10 w-24 h-24 bg-black/10 rounded-full blur-xl translate-y-1/2"></div>

                        <div className="relative z-10 flex flex-col items-start w-full">
                            <h3 className="text-xl font-bold mb-1 tracking-wide">{item.title}</h3>
                            <p className="text-white/80 text-xs sm:text-sm font-medium mb-3">{item.subtitle}</p>
                            {item.actionText && (
                                <button className="px-3 py-1 bg-white text-slate-800 rounded-full text-xs font-bold leading-none self-start shadow-sm mix-blend-screen hover:scale-105 active:scale-95 transition-transform">
                                    {item.actionText}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* 指示点 */}
            <div className="flex justify-center gap-1.5 mt-3">
                {items.map((_, idx) => (
                    <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex ? 'w-4 bg-slate-800 dark:bg-slate-200' : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                            }`}
                        onClick={() => {
                            if (!scrollRef.current) return
                            const width = scrollRef.current.offsetWidth
                            scrollRef.current.scrollTo({ left: idx * width, behavior: 'smooth' })
                        }}
                    />
                ))}
            </div>
        </div>
    )
}
