import type { Result } from '../contracts'

export const unwrap = <T>(result: Result<T>): T => {
    if (!result.success || result.code !== 200) throw new Error(result.message || `业务错误 ${result.code}`)
    return result.data
}

export const unwrapWithMessage = <T>(result: Result<T>): { data: T; message: string } => {
    if (!result.success || result.code !== 200) throw new Error(result.message || `业务错误 ${result.code}`)
    return { data: result.data, message: result.message || '' }
}
