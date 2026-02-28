/**
 * @module AuthModal.tsx
 * @description 底部全局唤起的登录及验证交互弹窗
 * @features
 *   - 分步式收集手机及安全短信验证码
 *   - 接管所有无授权行为阻塞
 *   - 提供演示环境快速通过机制
 * @dependencies react, useAuth
 * @last_updated 2026-02-27 - 补充标准头部说明注释以符合工程规范
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
    /** 登录成功后的回调 */
    onSuccess?: () => void
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
    const { authStep, errorMsg, signInWithPhone, verifyOtp, mockSignIn, isUsingMock, setAuthStep } = useAuth()
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState('')

    // 登录成功关闭弹窗
    useEffect(() => {
        if (authStep === 'success') {
            onSuccess?.()
            onClose()
        }
    }, [authStep, onClose, onSuccess])

    // 弹窗关闭时重置状态
    const handleClose = () => {
        if (authStep !== 'loading') {
            setPhone('')
            setOtp('')
            setAuthStep('idle')
            onClose()
        }
    }

    const handleSendOtp = async () => {
        if (phone.length < 11) return
        await signInWithPhone(phone)
    }

    const handleVerify = async () => {
        if (otp.length !== 6) return
        await verifyOtp(phone, otp)
    }

    if (!isOpen) return null

    return (
        <>
            {/* 半透明遮罩 */}
            <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
                onClick={handleClose}
            />

            {/* Bottom Sheet 弹窗本体 */}
            <div className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl px-6 pt-4 pb-10 animate-in slide-in-from-bottom-8 fade-in duration-300">
                {/* 拖动手柄 */}
                <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">登录长沙优惠</h2>
                        <p className="text-sm text-slate-400 mt-0.5">登录后可收藏商家、查看历史优惠</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* 演示模式快捷入口 */}
                {(isUsingMock || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'http://localhost:54321') && authStep !== 'otp' && (
                    <div className="mb-5 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-100 dark:border-amber-500/20">
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-2">
                            🔧 演示模式：未配置 Supabase，可直接快捷体验登录
                        </p>
                        <button
                            onClick={mockSignIn}
                            className="w-full py-2 bg-amber-500 text-white text-sm font-bold rounded-xl active:scale-[0.98] transition-transform"
                        >
                            快速体验（跳过验证）
                        </button>
                    </div>
                )}

                {/* 手机号输入步骤 */}
                {(authStep === 'idle' || authStep === 'phone' || authStep === 'loading') && (
                    <div className="space-y-4">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">+86</span>
                            <input
                                type="tel"
                                inputMode="numeric"
                                maxLength={11}
                                placeholder="请输入手机号"
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl py-4 pl-14 pr-4 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-[#FF4500]/50 transition-all"
                            />
                        </div>
                        {errorMsg && (
                            <p className="text-xs text-red-500 font-medium px-1">{errorMsg}</p>
                        )}
                        <button
                            onClick={handleSendOtp}
                            disabled={phone.length < 11 || authStep === 'loading'}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {authStep === 'loading' ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    发送中...
                                </>
                            ) : '发送验证码'}
                        </button>
                    </div>
                )}

                {/* OTP 验证码输入步骤 */}
                {authStep === 'otp' && (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-500 text-center">
                            验证码已发送至 <span className="font-bold text-slate-900 dark:text-white">+86 {phone}</span>
                        </p>
                        <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="请输入 6 位验证码"
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                            autoFocus
                            className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl py-4 px-4 text-center text-slate-900 dark:text-white font-black text-2xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-[#FF4500]/50 transition-all"
                        />
                        {errorMsg && (
                            <p className="text-xs text-red-500 font-medium text-center">{errorMsg}</p>
                        )}
                        <button
                            onClick={handleVerify}
                            disabled={otp.length !== 6}
                            className="w-full py-4 bg-[linear-gradient(135deg,#FF4500_0%,#FF8C00_100%)] text-white rounded-2xl font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-lg shadow-orange-200/50"
                        >
                            确认登录
                        </button>
                        <button
                            onClick={() => { setOtp(''); setAuthStep('phone') }}
                            className="w-full py-2 text-slate-400 text-sm font-medium"
                        >
                            重新获取验证码
                        </button>
                    </div>
                )}

                {/* 登录协议 */}
                <p className="text-[10px] text-slate-400 text-center mt-4 leading-relaxed">
                    登录即代表同意
                    <span className="text-[#FF4500] font-medium"> 用户服务条款 </span>
                    和
                    <span className="text-[#FF4500] font-medium"> 隐私政策</span>
                </p>
            </div>
        </>
    )
}
