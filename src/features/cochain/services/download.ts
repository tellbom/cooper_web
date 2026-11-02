import type { AxiosResponse } from 'axios'
import type { Result } from '../contracts'

const parseDownloadFileName = (disposition?: string): string | undefined => {
    const utf8 = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
    if (utf8) return decodeURIComponent(utf8)
    return disposition?.match(/filename="?([^";]+)"?/i)?.[1]
}

export const downloadBlobResponse = async (response: AxiosResponse<Blob>, fallbackName: string): Promise<void> => {
    const contentType = String(response.headers['content-type'] ?? '')
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: contentType })

    if (contentType.includes('application/json') || blob.type.includes('application/json')) {
        const error = JSON.parse(await blob.text()) as Result<unknown>
        throw new Error(error.message || '导出失败')
    }

    const fileName = parseDownloadFileName(response.headers['content-disposition']) ?? fallbackName
    const blobUrl = URL.createObjectURL(blob)
    try {
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        link.remove()
    } finally {
        URL.revokeObjectURL(blobUrl)
    }
}
