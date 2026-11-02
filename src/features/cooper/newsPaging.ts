import type { NewsContextDto } from './types'

type Page = { arr: NewsContextDto[]; count: number }
type FetchPage = (channel: number, page: number, limit: number) => Promise<Page>

// Page is a page number, not the position of a news item. Keep requests bounded
// and reuse loaded pages while moving between articles in the same detail view.
export function createNewsPager(fetchPage: FetchPage) {
    const limit = 50
    const pages = new Map<string, Promise<Page>>()
    let generation = 0
    async function read(channel: number, page: number) {
        const key = `${channel}:${page}`
        let request = pages.get(key)
        if (!request) {
            request = fetchPage(channel, page, limit).then(result => {
                if (!Array.isArray(result.arr) || !Number.isInteger(result.count) || result.count < 0)
                    throw new Error('频道新闻分页数据格式不正确')
                return result
            }).catch(error => {
                if (pages.get(key) === request) pages.delete(key)
                throw error
            })
            pages.set(key, request)
        }
        return request
    }
    async function neighbors(channel: number, id: string, hint?: number, active = () => true) {
        const version = generation
        const isActive = () => version === generation && active()
        const first = await read(channel, 1)
        if (!isActive()) return null
        let total = first.count
        const hintedPage = hint && Number.isInteger(hint) && hint > 0 && hint <= total ? Math.ceil(hint / limit) : 1
        const visited = new Set<number>()
        let page = hintedPage
        while (isActive()) {
            visited.add(page)
            const result = await read(channel, page)
            if (!isActive()) return null
            total = result.count
            const index = result.arr.findIndex(item => item.Id === id)
            if (index >= 0) {
                const position = (page - 1) * limit + index + 1
                if (position > total) throw new Error('频道新闻列表已变化，请重新加载')
                let previous = result.arr[index - 1] || null
                let next = result.arr[index + 1] || null
                if (!previous && position > 1) previous = (await read(channel, page - 1)).arr[limit - 1] || null
                if (!isActive()) return null
                if (!next && position < total) next = (await read(channel, page + 1)).arr[0] || null
                if (!isActive()) return null
                if ((position > 1 && !previous) || (position < total && !next))
                    throw new Error('相邻新闻暂不可用，请重新加载')
                return {
                    previous, next, position,
                    related: first.arr.filter(item => item.Id !== id).slice(0, 5),
                }
            }
            page = 1
            while (visited.has(page)) page++
            if (page > Math.ceil(total / limit)) break
        }
        if (!isActive()) return null
        throw new Error('当前新闻不在频道列表中，请重新加载或返回新闻列表')
    }
    return { neighbors, clear: () => { generation++; pages.clear() } }
}
