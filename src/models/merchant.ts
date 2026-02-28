/**
 * 商家数据模型
 */

/** 商家数据结构 */
export interface Merchant {
    id: string
    name: string
    category: string
    address: string
    lat: number
    lng: number
    district: string
    mall: string | null
    avgSpend: number | null
    popularityScore: number
    rating: number | null
    source: string | null
    updatedAt: string
    createdAt: string
}

/** 商家品类枚举 — 可配置扩展 */
export const MERCHANT_CATEGORIES = [
    { key: 'hotpot', label: '火锅', icon: '🍲' },
    { key: 'food', label: '美食', icon: '🍜' },
    { key: 'tea', label: '奶茶', icon: '🧋' },
    { key: 'bbq', label: '烧烤', icon: '🍖' },
    { key: 'dessert', label: '甜品', icon: '🍰' },
    { key: 'cafe', label: '咖啡', icon: '☕' },
    { key: 'ktvbar', label: 'KTV/酒吧', icon: '🎤' },
    { key: 'movie', label: '电影', icon: '🎬' },
] as const

export type MerchantCategory = typeof MERCHANT_CATEGORIES[number]['key']
