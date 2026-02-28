/**
 * 腾讯地图 JS API v2 最小类型声明
 * 用于 TypeScript 类型检查，避免 `window.TMap` 报错
 */

interface TMapLatLng {
    lat: number
    lng: number
}

interface TMapMarkerGeometry {
    id: string
    position: TMapLatLng
    properties?: Record<string, unknown>
}

interface TMapMarkerStyle {
    width: number
    height: number
    anchor: TMapLatLng
    src: string
}

declare namespace TMap {
    class LatLng {
        constructor(lat: number, lng: number)
    }

    class Map {
        constructor(container: HTMLElement, options: {
            center: LatLng
            zoom?: number
            baseMap?: { type: string }
            viewMode?: string
            pitch?: number
        })
        setCenter(center: LatLng): void
        setZoom(zoom: number): void
        destroy(): void
    }

    class MultiMarker {
        constructor(options: {
            id?: string
            map: Map
            styles?: Record<string, MarkerStyle>
            geometries?: MarkerGeometry[]
        })
        setGeometries(geometries: MarkerGeometry[]): void
        on(event: string, callback: (e: MarkerEvent) => void): void
        destroy(): void
    }

    class MarkerStyle {
        constructor(options: {
            width: number
            height: number
            anchor?: { x: number; y: number }
            src?: string
            color?: string
            size?: number
            direction?: number
        })
    }

    interface MarkerGeometry {
        id: string
        styleId?: string
        position: LatLng
        properties?: Record<string, unknown>
    }

    interface MarkerEvent {
        geometry: MarkerGeometry
        latLng: LatLng
        originalEvent: MouseEvent
    }
}

declare interface Window {
    TMap: typeof TMap
    initTMap?: () => void
}
