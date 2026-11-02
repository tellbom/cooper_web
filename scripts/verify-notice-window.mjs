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
async function popupWindow() {
    await page.waitForTimeout(1800)
    if (await page.locator('.notice-launch button').isVisible()) await page.locator('.notice-launch button').click()
    const popup = context.pages().find(p => p.url().includes('/notice-popup'))
    assert.ok(popup, 'independent announcement window')
    await popup.locator('.official-paper h1').first().waitFor({ timeout: 20000 })
    return popup
}
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
    const popup = await popupWindow()
    const geometry = await popup.evaluate(() => ({
        width: innerWidth, height: innerHeight,
        font: getComputedStyle(document.querySelector('.official-body')).fontSize,
        title: getComputedStyle(document.querySelector('.official-paper h1')).fontSize,
        signature: getComputedStyle(document.querySelector('.official-paper footer')).fontSize,
        overflow: document.documentElement.scrollWidth > innerWidth,
    }))
    ok(geometry.width === 500 && geometry.height === 500, 'announcement window opens at 500 by 500')
    ok(geometry.font === '20px' && geometry.signature === '20px' && geometry.title === '26px' && !geometry.overflow, 'larger text remains readable without horizontal page overflow')
    const apiRows = await popup.evaluate(async () => (await import('/src/features/cooper/api.ts')).getPopupnoticeapi())
    ok(apiRows.length === 3 && await popup.locator('.official-paper').count() === apiRows.length, 'all announcements returned by the popup API are rendered together')
    ok(!await popup.locator('.notice-read,.notice-window-actions,nav').count() && !/(已阅|下一条|我已阅读)/.test(await popup.locator('body').innerText()), 'no reading confirmation, pagination or sidebar')
    ok(await popup.locator('.notice-window-scroll').evaluate(el => el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY === 'auto'), 'one vertical scroll area for the full documents')
    await popup.screenshot({ path: path.join(out, 'notice-scroll.png') })
    await popup.locator('.notice-window-scroll').evaluate(el => el.scrollTop = el.scrollHeight)
    ok(await popup.locator('.official-paper').last().evaluate(el => el.getBoundingClientRect().bottom <= innerHeight + 1), 'scrolling reaches the final announcement and signature')

    const pinned = await popup.evaluate(async () => {
        const { notices } = await import('/src/features/cooper/mock.ts')
        const { useAdminInfo } = await import('/src/stores/adminInfo.ts')
        const { portalEvents } = await import('/src/features/cooper/realtime.ts')
        const key = `cooper:notice-seen:${useAdminInfo().userid}`
        const cached = JSON.stringify(notices.map(n => n.Id + ':' + n.CreateTime))
        localStorage.setItem(key, cached)
        notices[0].IsTop = 0; notices[1].IsTop = 0; notices[2].IsTop = 1
        notices[2].IsTopTime = '2000-01-01T00:00:00'
        portalEvents.emit('notice')
        return { id: notices[2].Id, key, cached, rest: [notices[0].Id, notices[1].Id] }
    })
    await popup.waitForFunction(id => document.querySelector('.official-paper')?.getAttribute('data-notice-id') === id, pinned.id)
    ok(await popup.locator('.official-paper').count() === apiRows.length && await popup.locator('.official-paper').first().locator('.notice-pin').innerText() === '置顶', 'IsTop moves a notice first despite legacy read cache or an undocumented IsTopTime value')
    const order = await popup.locator('.official-paper').evaluateAll(nodes => nodes.map(el => el.getAttribute('data-notice-id')))
    ok(JSON.stringify(order.slice(1)) === JSON.stringify(pinned.rest), 'notices with equal pin priority retain API order')
    await popup.locator('.notice-window-scroll').evaluate(el => el.scrollTop = 0)
    await popup.screenshot({ path: path.join(out, 'notice-scroll-pinned.png') })

    const second = await context.newPage()
    await second.goto('http://localhost:1919/cooper/home'); await second.locator('.portal-home').waitFor()
    await page.evaluate(() => { const iframe = document.createElement('iframe'); iframe.id = 'notice-child'; iframe.src = '/cooper/home'; iframe.style.display = 'none'; document.body.append(iframe) })
    await page.frameLocator('#notice-child').locator('.portal-home').waitFor({ state: 'attached' })
    await page.waitForTimeout(2600)
    ok(context.pages().filter(p => p.url().includes('/notice-popup')).length === 1, 'two parents and an iframe keep one independent announcement window')
    await popup.evaluate(async () => {
        const { notices } = await import('/src/features/cooper/mock.ts')
        notices[1].Title = '消息刷新后的公告标题'
    })
    await page.evaluate(async () => (await import('/src/features/cooper/realtime.ts')).portalEvents.emit('notice'))
    await popup.locator('.official-paper h1').filter({ hasText: '消息刷新后的公告标题' }).waitFor()
    ok(context.pages().filter(p => p.url().includes('/notice-popup')).length === 1 && await popup.locator('.official-paper').count() === apiRows.length, 'parent publish refreshes the existing announcement window')
    await popup.getByRole('button', { name: '关闭公告窗口', exact: true }).click()
    await page.waitForTimeout(4200)
    ok(popup.isClosed() && !context.pages().some(p => p.url().includes('/notice-popup')) && !await second.locator('.notice-launch').count(), 'closing the window does not cause a second parent to reopen it')
    ok(await page.evaluate(({ key, cached }) => localStorage.getItem(key) === cached, pinned), 'closing does not record or alter read status')
    await second.close()
    await page.reload(); await page.locator('.portal-home').waitFor()
    const reopened = await popupWindow()
    ok(await reopened.locator('.official-paper').count() === apiRows.length, 'reentering displays the popup API data even with old read-state cache')
    await reopened.close()
    ok(errors.length === 0, 'no browser runtime errors')
    fs.writeFileSync(path.join(out, 'notice-result.json'), JSON.stringify({ passed: checks.length, checks, errors, node: process.version }, null, 2))
} catch (error) {
    await page.screenshot({ path: path.join(out, 'notice-failure.png') })
    throw error
} finally { await browser.close() }
