/**
 * @module NotFound.tsx
 * @description 404 页面——未匹配路由的友好兜底
 * @features
 *   - 动态 emoji 动画
 *   - 返回首页按钮
 *   - 暗黑模式适配
 * @dependencies react-router-dom
 * @last_updated 2026-02-28 - 初始创建
 */
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-6 text-center">
            {/* 大数字 */}
            <div className="relative mb-6">
                <span className="text-[120px] font-black text-slate-200 dark:text-slate-800 leading-none select-none">
                    404
                </span>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl animate-bounce">
                    🤷
                </span>
            </div>

            <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                页面走丢了
            </h1>
            <p className="text-sm text-slate-400 mb-8 max-w-xs">
                你访问的页面不存在或已被移除，试试回到首页看看有哪些好价优惠！
            </p>

            <button
                onClick={() => navigate('/')}
                className="px-8 py-3 bg-gradient-to-r from-[#FF4D00] to-[#FF8C00] text-white rounded-2xl font-bold text-base shadow-lg shadow-orange-200/50 active:scale-95 transition-transform flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-[20px]">home</span>
                回到首页
            </button>
        </div>
    )
}
