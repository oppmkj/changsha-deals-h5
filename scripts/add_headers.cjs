const fs = require('fs')
const path = require('path')

const fileMetas = {
    "src/App.tsx": { desc: "应用的主路由配置和入口枢纽", feat: ["配置各页面路径", "应用整体 Layout"], dep: "react-router-dom" },
    "src/lib/tracker.ts": { desc: "全链路埋点追踪系统", feat: ["本地及远程双路事件投递", "支持用户状态判定及关联"], dep: "@supabase/supabase-js" },
    "src/hooks/useAuth.ts": { desc: "封装 Supabase Auth 身份验证与会话管理", feat: ["提供 OTP 手机号登录与核销", "支持一键演示 Mock 流", "暴露出状态位"], dep: "@supabase/supabase-js, react" },
    "src/hooks/useFavorites.ts": { desc: "管理用户对商家和优惠的收藏动作", feat: ["云端与本地同步存储兜底", "获取指定目标收藏态"], dep: "@supabase/supabase-js, react" },
    "src/hooks/useDeals.ts": { desc: "执行真实优惠与商家的云端抓取", feat: ["拉取并格式化并重命名", "返回 Loading 和 error 处理", "报错全自动降级 Mock 数据"], dep: "@supabase/supabase-js, react" },
    "src/pages/Home/Home.tsx": { desc: "长沙优惠 H5 核心首页", feat: ["展示最高省钱金额聚合", "瀑布流多端动态排列", "引入骨架屏及分级载入效"], dep: "react, useDeals, DealCard" },
    "src/pages/Nearby/Nearby.tsx": { desc: "附近门店与地图动态交互页", feat: ["调用腾讯地图 SDK 生命周期", "自动按当前视口放置图钉", "点击选中后底栏抽屉交互"], dep: "react, window.TMap, useDeals" },
    "src/pages/Search/Search.tsx": { desc: "搜索和多维度分类筛选结果页", feat: ["关键词请求时增加防抖避免雪崩", "本地维护最近搜索历史列表", "配合条件动态反馈空状态"], dep: "react, react-router-dom, useDeals, tracker" },
    "src/pages/DealDetail/DealDetail.tsx": { desc: "单个优惠的比价展示与转化沉浸页", feat: ["自动拉起凑单智能计算器", "控制转化 CTA 与授权阻塞拦截", "产生访问、点击及离开时打点记录"], dep: "react-router-dom, useDeals, useAuth, useFavorites, tracker" },
    "src/pages/Profile/Profile.tsx": { desc: "用户个人中心与历史钱包库", feat: ["接入全站优惠产生的省钱总计", "联动使用者的真实收藏或脱机本地收藏", "管理鉴权状态及页面设定区"], dep: "react, react-router-dom, useDeals, useAuth, useFavorites" },
    "src/pages/Admin/Admin.tsx": { desc: "极简管理员综合运营后台面板", feat: ["表单录入并推送优惠", "查看并控制商品上下架状态", "展示核心埋点分类数据分布图"], dep: "react, react-router-dom, useDeals, useAuth, tracker" },
    "src/components/DealCard/DealCard.tsx": { desc: "商家优惠通用卡片渲染组件", feat: ["计算并显示原始价及折后差", "针对不同属性分发色彩标签", "点击时传递详细商品追踪打点"], dep: "react-router-dom, tracker" },
    "src/components/DealCard/DealCardSkeleton.tsx": { desc: "优惠卡片的骨架屏结构体", feat: ["提供加载时的布局骨架", "提供视觉反馈的循环闪光动画"], dep: "无" },
    "src/components/AuthModal/AuthModal.tsx": { desc: "底部全局唤起的登录及验证交互弹窗", feat: ["分步式收集手机及安全短信验证码", "接管所有无授权行为阻塞", "提供演示环境快速通过机制"], dep: "react, useAuth" }
}

const dateStr = new Date().toISOString().split('T')[0]

for (const [relPath, meta] of Object.entries(fileMetas)) {
    const fullPath = path.resolve('c:/Users/huang/Documents/trae_projects/changsha-deals-h5', relPath)
    if (!fs.existsSync(fullPath)) continue

    let content = fs.readFileSync(fullPath, 'utf-8')

    // Find where actual code (import/export/const/function/var/let) starts
    const codeStartIndex = content.search(/^(import|export|const|function|var|let)\b/m)

    if (codeStartIndex !== -1) {
        const header = content.slice(0, codeStartIndex)
        // If it's a comment block ending right before the code, we remove the existing header entirely
        if (/^[\s\n]*(\/\*[\s\S]*?\*\/|(\/\/.*\n)*)[\s\n]*$/.test(header)) {
            content = content.slice(codeStartIndex)
        }
    }

    const featuresStr = meta.feat.map(f => ` *   - ${f}`).join('\n')
    const commentBlock = `/**
 * @module ${path.basename(relPath)}
 * @description ${meta.desc}
 * @features
${featuresStr}
 * @dependencies ${meta.dep}
 * @last_updated ${dateStr} - 补充标准头部说明注释以符合工程规范
 */\n`

    fs.writeFileSync(fullPath, commentBlock + content.trimStart())
    console.log(`Updated header for \${relPath}`) // leaving \${relPath} here so console.log literal is fine, but actually using backticks for the js logic
}
