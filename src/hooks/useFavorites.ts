/**
 * @module useFavorites.ts
 * @description 管理用户对商家和优惠的收藏动作
 * @features
 *   - 云端与本地同步存储兜底
 *   - 获取指定目标收藏态
 *   - Supabase 操作增加 try/catch 保护
 * @dependencies @supabase/supabase-js, react
 * @last_updated 2026-02-27 - toggleFavorite 添加错误处理与 localStorage 回退
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

type FavoriteEntry = {
    merchantId: string
    dealId?: string
}

interface UseFavoritesResult {
    favorites: FavoriteEntry[]
    isFavorited: (merchantId: string) => boolean
    toggleFavorite: (merchantId: string, dealId?: string) => Promise<void>
    isLoading: boolean
}

const LOCAL_KEY = 'changsha_deals_favorites'

function loadLocalFavorites(): FavoriteEntry[] {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
    } catch {
        return []
    }
}

function saveLocalFavorites(favs: FavoriteEntry[]) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(favs))
}

export function useFavorites(userId: string | undefined): UseFavoritesResult {
    const [favorites, setFavorites] = useState<FavoriteEntry[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const isSupabaseConfigured = (): boolean => {
        const url = import.meta.env.VITE_SUPABASE_URL
        return !!url && url !== 'http://localhost:54321'
    }

    // 加载收藏列表
    useEffect(() => {
        if (!userId) {
            setFavorites(loadLocalFavorites())
            return
        }

        if (!isSupabaseConfigured()) {
            setFavorites(loadLocalFavorites())
            return
        }

        // 真实 Supabase 查询
        setIsLoading(true)
        supabase
            .from('user_favorites')
            .select('merchant_id, deal_id')
            .eq('user_id', userId)
            .then(({ data, error }) => {
                if (!error && data) {
                    setFavorites(data.map(r => ({ merchantId: r.merchant_id, dealId: r.deal_id })))
                } else if (error) {
                    console.warn('[useFavorites] 加载收藏失败，使用本地数据', error)
                    setFavorites(loadLocalFavorites())
                }
                setIsLoading(false)
            })
    }, [userId])

    const isFavorited = useCallback((merchantId: string) => {
        return favorites.some(f => f.merchantId === merchantId)
    }, [favorites])

    const toggleFavorite = async (merchantId: string, dealId?: string) => {
        const alreadyFaved = isFavorited(merchantId)

        if (!isSupabaseConfigured() || !userId) {
            // 演示模式 / 未登录：操作 localStorage
            const next = alreadyFaved
                ? favorites.filter(f => f.merchantId !== merchantId)
                : [...favorites, { merchantId, dealId }]
            setFavorites(next)
            saveLocalFavorites(next)
            return
        }

        // 真实 Supabase（包裹 try/catch 防止网络异常导致状态不一致）
        try {
            if (alreadyFaved) {
                const { error } = await supabase
                    .from('user_favorites')
                    .delete()
                    .eq('user_id', userId)
                    .eq('merchant_id', merchantId)
                if (error) throw error
                setFavorites(prev => prev.filter(f => f.merchantId !== merchantId))
            } else {
                const { data, error } = await supabase
                    .from('user_favorites')
                    .insert([{ user_id: userId, merchant_id: merchantId, deal_id: dealId || null }])
                    .select('merchant_id, deal_id')
                    .single()
                if (error) throw error
                if (data) {
                    setFavorites(prev => [...prev, { merchantId: data.merchant_id, dealId: data.deal_id }])
                }
            }
        } catch (err) {
            console.warn('[useFavorites] Supabase 操作失败，回退到 localStorage', err)
            // 回退：用 localStorage 保证操作至少在本地生效
            const next = alreadyFaved
                ? favorites.filter(f => f.merchantId !== merchantId)
                : [...favorites, { merchantId, dealId }]
            setFavorites(next)
            saveLocalFavorites(next)
        }
    }

    return { favorites, isFavorited, toggleFavorite, isLoading }
}
