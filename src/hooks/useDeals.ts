/**
 * @module useDeals.ts
 * @description 执行真实优惠与商家的云端抓取
 * @features
 *   - 拉取并格式化并重命名
 *   - 返回 Loading 和 error 处理
 *   - 报错全自动降级 Mock 数据
 * @dependencies @supabase/supabase-js, react
 * @last_updated 2026-02-27 - 补充标准头部说明注释以符合工程规范
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { mockMerchants, mockDeals } from '../utils/mockData'
import type { Merchant } from '../models/merchant'
import type { Deal } from '../models/deal'

interface UseDealsResult {
    merchants: Merchant[]
    deals: Deal[]
    isLoading: boolean
    error: Error | null
    isUsingFallback: boolean
    refresh: () => Promise<void>
}

export function useDeals(): UseDealsResult {
    const [merchants, setMerchants] = useState<Merchant[]>([])
    const [deals, setDeals] = useState<Deal[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [isUsingFallback, setIsUsingFallback] = useState(false)

    const fetchAll = async () => {
        setIsLoading(true)
        setError(null)
        setIsUsingFallback(false)

        try {
            // 检查是否存在合法的 Supabase URL（非占位符）
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
            const isLocalPlaceholder = !supabaseUrl || supabaseUrl === 'http://localhost:54321'

            if (isLocalPlaceholder) {
                // 无有效环境变量，直接使用 mock 数据以避免无意义的网络请求
                throw new Error('VITE_SUPABASE_URL not configured')
            }

            // 并行请求 merchants 和 deals
            const [merchantsRes, dealsRes] = await Promise.all([
                supabase.from('merchants').select('*'),
                supabase.from('deals').select('*').eq('is_active', true)
            ])

            if (merchantsRes.error) throw merchantsRes.error
            if (dealsRes.error) throw dealsRes.error

            // 将下划线转为驼峰（针对 Supabase 原生的 snake_case 返回值）
            const formattedMerchants = (merchantsRes.data || []).map(m => ({
                id: m.id,
                name: m.name,
                category: m.category,
                address: m.address,
                lat: m.lat,
                lng: m.lng,
                district: m.district,
                mall: m.mall,
                avgSpend: m.avg_spend,
                popularityScore: m.popularity_score,
                rating: m.rating,
                source: m.source,
                updatedAt: m.updated_at,
                createdAt: m.created_at,
            }))

            const formattedDeals = (dealsRes.data || []).map(d => ({
                id: d.id,
                merchantId: d.merchant_id,
                title: d.title,
                platform: d.platform,
                scene: d.scene,
                discountType: d.discount_type,
                discountValue: d.discount_value,
                thresholdAmount: d.threshold_amount,
                maxDiscount: d.max_discount,
                price: d.price,
                originalPrice: d.original_price,
                stackable: d.stackable,
                stackGroup: d.stack_group,
                stackExclusiveType: d.stack_exclusive_type,
                appliesStage: d.applies_stage,
                cardRequired: d.card_required,
                membershipRequired: d.membership_required,
                conditions: d.conditions,
                validFrom: d.valid_from,
                validTo: d.valid_to,
                affiliateUrl: d.affiliate_url,
                isActive: d.is_active,
                recurrenceType: d.recurrence_type,
                recurrenceRule: d.recurrence_rule,
                notifyOnNew: d.notify_on_new,
                estimatedMinSave: d.estimated_min_save,
                estimatedMaxSave: d.estimated_max_save,
                voucherClaimUrl: d.voucher_claim_url,
                updatedAt: d.updated_at,
                createdAt: d.created_at,
            }))

            setMerchants(formattedMerchants)
            setDeals(formattedDeals)
        } catch (err: any) {
            // 降级容错：使用本地 mockData，保证 UI 不中断，仅在控制台提示
            console.warn('[useDeals] ⚠️ 无法连接 Supabase，已自动降级到本地演示数据。', err?.message || err)
            setMerchants(mockMerchants)
            setDeals(mockDeals)
            setIsUsingFallback(true)
            // 不设置 error，避免页面展示错误通知
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAll()
    }, [])

    return { merchants, deals, isLoading, error, isUsingFallback, refresh: fetchAll }
}
