/**
 * 用户相关数据模型
 */

/** 用户基础信息 */
export interface User {
    id: string
    phone: string | null
    nickname: string | null
    avatarUrl: string | null
    createdAt: string
    updatedAt: string
}

/** 用户持卡记录 */
export interface UserCard {
    id: string
    userId: string
    bank: string
    cardName: string
    cardLevel: string
    createdAt: string
}

/** 用户平台会员 */
export interface UserMembership {
    id: string
    userId: string
    platform: string
    level: string
    expiresAt: string
    createdAt: string
}

/** 用户收藏商家 */
export interface UserFavorite {
    userId: string
    merchantId: string
    createdAt: string
}

/** 点击追踪日志 */
export interface UserClickLog {
    id: string
    userId: string | null
    dealId: string
    merchantId: string
    platform: string | null
    dealType: string | null
    basePrice: number | null
    finalPrice: number | null
    savedAmount: number | null
    isAccessible: boolean
    clickedAt: string
    sessionId: string | null
}
