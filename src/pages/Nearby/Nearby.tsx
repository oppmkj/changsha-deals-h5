/**
 * @module Nearby.tsx
 * @description 附近门店与地图动态交互页
 * @features
 *   - 调用腾讯地图 SDK 生命周期
 *   - 自动按当前视口放置图钉
 *   - 点击选中后底栏抽屉交互
 *   - 头部快捷分类动态过滤图钉
 *   - 浏览器 Geolocation 获取真实位置
 * @dependencies react, window.TMap, useDeals
 * @last_updated 2026-02-27 - 接入浏览器定位 API
 */
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useDeals } from '../../hooks/useDeals'
import DealCard from '../../components/DealCard'
import { useToast } from '../../components/Toast'

// 确保 TypeScript 知道全局 TMap
/// <reference path="../../types/tmap.d.ts" />

// 长沙市中心坐标（五一广场附近）
const CS_CENTER = { lat: 28.1960, lng: 112.9773 }

const CATEGORIES = ['全部', '美食', '茶饮', '娱乐', '超市']

export default function Nearby() {
    const navigate = useNavigate()
    const { merchants, deals, isLoading } = useDeals()
    const { info } = useToast()

    const [activePin, setActivePin] = useState<string | null>(null)
    const [activeCategory, setActiveCategory] = useState<string>('全部')
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<TMap.Map | null>(null)
    const markerLayerRef = useRef<TMap.MultiMarker | null>(null)
    const [mapReady, setMapReady] = useState(false)

    /** 中文分类 → 英文 category 的映射 */
    const CATEGORY_MAP: Record<string, string> = {
        '美食': 'food',
        '茶饮': 'tea',
        '娱乐': 'entertainment',
        '超市': 'supermarket',
    }

    // 基于分类过滤后的商家
    const filteredMerchants = useMemo(() => {
        if (activeCategory === '全部') return merchants
        const engCategory = CATEGORY_MAP[activeCategory]
        if (!engCategory) return merchants
        return merchants.filter(m => m.category === engCategory)
    }, [merchants, activeCategory])

    // 初始化地图
    useEffect(() => {
        const initMap = () => {
            if (!mapRef.current || mapInstanceRef.current) return
            if (typeof window.TMap === 'undefined') return

            try {
                const map = new window.TMap.Map(mapRef.current, {
                    center: new window.TMap.LatLng(CS_CENTER.lat, CS_CENTER.lng),
                    zoom: 15,
                    viewMode: '2D',
                })
                mapInstanceRef.current = map
                setMapReady(true)

                // 尝试获取用户真实位置
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                            setUserLocation(loc)
                            map.setCenter(new window.TMap.LatLng(loc.lat, loc.lng))
                            console.info('[Nearby] 已定位到用户位置', loc)
                        },
                        (err) => {
                            console.warn('[Nearby] 定位失败，使用默认坐标', err.message)
                        },
                        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
                    )
                }
            } catch (e) {
                console.error('[Nearby] 地图初始化失败', e)
            }
        }

        if (typeof window.TMap !== 'undefined') {
            initMap()
        } else {
            const prev = window.initTMap || (() => { })
            window.initTMap = () => {
                prev()
                initMap()
            }
        }

        return () => {
            if (markerLayerRef.current) {
                markerLayerRef.current.destroy?.()
                markerLayerRef.current = null
            }
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy?.()
                mapInstanceRef.current = null
            }
        }
    }, [])

    // 当数据和地图都就绪后，渲染 Marker
    useEffect(() => {
        if (!mapReady || !mapInstanceRef.current) return

        if (markerLayerRef.current) {
            markerLayerRef.current.destroy?.()
            markerLayerRef.current = null
        }

        if (filteredMerchants.length === 0) {
            setActivePin(null)
            return
        }

        const geometries: TMap.MarkerGeometry[] = filteredMerchants.map(m => {
            const bestDeal = deals.find(d => d.merchantId === m.id)
            return {
                id: m.id,
                styleId: 'deal_pin',
                position: new window.TMap.LatLng(m.lat || CS_CENTER.lat, m.lng || CS_CENTER.lng),
                properties: {
                    merchantName: m.name,
                    save: bestDeal ? ((bestDeal.originalPrice || 0) - (bestDeal.price || 0)) || bestDeal.discountValue || 0 : 0
                }
            }
        })

        const markerLayer = new window.TMap.MultiMarker({
            map: mapInstanceRef.current,
            styles: {
                deal_pin: new window.TMap.MarkerStyle({
                    width: 38,
                    height: 38,
                    anchor: { x: 19, y: 38 },
                    // Fix: SDK runtime 需要 string，但 @types 声明的是 number，通过 as 绕过检查
                    direction: '0' as unknown as number,
                    src: `data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='38' height='48' viewBox='0 0 38 48'><path fill='%23FF4500' d='M19 0C8.5 0 0 8.5 0 19c0 13 19 29 19 29S38 32 38 19C38 8.5 29.5 0 19 0z'/><circle fill='white' cx='19' cy='19' r='10'/></svg>`
                })
            },
            geometries
        })

        markerLayer.on('click', (e: TMap.MarkerEvent) => {
            const id = e.geometry.id
            setActivePin(prev => prev === id ? null : id)
        })

        markerLayerRef.current = markerLayer

        // 清理不再有效的 activePin
        if (activePin !== null && !filteredMerchants.some(m => m.id === activePin)) {
            setActivePin(null)
        }
    }, [mapReady, filteredMerchants, deals]) // 移除 activePin 依赖，避免点击图钉重新渲染所有图钉

    const activeDeal = useMemo(() => {
        return deals.find(d => d.merchantId === activePin) || null
    }, [deals, activePin])

    const activeMerchant = useMemo(() => {
        return merchants.find(m => m.id === activePin) || null
    }, [merchants, activePin])

    return (
        <div className="h-screen w-full flex flex-col bg-slate-900 font-display relative overflow-hidden">
            {/* Header: 悬浮搜索和快捷过滤 */}
            <header className="absolute top-0 inset-x-0 z-[1100] px-4 pt-5 pb-4 bg-gradient-to-b from-slate-900/80 to-transparent pointer-events-none">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="pointer-events-auto w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
                    </button>

                    <button
                        className="pointer-events-auto flex-1 bg-white/90 backdrop-blur-md h-10 rounded-2xl shadow-lg border border-white/20 flex items-center gap-2 px-4 text-slate-400 text-sm font-medium"
                        onClick={() => navigate('/search')}
                    >
                        <span className="material-symbols-outlined text-[18px]">search</span>
                        搜索附近优惠...
                    </button>
                </div>

                {/* 快捷分类 */}
                <div className="flex gap-2 mt-3 overflow-x-auto pointer-events-auto">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`shrink-0 px-3 py-1.5 backdrop-blur-md rounded-full text-xs font-bold shadow-sm border active:scale-95 transition-transform ${activeCategory === cat
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white/90 text-slate-700 border-white/20'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </header>

            {/* 腾讯地图容器 — 此 div 完全交给 TMap SDK 控制，不放任何 React 子元素 */}
            <div
                id="nearby-map-container"
                ref={mapRef}
                className="flex-1 w-full bg-slate-200"
                style={{ minHeight: 0, position: 'relative', zIndex: 0 }}
            />

            {/* 加载中提示 — 独立于地图容器，避免 TMap SDK 接管 DOM 后 React removeChild 崩溃 */}
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 z-[5]">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-[#FF4500] rounded-full animate-spin mb-3"></div>
                    <p className="text-slate-500 text-sm font-medium">正在定位附近优惠...</p>
                </div>
            )}

            {/* 右下角工具按钮 */}
            <div className="absolute right-4 bottom-48 flex flex-col gap-3 z-[1100]">
                <button
                    className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
                    onClick={() => {
                        if (mapInstanceRef.current) {
                            const center = userLocation || CS_CENTER
                            mapInstanceRef.current.setCenter(new window.TMap.LatLng(center.lat, center.lng))
                            mapInstanceRef.current.setZoom(15)
                        }
                    }}
                >
                    <span className="material-symbols-outlined text-[20px]">my_location</span>
                </button>
                <button
                    className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
                    onClick={() => {
                        info('地图图层切换与路况显示功能规划中，敬请期待！')
                    }}
                >
                    <span className="material-symbols-outlined text-[20px]">layers</span>
                </button>
            </div>

            {/* 底部 Deal 卡片面板 */}
            {(activePin && activeDeal && activeMerchant) && (
                <div className="absolute bottom-6 inset-x-4 z-[1100] animate-in slide-in-from-bottom-8 fade-in duration-300">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
                        {/* 商家信息行 */}
                        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[16px] text-[#FF4500]">storefront</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-slate-900 truncate">{activeMerchant.name}</p>
                                <p className="text-[11px] text-slate-400">{activeMerchant.district} · {activeMerchant.category}</p>
                            </div>
                            <button
                                className="shrink-0 text-slate-300"
                                onClick={() => setActivePin(null)}
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        <div className="px-4 pb-3">
                            <DealCard deal={{ ...activeDeal, merchantName: activeMerchant.name }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
