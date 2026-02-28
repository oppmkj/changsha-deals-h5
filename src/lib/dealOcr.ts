/**
 * @module dealOcr.ts
 * @description AI 多模态识别优惠活动截图，提取结构化优惠数据
 * @features
 *   - 将截图转 Base64 后发送至 Supabase Edge Function
 *   - Edge Function 调用多模态 AI（如 OpenAI GPT-4o）提取字段
 *   - 返回预填表单所需的结构化 JSON
 * @dependencies supabase
 * @last_updated 2026-03-01 - 初始创建
 */

import { supabase } from './supabase'

/** AI 识别返回的结构化优惠数据 */
export interface ParsedDealData {
    /** 商家名称 */
    merchantName: string
    /** 优惠标题 */
    title: string
    /** 来源平台（美团/抖音/银行等） */
    platform: string
    /** 优惠类型 GROUP_BUY | FULL_REDUCE | PERCENTAGE | VOUCHER */
    discountType: string
    /** 折扣值（满减金额或折扣比例） */
    discountValue: number
    /** 满减门槛 */
    thresholdAmount: number
    /** 现价 */
    price: number
    /** 原价 */
    originalPrice: number
    /** 使用条件描述 */
    conditions: string
    /** 有效期开始（ISO 日期字符串） */
    validFrom: string
    /** 有效期结束（ISO 日期字符串） */
    validTo: string
    /** AI 识别置信度 0-1 */
    confidence: number
}

/**
 * 将图片文件转为 Base64 字符串
 */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result as string
            // 去掉 data:image/xxx;base64, 前缀
            const base64 = result.split(',')[1]
            resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

/**
 * 调用 AI 识别优惠截图
 * @param imageFile 用户上传的截图文件
 * @returns 结构化优惠数据
 */
export async function parseDealImage(imageFile: File): Promise<ParsedDealData> {
    const base64 = await fileToBase64(imageFile)
    const mimeType = imageFile.type || 'image/jpeg'

    // 调用 Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('parse-deal-image', {
        body: {
            image: base64,
            mimeType
        }
    })

    if (error) {
        console.error('[DealOCR] Edge Function 调用失败', error)
        throw new Error('AI 识别服务暂不可用，请手动填写')
    }

    if (!data || !data.title) {
        throw new Error('未能从图片中识别出有效的优惠信息')
    }

    return data as ParsedDealData
}
