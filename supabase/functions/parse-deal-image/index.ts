/**
 * Supabase Edge Function: parse-deal-image
 * 
 * 【模块】parse-deal-image
 * 【作用】接收优惠活动截图（Base64），调用 OpenAI GPT-4o 进行多模态分析，
 *        提取商家名、优惠标题、价格、平台等结构化信息并返回 JSON。
 * 【功能】
 *   - 校验输入（Base64 图片 + MIME 类型）
 *   - 构造多模态 Prompt 指导 AI 提取特定字段
 *   - 解析 AI 返回的 JSON 并做字段补全
 * 【依赖】OpenAI API（需在 Supabase 项目的 Secrets 中配置 OPENAI_API_KEY）
 * 【变更日志】2026-03-01 - 初始创建
 * 
 * 部署方式：
 *   1. 安装 Supabase CLI: npm i -g supabase
 *   2. supabase functions deploy parse-deal-image
 *   3. 在 Supabase Dashboard → Project Settings → Secrets 中添加 OPENAI_API_KEY
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

const SYSTEM_PROMPT = `你是一个专业的优惠活动信息提取助手。用户会给你一张优惠活动的截图（来自美团、抖音、银行APP等平台），你需要从中识别并提取以下结构化信息。

请严格按照以下 JSON 格式返回（不要返回任何其他内容）：
{
  "merchantName": "商家名称",
  "title": "优惠标题/活动名称",
  "platform": "来源平台（美团/抖音/招商银行/建设银行/支付宝/小程序 等）",
  "discountType": "优惠类型（GROUP_BUY=团购套餐, FULL_REDUCE=满减, PERCENTAGE=折扣, VOUCHER=代金券）",
  "discountValue": 0,
  "thresholdAmount": 0,
  "price": 0,
  "originalPrice": 0,
  "conditions": "使用条件（限时/限量/会员专享等，无则为空字符串）",
  "validFrom": "2026-01-01",
  "validTo": "2026-12-31",
  "confidence": 0.9
}

规则：
1. discountType 只能是 GROUP_BUY / FULL_REDUCE / PERCENTAGE / VOUCHER 之一
2. 如果是团购套餐，price 填团购价，originalPrice 填门市价，discountValue 填 0
3. 如果是满减，thresholdAmount 填满X元，discountValue 填减Y元，price 和 originalPrice 填 0
4. 如果是折扣，discountValue 填折扣值（如 0.85 代表85折），price 和 originalPrice 填 0
5. 日期无法识别时，validFrom 填今天，validTo 填3个月后
6. confidence 根据你对识别结果的把握程度填 0~1 之间的小数
7. 所有数字字段如果无法识别就填 0
8. 只返回 JSON，不要返回任何解释文字`

serve(async (req) => {
    // CORS 处理
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        })
    }

    try {
        if (!OPENAI_API_KEY) {
            return new Response(
                JSON.stringify({ error: '服务端未配置 OPENAI_API_KEY' }),
                { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
            )
        }

        const { image, mimeType } = await req.json()

        if (!image) {
            return new Response(
                JSON.stringify({ error: '缺少图片数据' }),
                { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
            )
        }

        // 调用 OpenAI GPT-4o
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: '请识别这张优惠活动截图中的信息：' },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType || 'image/jpeg'};base64,${image}`,
                                    detail: 'high'
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000,
                temperature: 0.1
            })
        })

        if (!openaiRes.ok) {
            const errText = await openaiRes.text()
            console.error('[parse-deal-image] OpenAI API 错误:', errText)
            return new Response(
                JSON.stringify({ error: 'AI 识别服务异常' }),
                { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
            )
        }

        const openaiData = await openaiRes.json()
        const content = openaiData.choices?.[0]?.message?.content || ''

        // 从返回内容中提取 JSON
        let parsed
        try {
            // 尝试直接解析
            parsed = JSON.parse(content)
        } catch {
            // 尝试从 markdown 代码块中提取
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[1].trim())
            } else {
                throw new Error('AI 返回内容无法解析为 JSON')
            }
        }

        // 补全缺失字段的默认值
        const result = {
            merchantName: parsed.merchantName || '',
            title: parsed.title || '',
            platform: parsed.platform || '美团',
            discountType: parsed.discountType || 'GROUP_BUY',
            discountValue: Number(parsed.discountValue) || 0,
            thresholdAmount: Number(parsed.thresholdAmount) || 0,
            price: Number(parsed.price) || 0,
            originalPrice: Number(parsed.originalPrice) || 0,
            conditions: parsed.conditions || '',
            validFrom: parsed.validFrom || new Date().toISOString().split('T')[0],
            validTo: parsed.validTo || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
            confidence: Number(parsed.confidence) || 0.5
        }

        return new Response(
            JSON.stringify(result),
            { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )

    } catch (err) {
        console.error('[parse-deal-image] 处理异常:', err)
        return new Response(
            JSON.stringify({ error: err.message || '服务异常' }),
            { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
    }
})
