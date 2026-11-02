export function safeLink(raw: string) {
    if (!raw?.trim() || raw.trim().startsWith('#')) return undefined
    try {
        const url = new URL(raw, window.location.origin)
        return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined
    } catch {
        return undefined
    }
}
export const newsLink = (id: string, position?: number) => ({ path: '/cooper/news/detail', query: { id, ...(position ? { position } : {}) } })
export function officeLink(raw: string) {
    const base=import.meta.env.VITE_COOPER_PUBLIC_URL as string|undefined
    const source=raw.startsWith('/mock-assets/')&&base ? new URL(raw,base).href : raw
    const url = safeLink(source)
    if (!url) return undefined
    const file = new URL(url)
    const extension = file.pathname.split('.').pop()?.toLowerCase()
    if (extension && ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'pdf', 'rtf', 'txt', 'csv'].includes(extension))
        return { path: '/preview/office', query: { url, title: decodeURIComponent(file.pathname.split('/').pop() || '文档'), fileType: extension } }
    return undefined
}
