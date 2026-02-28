/**
 * Supabase Edge Function: parse-deal-image
 *
 * 【模块】parse-deal-image
 * 【作用】接收优惠活动截图（Base64），调用 Google Gemini 2.0 Flash 进行多模态分析，
 *        提取商家名、优惠标题、价格、平台等结构化信息并返回 JSON。
 * 【功能】
 *   - 校验输入（Base64 图片 + MIME 类型）
 *   - 构造多模态 Prompt 指导 AI 提取特定字段
 *   - 解析 AI 返回的 JSON 并做字段补全
 * 【依赖】Google Gemini API（需在 Supabase Secrets 中配置 GEMINI_API_KEY）
 * 【变更日志】2026-03-01 - 从 OpenAI GPT-4o 切换为 Gemini 2.0 Flash（免费额度）
 *
 * 部署方式：
 *   1. 获取 Gemini API Key: https://aistudio.google.com/apikey
 *   2. 安装 Supabase CLI: npm i -g supabase
 *   3. supabase login
 *   4. supabase link --project-ref psfsxrwxfgdprbmcbgpw
 *   5. supabase secrets set GEMINI_API_KEY=你的Key
 *   6. supabase functions deploy parse-deal-image
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const EXTRACTION_PROMPT = `你是一个专业的优惠活动信息提取助手。请从这张优惠活动截图中识别并提取信息。

请严格按照以下 JSON 格式返回（不要返回任何其他内容，不要用 markdown 代码块包裹）：
{
  "merchantName": "商家名称",
  "title": "优惠标题/活动名称",
  "platform": "来源平台（美团/抖音/招商银行/建设银行/工商银行/交通银行/中信银行/支付宝/小程序 等）",
  "discountType": "优惠类型",
  "discountValue": 0,
  "thresholdAmount": 0,
  "price": 0,
  "originalPrice": 0,
  "conditions": "使用条件",
  "validFrom": "2026-01-01",
  "validTo": "2026-12-31",
  "confidence": 0.9
}

规则：
1. discountType 只能是 GROUP_BUY（团购套餐）/ FULL_REDUCE（满减）/ PERCENTAGE（折扣）/ VOUCHER（代金券）之一
2. 团购套餐：price=团购价，originalPrice=门市价，discountValue=0
3. 满减：thresholdAmount=满X元，discountValue=减Y元，price和originalPrice=0
4. 折扣：discountValue=折扣值（如0.85代表85折），price和originalPrice=0
5. 日期无法识别时，validFrom填今天，validTo填3个月后
6. confidence根据识别把握程度填0~1
7. 无法识别的数字字段填0，文字字段填空字符串
8. 只返回纯JSON，不要任何额外文字`

serve(async (req: Request) => {
    // CORS
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
        if (!GEMINI_API_KEY) {
            return new Response(
                JSON.stringify({ error: '服务端未配置 GEMINI_API_KEY，请参照部署说明配置' }),
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

        // 调用 Gemini API
        const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: EXTRACTION_PROMPT },
                        {
                            inline_data: {
                                mime_type: mimeType || 'image/jpeg',
                                data: image
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 1000,
                    responseMimeType: 'application/json'
                }
            })
        })

        if (!geminiRes.ok) {
            const errText = await geminiRes.text()
            console.error('[parse-deal-image] Gemini API 错误:', errText)
            return new Response(
                JSON.stringify({ error: 'AI 识别服务异常，请稍后重试' }),
                { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
            )
        }

        const geminiData = await geminiRes.json()
        const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

        // 解析 JSON
        let parsed
        try {
            parsed = JSON.parse(content)
        } catch {
            // 尝试从 markdown 代码块中提取
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[1].trim())
            } else {
                console.error('[parse-deal-image] 无法解析返回内容:', content)
                throw new Error('AI 返回内容无法解析')
            }
        }

        // 补全缺失字段
        const today = new Date().toISOString().split('T')[0]
        const threeMonthsLater = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]

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
            validFrom: parsed.validFrom || today,
            validTo: parsed.validTo || threeMonthsLater,
            confidence: Number(parsed.confidence) || 0.5
        }

        return new Response(
            JSON.stringify(result),
            { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '服务异常'
        console.error('[parse-deal-image] 处理异常:', message)
        return new Response(
            JSON.stringify({ error: message }),
            { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
    }
})
