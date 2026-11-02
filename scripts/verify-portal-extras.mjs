import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

if (!process.env.COOPER_TEST_USER || !process.env.COOPER_TEST_PASSWORD) throw new Error('Set COOPER_TEST_USER and COOPER_TEST_PASSWORD locally.')
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } }), page = await context.newPage()
const out = path.resolve('.tmp/portal-qa'), checks = [], errors = []
fs.mkdirSync(out, { recursive: true })
context.on('page', p => p.on('pageerror', e => errors.push(e.message)))
page.on('pageerror', e => errors.push(e.message))
const ok = (value, name) => { assert.ok(value, name); checks.push(name); console.log('PASS', name) }
async function results() { await page.locator('.search-result').first().waitFor({ timeout: 20000 }) }
try {
    await page.goto('http://localhost:1919/cooper/home')
    await page.locator('.portal-home,#username').first().waitFor({ timeout: 35000 })
    if (page.url().includes('/protocol/openid-connect/auth')) {
        await page.locator('#username').fill(process.env.COOPER_TEST_USER)
        await page.locator('#password').fill(process.env.COOPER_TEST_PASSWORD)
        await page.locator('#kc-login').click()
    }
    await page.waitForURL('**/cooper/home', { timeout: 25000 })
    await page.locator('.portal-home').waitFor()
    await page.waitForTimeout(2500)
    if (await page.locator('.notice-launch button').isVisible()) await page.locator('.notice-launch button').click()
    const popup = context.pages().find(p => p.url().includes('/notice-popup'))
    assert.ok(popup, 'notice window exists')
    await popup.locator('.official-paper h1').first().waitFor()
    const second = await context.newPage()
    await second.goto('http://localhost:1919/cooper/home')
    await second.locator('.portal-home').waitFor()
    await page.evaluate(() => {
        const frame = document.createElement('iframe')
        frame.id = 'portal-child-check'; frame.src = '/cooper/home'; frame.style.display = 'none'; document.body.append(frame)
    })
    await page.frameLocator('#portal-child-check').locator('.portal-home').waitFor({ state: 'attached', timeout: 20000 })
    await page.waitForTimeout(2500)
    ok(context.pages().filter(p => p.url().includes('/notice-popup')).length === 1, 'one notice window with two parents and an iframe child')
    await popup.getByRole('button', { name: '关闭公告窗口', exact: true }).click()
    await second.waitForTimeout(4500)
    ok(!context.pages().some(p => p.url().includes('/notice-popup')) && !await second.locator('.notice-launch').count(), 'closing the shared window does not trigger another parent to reopen it')
    await second.close()
    await page.evaluate(() => document.querySelector('#portal-child-check').remove())

    await page.goto('http://localhost:1919/cooper/news')
    await page.locator('.news-list-lead').waitFor()
    const firstTitles = await page.locator('.news-list-row h3').allTextContents()
    await page.locator('.el-pagination .el-pager li').filter({ hasText: /^2$/ }).click()
    await page.waitForURL('**/cooper/news?**page=2**')
    await page.locator('.news-list-row').first().waitFor()
    ok(!await page.locator('.news-list-lead').count() && !(await page.locator('.news-list-row h3').allTextContents()).some(t => firstTitles.includes(t)), 'news pagination loads a distinct second page')
    await page.locator('.channel-rail button').getByText('基层动态', { exact: true }).click()
    await page.locator('.list-subheading h2').filter({ hasText: '基层动态' }).waitFor()
    await page.locator('.portal-skeleton').waitFor({ state: 'hidden' })
    ok(new URL(page.url()).searchParams.get('page') === '1', 'changing the news channel resets pagination')

    await page.goto('http://localhost:1919/cooper/search')
    await results()
    const before = await page.locator('.search-result>div>h3').allTextContents(), initialDays = await page.locator('.day-group').count()
    await page.getByRole('button', { name: '加载更早的日期', exact: true }).click()
    await page.waitForFunction(n => document.querySelectorAll('.day-group').length > n, initialDays)
    const after = await page.locator('.search-result>div>h3').allTextContents()
    ok(after.length > before.length && after.slice(0, before.length).every((t, i) => t === before[i]) && new Set(after).size === after.length, 'timeline appends older dates without replacing or repeating cards')
    await page.screenshot({ path: path.join(out, 'search-timeline.png'), fullPage: true })
    await page.locator('.search-filters .portal-segmented').first().getByText('公告', { exact: true }).click()
    await page.waitForURL(/[?&]type=/)
    await results()
    ok(await page.locator('.search-result').count() === await page.locator('.search-result.announcement').count() && new URL(page.url()).searchParams.get('type') === '公告', 'announcement filter resets the timeline and persists in the URL')
    await page.locator('.search-result').first().click()
    await page.locator('.search-reading-dialog .prose-news h3').first().waitFor()
    ok((await page.locator('.search-reading-dialog .prose-news').innerText()).includes('工作要求'), 'announcement body renders rich document structure')
    await page.locator('.search-reading-dialog .el-dialog__headerbtn').click()
    await page.locator('.search-reading-dialog').waitFor({ state: 'hidden' })
    await page.locator('.search-main-form input').fill('安全')
    await page.locator('.search-main-form input').press('Enter')
    await page.waitForURL(/[?&]q=/)
    await page.locator('.search-announcement-excerpt').first().waitFor()
    ok((await page.locator('.search-result>div>h3').first().innerText()).includes('安全'), 'keyword search switches API mode and returns matching announcements')
    await page.reload(); await results()
    ok(await page.locator('.search-main-form input').inputValue() === '安全' && await page.locator('.search-filters .is-active').first().innerText() === '公告', 'search filters and keyword restore after a page reload')
    await page.goto('http://localhost:1919/cooper/search?type=公告&range=自定义&from=2026-10-25&to=2026-10-27')
    await results()
    ok((await page.locator('.timeline-date small').allTextContents()).every(v => v === '2026年10月') && (await page.locator('.timeline-date strong').allTextContents()).every(v => Number(v) >= 25 && Number(v) <= 27), 'custom date bounds constrain results')
    await page.goto('http://localhost:1919/cooper/search?mockError=/api/search/day-grouped')
    await page.locator('.search-timeline [role=alert]').waitFor()
    await page.evaluate(() => history.replaceState(history.state, '', '/cooper/search'))
    await page.getByRole('button', { name: '重新加载', exact: true }).click()
    await results()
    ok(true, 'timeline retries a transient failed request')

    const safety = await page.evaluate(async () => {
        const { sanitizeHtml } = await import('/src/features/cooper/api.ts')
        const html = sanitizeHtml('<h3 style="text-align:center;color:red;font-weight:700;font-family:fantasy;position:fixed">公文标题</h3><p onclick="alert(1)">正文</p><script>alert(1)</script><a href="javascript:alert(1)">链接</a>')
        const doc = new DOMParser().parseFromString(html, 'text/html')
        return { centered: doc.querySelector('h3').style.textAlign === 'center', bold: doc.querySelector('h3').style.fontWeight === '700', unsafe: !!doc.querySelector('script,[onclick],[href^="javascript:"]'), family: doc.querySelector('h3').style.fontFamily, position: doc.querySelector('h3').style.position }
    })
    ok(safety.centered && safety.bold && !safety.unsafe && !safety.family && !safety.position, 'rich HTML preserves document alignment and emphasis while removing executable content')
    const stream = await page.evaluate(async () => {
        const { parseSseFrame, handlePublish, portalEvents } = await import('/src/features/cooper/realtime.ts')
        const parsed = parseSseFrame(': heartbeat\nevent: calendar.event.updated\ndata: {"id":\ndata: "a"}')
        let news = 0, notice = 0
        const onNews = () => news++, onNotice = () => notice++
        portalEvents.on('news', onNews); portalEvents.on('notice', onNotice)
        handlePublish('invalid'); handlePublish('{}'); handlePublish('{"id":"a"}')
        await new Promise(resolve => setTimeout(resolve, 400))
        portalEvents.off('news', onNews); portalEvents.off('notice', onNotice)
        return { parsed, news, notice }
    })
    ok(stream.parsed.event === 'calendar.event.updated' && stream.parsed.data === '{"id":\n"a"}' && stream.news === 1 && stream.notice === 1, 'SSE frame parsing and MQTT publish burst refresh coordination')
    await page.goto('http://localhost:1919/cooper/home?mockDelay=2500')
    await page.locator('.skeleton-news').waitFor()
    const geometry = await page.evaluate(() => {
        const circle = document.querySelector('.skeleton-table-row>.el-skeleton__circle').getBoundingClientRect()
        const hero = document.querySelector('.skeleton-photo>.el-skeleton__image').getBoundingClientRect()
        const card = document.querySelector('.skeleton-photo').getBoundingClientRect()
        const caption = document.querySelector('.skeleton-caption').getBoundingClientRect()
        return { circle: Math.abs(circle.width - circle.height), hero: Math.abs(hero.width - card.width), caption: caption.bottom <= card.bottom }
    })
    ok(geometry.circle < 1 && geometry.hero < 1 && geometry.caption, 'slow-loading skeleton has undistorted avatars and aligned image captions')
    await page.screenshot({ path: path.join(out, 'slow-loading.png') })
    await page.locator('.skeleton-news').waitFor({ state: 'hidden' })
    ok(errors.length === 0, 'no browser runtime errors in the follow-up flows')
    fs.writeFileSync(path.join(out, 'extras-result.json'), JSON.stringify({ checks, passed: checks.length, errors }, null, 2))
    console.log(`Additional browser checks passed: ${checks.length}`)
} catch (error) {
    await page.screenshot({ path: path.join(out, 'extras-failure.png') })
    console.error('FAILED AT', checks.length, page.url())
    throw error
} finally { await browser.close() }
