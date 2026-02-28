/**
 * @module DealCard.tsx
 * @description 商家优惠通用卡片渲染组件
 * @features
 *   - 计算并显示原始价及折后差
 *   - 针对不同属性分发色彩标签
 *   - 点击时传递详细商品追踪打点
 *   - 商家名称和平台动态展示
 *   - 根据品类和 deal ID 展示差异化配图
 * @dependencies react-router-dom, tracker
 * @last_updated 2026-02-27 - 图片差异化：基于品类和 ID 哈希选取不同配图
 */
import { useNavigate } from 'react-router-dom'
import type { Deal } from '../../models/deal'
import { trackEvent } from '../../lib/tracker'
import CountdownBadge from '../CountdownBadge'
import ProgressiveImage from '../ProgressiveImage'

interface Props {
    deal: Deal & { merchantName?: string }
}

/**
 * 基于品类的 Unsplash 配图集合
 * 使用可靠的 picsum.photos 占位图服务，每张图通过固定 seed 保证稳定
 */
const CATEGORY_IMAGES: Record<string, string[]> = {
    food: [
        'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
    ],
    tea: [
        'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
    ],
    dessert: [
        'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=400&fit=crop',
    ],
    entertainment: [
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop',
    ],
    default: [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
    ],
}

/** 基于字符串哈希稳定选取图片索引 */
function hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i)
        hash |= 0
    }
    return Math.abs(hash)
}

/** 根据 deal 的品类和 ID 选取差异化图片 */
function getDealImage(deal: Deal): string {
    const scene = deal.scene?.toLowerCase() || ''
    let category = 'default'

    if (scene.includes('food') || scene.includes('餐') || scene.includes('美食')) {
        category = 'food'
    } else if (scene.includes('tea') || scene.includes('茶') || scene.includes('饮')) {
        category = 'tea'
    } else if (scene.includes('dessert') || scene.includes('甜') || scene.includes('烘焙')) {
        category = 'dessert'
    } else if (scene.includes('entertain') || scene.includes('娱乐')) {
        category = 'entertainment'
    }

    // 如果 scene 匹配不上，尝试根据平台简单归类
    if (category === 'default' && deal.platform) {
        const platform = deal.platform.toLowerCase()
        if (platform.includes('美团') || platform.includes('饿了么')) {
            category = 'food'
        }
    }

    const images = CATEGORY_IMAGES[category] || CATEGORY_IMAGES.default
    const index = hashString(deal.id) % images.length
    return images[index]
}

export default function DealCard({ deal }: Props) {
    const navigate = useNavigate()

    const finalPrice = deal.price ?? (deal.originalPrice ? deal.originalPrice - (deal.discountValue || 0) : 0)
    const tags = [deal.platform, deal.discountType === 'GROUP_BUY' ? '套餐' : '代金券']
    const imageUrl = getDealImage(deal)

    // 基于 Deal ID 哈希生成伪随机领取人数
    const claimedCount = 100 + hashString(deal.id) % 900

    const handleClick = () => {
        trackEvent({
            event: 'deal_click',
            dealId: deal.id,
            merchantId: deal.merchantId,
            platform: deal.platform,
            extra: { title: deal.title }
        })
        navigate(`/deal/${deal.id}`)
    }

    return (
        <div
            className="bg-white dark:bg-slate-900 rounded-[16px] overflow-hidden shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] dark:shadow-none border border-slate-100 dark:border-slate-800 cursor-pointer"
            onClick={handleClick}
        >
            <div className="relative h-56">
                <ProgressiveImage
                    className="w-full h-full object-cover"
                    placeholderClassName="h-56"
                    src={imageUrl}
                    alt={deal.merchantName || '商家'}
                />
                <div className="absolute top-4 left-4 flex gap-2">
                    {tags.map((tag, idx) => (
                        <div
                            key={idx}
                            className={`${idx === 0
                                ? 'bg-primary text-white'
                                : 'bg-white/95 text-slate-900'
                                } text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm`}
                        >
                            {tag}
                        </div>
                    ))}
                </div>
                {/* 限时抢购标签 */}
                <div className="absolute top-4 right-4">
                    <CountdownBadge validFrom={deal.validFrom} validTo={deal.validTo} compact />
                </div>
            </div>

            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">
                        {deal.title}
                    </h3>
                    <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-primary tracking-tight">
                            ¥{finalPrice}
                        </span>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-slate-400 font-medium">
                        {deal.merchantName || deal.platform}
                    </p>
                    {deal.originalPrice && (
                        <span className="text-sm text-slate-400 line-through decoration-slate-300">
                            ¥{deal.originalPrice}
                        </span>
                    )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-sm text-slate-400 font-medium">
                        {claimedCount}人已领
                    </div>
                    <button className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        立即抢 <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
