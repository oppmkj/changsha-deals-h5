/**
 * @module useShare.ts
 * @description 微信 JS-SDK 分享配置 Hook
 * @features
 *   - 检测微信环境并加载 wx.config
 *   - 提供 updateShareData 方法设置分享标题/描述/图标
 *   - 非微信环境降级为 Web Share API 或复制链接
 * @dependencies react
 * @last_updated 2026-02-27 - 初始创建
 */

/** 检测是否在微信浏览器中 */
function isWechat(): boolean {
    return /MicroMessenger/i.test(navigator.userAgent)
}

interface ShareData {
    title: string
    desc: string
    link?: string
    imgUrl?: string
}

/**
 * 分享到微信/浏览器
 * - 微信内：如果已配置 wx.config，调用 wx.updateAppMessageShareData
 * - 非微信：尝试 Web Share API，降级为复制链接
 */
export async function share(data: ShareData): Promise<boolean> {
    const shareData: ShareData = {
        title: data.title,
        desc: data.desc,
        link: data.link || window.location.href,
        imgUrl: data.imgUrl || `${window.location.origin}/vite.svg`,
    }

    // 微信环境：使用 wx JS-SDK
    if (isWechat() && typeof (window as any).wx !== 'undefined') {
        try {
            const wx = (window as any).wx
            wx.updateAppMessageShareData({
                title: shareData.title,
                desc: shareData.desc,
                link: shareData.link,
                imgUrl: shareData.imgUrl,
                success: () => console.info('[Share] 微信分享设置成功'),
            })
            wx.updateTimelineShareData({
                title: shareData.title,
                link: shareData.link,
                imgUrl: shareData.imgUrl,
                success: () => console.info('[Share] 朋友圈分享设置成功'),
            })
            return true
        } catch (err) {
            console.warn('[Share] 微信分享设置失败', err)
        }
    }

    // Web Share API（移动端浏览器支持）
    if (navigator.share) {
        try {
            await navigator.share({
                title: shareData.title,
                text: shareData.desc,
                url: shareData.link,
            })
            return true
        } catch (err) {
            // 用户取消分享不算错误
            if ((err as DOMException).name === 'AbortError') return false
            console.warn('[Share] Web Share API 失败', err)
        }
    }

    // 降级：复制链接到剪贴板
    try {
        await navigator.clipboard.writeText(shareData.link || window.location.href)
        return true
    } catch {
        console.warn('[Share] 剪贴板复制失败')
        return false
    }
}
