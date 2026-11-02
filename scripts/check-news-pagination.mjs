import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
let checks = 0
const ok = (condition, label) => { assert.ok(condition, label); checks++ }
try {
    const { createNewsPager } = await server.ssrLoadModule('/src/features/cooper/newsPaging.ts')
    const rows = Array.from({ length: 120 }, (_, i) => ({ Id: `news-${i + 1}`, Title: `News ${i + 1}` }))
    const calls = []
    let failPage = 0
    const pager = createNewsPager(async (channel, page, limit) => {
        calls.push({ channel, page, limit })
        if (page === failPage) throw new Error('controlled network failure')
        return { arr: rows.slice((page - 1) * limit, page * limit), count: rows.length }
    })
    let result = await pager.neighbors(11, 'news-50', 50)
    ok(result.previous.Id === 'news-49' && result.next.Id === 'news-51', '50th article gets its next item from page 2')
    ok(JSON.stringify(calls.map(c => c.page)) === '[1,2]' && calls.every(c => c.limit === 50), 'page numbers and bounded limits match the documented API')
    result = await pager.neighbors(11, 'news-51', 51)
    ok(result.previous.Id === 'news-50' && result.next.Id === 'news-52' && calls.length === 2, '51st article reuses cached pages and links back across the boundary')
    result = await pager.neighbors(11, 'news-100', 100)
    ok(result.next.Id === 'news-101' && calls.length === 3, '100th article loads page 3 only when needed')
    result = await pager.neighbors(11, 'news-101', 101)
    ok(result.previous.Id === 'news-100' && result.next.Id === 'news-102' && calls.length === 3, '101st article preserves both neighbors without duplicate requests')
    result = await pager.neighbors(11, 'news-120', 120)
    ok(result.next === null && result.previous.Id === 'news-119', 'only the actual final item has no next article')
    result = await pager.neighbors(11, 'news-1', 1)
    ok(result.previous === null && result.next.Id === 'news-2', 'only the actual first item has no previous article')
    pager.clear(); calls.length = 0
    result = await pager.neighbors(11, 'news-101')
    ok(result.position === 101 && calls.length === 3, 'direct deep links without a position locate the item by paged queries')
    pager.clear(); calls.length = 0
    result = await pager.neighbors(11, 'news-51', 1)
    ok(result.position === 51 && calls.length === 2, 'an outdated position hint falls back to locating the actual item')
    await assert.rejects(() => pager.neighbors(11, 'deleted-news'), /不在频道列表/); checks++
    pager.clear(); failPage = 2
    await assert.rejects(() => pager.neighbors(11, 'news-50', 50), /network failure/); checks++
    failPage = 0
    result = await pager.neighbors(11, 'news-50', 50)
    ok(result.next.Id === 'news-51', 'a failed adjacent page can be retried without a false terminal state')
    const before = calls.length
    await pager.neighbors(12, 'news-51', 51)
    ok(calls.length === before + 2 && calls.slice(-2).every(c => c.channel === 12), 'cached pages are isolated by channel')
    let active = true
    const cancelled = createNewsPager(async () => { active = false; return { arr: rows.slice(0, 50), count: 120 } })
    ok(await cancelled.neighbors(11, 'news-101', undefined, () => active) === null, 'a stale navigation stops paging')
    const empty = createNewsPager(async () => ({ arr: [], count: 0 }))
    await assert.rejects(() => empty.neighbors(11, 'news-1'), /不在频道列表/); checks++
    const exact = createNewsPager(async (channel, page, limit) => ({ arr: rows.slice(0, 100).slice((page - 1) * limit, page * limit), count: 100 }))
    result = await exact.neighbors(11, 'news-100', 100)
    ok(result.next === null && result.previous.Id === 'news-99', 'a full last page respects count instead of fetching a nonexistent next page')
    const broken = createNewsPager(async () => ({ arr: rows.slice(0, 50), count: 120 }))
    await assert.rejects(() => broken.neighbors(11, 'news-101'), /不在频道列表/); checks++
    console.log(`News pagination checks passed: ${checks}`)
} finally { await server.close() }
