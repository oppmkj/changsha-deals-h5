/**
 * 环境变量类型安全封装
 * 所有外部配置统一从此模块读取，禁止硬编码
 */

interface EnvConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  tencentMapKey: string
  isDev: boolean
  isProd: boolean
}

function getEnvVar(key: string): string {
  const value = import.meta.env[key]
  if (!value) {
    console.warn(`[ENV] 环境变量 ${key} 未配置，请检查 .env 文件`)
    return ''
  }
  return value as string
}

export const env: EnvConfig = {
  supabaseUrl: getEnvVar('VITE_SUPABASE_URL'),
  supabaseAnonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  tencentMapKey: getEnvVar('VITE_TENCENT_MAP_KEY'),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
}
