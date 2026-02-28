/**
 * @module main.tsx
 * @description 应用入口文件
 * @features
 *   - 渲染 React 根组件
 *   - 包裹全局 ToastProvider
 *   - 初始化 Web Vitals 性能监控
 * @dependencies react, react-dom, App, Toast
 * @last_updated 2026-02-28 - 添加 Web Vitals 监控
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ToastProvider } from './components/Toast'
import { initWebVitals } from './lib/webVitals'
import './styles/global.css'

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element not found')
}

createRoot(rootEl).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)

// 异步采集 Web Vitals（不阻塞渲染）
initWebVitals()
