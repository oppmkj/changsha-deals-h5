/**
 * @module useOnlineStatus.ts
 * @description 检测浏览器在线/离线状态的 Hook
 * @features
 *   - 实时监听 online/offline 事件
 *   - 返回当前在线状态布尔值
 * @dependencies react
 * @last_updated 2026-02-28 - 初始创建
 */
import { useState, useEffect } from 'react'

export function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    )

    useEffect(() => {
        const goOnline = () => setIsOnline(true)
        const goOffline = () => setIsOnline(false)

        window.addEventListener('online', goOnline)
        window.addEventListener('offline', goOffline)

        return () => {
            window.removeEventListener('online', goOnline)
            window.removeEventListener('offline', goOffline)
        }
    }, [])

    return isOnline
}
