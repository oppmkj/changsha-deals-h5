/**
 * 优惠相关数据模型
 * 与 deal_engine_spec.md v3.0 对齐
 */

/** 优惠类型码 */
export type DiscountType =
    | 'GROUP_BUY'     // 团购套餐
    | 'VOUCHER'       // 代金券
    | 'FULL_REDUCE'   // 满减
    | 'PERCENTAGE'    // 折扣
    | 'CASHBACK'      // 返现
    | 'FREE_DELIVERY' // 免配送费

/** 使用场景 */
export type DealScene = 'dine_in' | 'delivery' | 'both'

/** 叠加互斥类型 */
export type StackExclusiveType = 'HARD' | 'SOFT'

/** 优惠作用阶段 */
export type AppliesStage = 'BASE' | 'AFTER_FULL_REDUCE' | 'AFTER_PERCENTAGE' | 'FINAL'

/** 时效重复类型 */
export type RecurrenceType = 'NONE' | 'WEEKLY' | 'MONTHLY' | 'SPECIFIC'

/** 优惠数据结构 */
export interface Deal {
    id: string
    merchantId: string
    title: string
    platform: string
    scene: DealScene
    discountType: DiscountType
    discountValue: number
    thresholdAmount: number | null
    maxDiscount: number | null
    price: number | null         // 团购套餐价
    originalPrice: number | null // 原价
    // 叠加控制
    stackable: boolean
    stackGroup: string | null
    stackExclusiveType: StackExclusiveType | null
    appliesStage: AppliesStage
    // 资格要求
    cardRequired: string | null
    membershipRequired: string | null
    conditions: string | null
    // 有效期
    validFrom: string | null
    validTo: string | null
    // 联盟跳转
    affiliateUrl: string | null
    isActive: boolean
    // 时效重复
    recurrenceType: RecurrenceType
    recurrenceRule: string | null
    notifyOnNew: boolean
    // 外卖平台估算
    estimatedMinSave: number | null
    estimatedMaxSave: number | null
    voucherClaimUrl: string | null
    updatedAt: string
    createdAt: string
}

/** 用户信用卡 */
export interface Card {
    bank: string
    cardName: string
    cardLevel: '普通' | '金卡' | '白金' | '钻石' | '无限'
}

/** 用户平台会员 */
export interface Membership {
    platform: string
    level: string
    expiresAt: string
}

/** 决策引擎计算上下文 */
export interface CalcContext {
    merchantId: string
    basePrice: number
    userCards: Card[]
    memberships: Membership[]
    now: Date
}

/** 单条优惠计算结果 */
export interface DealOption {
    deal: Deal
    finalPrice: number
    savedAmount: number
    isCashback?: boolean
    isAccessible: boolean
    unmetThreshold?: number | null
    /** 门槛感知提示文案 */
    thresholdHint?: string | null
}
