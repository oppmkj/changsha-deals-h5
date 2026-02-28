/**
 * @module ErrorBoundary.tsx
 * @description 全局 React 错误边界组件，捕获子组件渲染异常防止整页白屏
 * @features
 *   - 捕获 React 渲染阶段的 JS 异常
 *   - 展示友好的错误恢复界面
 *   - 提供"重试"按钮让用户一键恢复
 *   - 自动记录错误信息到 console.error
 * @dependencies react
 * @last_updated 2026-02-27 - 初始创建
 */
import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
    children: ReactNode
    /** 可选的降级 UI，不传则使用默认样式 */
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('[ErrorBoundary] 捕获到渲染异常:', error, errorInfo.componentStack)
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null })
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
                        <span className="material-symbols-outlined text-[32px] text-red-400">error_outline</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2">哎呀，页面出错了</h2>
                    <p className="text-sm text-slate-500 mb-1 max-w-sm">
                        应用遇到了一个意外错误，但不用担心，点击下方按钮即可恢复。
                    </p>
                    {this.state.error && (
                        <p className="text-xs text-slate-400 mb-6 max-w-sm break-all font-mono">
                            {this.state.error.message}
                        </p>
                    )}
                    <button
                        onClick={this.handleRetry}
                        className="px-6 py-3 bg-gradient-primary text-white font-bold rounded-full shadow-lg active:scale-95 transition-transform"
                    >
                        重新加载
                    </button>
                    <button
                        onClick={() => { window.location.href = '/' }}
                        className="mt-3 px-4 py-2 text-sm text-slate-500 font-medium"
                    >
                        返回首页
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
