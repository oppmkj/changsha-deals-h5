/// <reference lib="webworker" />

/**
 * @module sw.js
 * @description Service Worker — 离线缓存策略
 * @features
 *   - 安装时预缓存关键静态资源
 *   - 运行时 Cache-First 策略（静态资源）
 *   - Network-First 策略（API 请求）
 * @last_updated 2026-02-28 - 初始创建
 */

const CACHE_NAME = 'changsha-deals-v1'

/** 预缓存资源列表 */
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/manifest.json',
]

// 安装阶段：预缓存
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    )
})

// 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    )
})

// 拦截请求：静态资源 Cache-First，API Network-First
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url)

    // 跳过非 GET 请求
    if (event.request.method !== 'GET') return

    // API 请求：Network-First
    if (url.hostname.includes('supabase') || url.pathname.startsWith('/api')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone()
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
                    return response
                })
                .catch(() => caches.match(event.request))
        )
        return
    }

    // 静态资源：Cache-First
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached
            return fetch(event.request).then(response => {
                // 只缓存同源请求
                if (url.origin === self.location.origin) {
                    const clone = response.clone()
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
                }
                return response
            })
        })
    )
})
