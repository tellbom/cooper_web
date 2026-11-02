import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

if (!process.env.COOPER_TEST_USER || !process.env.COOPER_TEST_PASSWORD) throw new Error('Provide local test credentials through the environment.')
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const context = await browser.newContext({ viewport: { width: 1366, height: 900 } }), page = await context.newPage()
const checks = [], errors = [], out = path.resolve('.tmp/portal-qa')
fs.mkdirSync(out, { recursive: true })
page.on('pageerror', error => errors.push(error.message))
const ok = (value, label) => { assert.ok(value, label); checks.push(label); console.log('PASS', label) }
async function navigate(id, position, extra = {}) {
    await page.evaluate(async ({ id, position, extra }) => {
        const router = document.querySelector('#app').__vue_app__.config.globalProperties.$router
        await router.push({ path: '/cooper/news/detail', query: { id, ...(position ? { position } : {}), ...extra } })
    }, { id, position, extra })
}
async function neighbors(previous, next) {
    await page.locator('.article-siblings a').first().waitFor()
    await page.waitForFunction(({ previous, next }) => {
        const links = [...document.querySelectorAll('.article-siblings a')].map(a => new URL(a.href).searchParams.get('id'))
        return JSON.stringify(links) === JSON.stringify([previous, next].filter(Boolean))
    }, { previous, next })
}
try {
    await page.goto('http://localhost:1919/cooper/home')
    await page.locator('.portal-home,#username').first().waitFor({ timeout: 35000 })
    if (page.url().includes('/protocol/openid-connect/auth')) {
        await page.locator('#username').fill(process.env.COOPER_TEST_USER)
        await page.locator('#password').fill(process.env.COOPER_TEST_PASSWORD)
        await page.locator('#kc-login').click()
    }
    await page.waitForURL('**/cooper/home', { timeout: 45000 })
    await page.locator('.portal-home').waitFor()
    await page.locator('.news-thumbnails button').first().waitFor()
    await page.evaluate(async () => {
        const { USE_MOCK } = await import('/src/features/cooper/http.ts')
        if (!USE_MOCK) throw new Error('This test requires the delayed business Mock.')
        const { channelNews } = await import('/src/features/cooper/mock.ts')
        const base = channelNews[11][0]
        for (const channel of [11, 12]) channelNews[channel] = Array.from({ length: 120 }, (_, i) => ({
            ...base, Id: `pagination${channel}-${i + 1}`, Title: `分页验收新闻 ${i + 1}`, ChannelID: String(channel),
            Content: `<p>来自分页接口的第 ${i + 1} 条测试新闻。</p>`, Cover: '', isImage: false,
        }))
        const router = document.querySelector('#app').__vue_app__.config.globalProperties.$router
        await router.push({ path: '/cooper/news', query: { channel: 11, page: 7 } })
    })
    await page.waitForURL('**/cooper/news?channel=11&page=7')
    const item = page.locator('.news-list-row').filter({ hasText: '分页验收新闻 51' })
    await item.waitFor()
    ok(new URL(await item.getAttribute('href'), page.url()).searchParams.get('position') === '51', 'list pagination passes the absolute item position as a hint')
    await item.click(); await neighbors('pagination11-50', 'pagination11-52')
    ok(true, 'opening the 51st article provides both real neighbors')
    await page.locator('.article-siblings a').filter({ hasText: '上一篇' }).click()
    await neighbors('pagination11-49', 'pagination11-51')
    ok(true, 'previous crosses from item 51 to item 50 without losing the next page')
    await navigate('pagination11-100', 100); await neighbors('pagination11-99', 'pagination11-101')
    ok(true, 'the 100th article resolves its next item on page 3')
    await page.locator('.article-siblings a').filter({ hasText: '下一篇' }).click()
    await neighbors('pagination11-100', 'pagination11-102')
    ok(true, 'the 101st article links back to item 100')
    await page.screenshot({ path: path.join(out, 'news-pagination-boundary.png'), fullPage: true })
    await navigate('pagination11-120', 120); await neighbors('pagination11-119', null)
    ok((await page.locator('.article-siblings').innerText()).includes('已是最后一篇'), 'the actual last article has the terminal label')
    await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/cooper/news'))
    await page.locator('.news-list-page').waitFor()
    await navigate('pagination11-101'); await neighbors('pagination11-100', 'pagination11-102')
    ok(true, 'a fresh detail component locates a deep-linked item without a position hint')
    await navigate('pagination12-51', 51, { mockError: '/api/app/news-center/get-context' })
    await page.locator('.article-siblings [role=alert]').waitFor()
    ok(!/已是第一篇|已是最后一篇/.test(await page.locator('.article-siblings').innerText()), 'a failed page request shows retry instead of false first/last labels')
    await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$router.replace({ query: { id: 'pagination12-51', position: 51 } }))
    await page.locator('.article-siblings button').click()
    await page.locator('.article-siblings [role=status]').waitFor()
    ok(!/已是第一篇|已是最后一篇/.test(await page.locator('.article-siblings').innerText()), 'slow adjacent-page loading has its own pending state')
    await neighbors('pagination12-50', 'pagination12-52')
    ok(true, 'retry retrieves the real adjacent items after a page failure')
    ok(errors.length === 0, 'no browser runtime errors')
    fs.writeFileSync(path.join(out, 'news-pagination-result.json'), JSON.stringify({ passed: checks.length, checks, errors, node: process.version }, null, 2))
} catch (error) {
    await page.screenshot({ path: path.join(out, 'news-pagination-failure.png') }).catch(() => {})
    throw error
} finally { await browser.close() }
