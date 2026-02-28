/**
 * @module App.tsx
 * @description 应用的主路由配置和入口枢纽
 * @features
 *   - React.lazy 路由懒加载（按页面代码分割）
 *   - Suspense fallback 加载占位
 *   - 应用整体 Layout
 *   - 全局 ErrorBoundary 错误捕获
 * @dependencies react, react-router-dom, ErrorBoundary
 * @last_updated 2026-02-28 - 路由懒加载 + 代码分割
 */
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'

// 路由级懒加载 —— 每个页面独立 chunk
const Home = lazy(() => import('./pages/Home'))
const Nearby = lazy(() => import('./pages/Nearby'))
const Search = lazy(() => import('./pages/Search'))
const Calendar = lazy(() => import('./pages/Calendar'))
const DealDetail = lazy(() => import('./pages/DealDetail'))
const Profile = lazy(() => import('./pages/Profile'))
const Admin = lazy(() => import('./pages/Admin'))
const NotFound = lazy(() => import('./pages/NotFound'))

/** 全局加载占位 */
function LoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-3">
      <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-primary rounded-full animate-spin" />
      <span className="text-sm text-slate-400 font-medium">加载中…</span>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* 带 TabBar 的页面 */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/nearby" element={
                <ErrorBoundary>
                  <Nearby />
                </ErrorBoundary>
              } />
              <Route path="/search" element={<Search />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* 独立页面（不含 TabBar） */}
            <Route path="/deal/:id" element={<DealDetail />} />
            <Route path="/admin" element={<Admin />} />

            {/* 404 兜底 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
