import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

if (!process.env.COOPER_ONLY_PRODUCTION && (!process.env.COOPER_TEST_USER || !process.env.COOPER_TEST_PASSWORD)) throw new Error('Provide local test credentials through the environment.')
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } }), page = await context.newPage()
const checks = [], errors = [], out = path.resolve('.tmp/portal-qa')
let productionPage
fs.mkdirSync(out, { recursive: true })
context.on('page', p => p.on('pageerror', e => errors.push(e.message)))
page.on('pageerror', e => errors.push(e.message))
const ok = (value, label) => { assert.ok(value, label); checks.push(label); console.log('PASS', label) }
const closeDialog = async selector => { await page.locator(selector + ' .el-dialog__headerbtn').click(); await page.locator(selector).waitFor({ state: 'hidden' }) }
try {
    if (!process.env.COOPER_ONLY_PRODUCTION) {
    await page.goto('http://localhost:1919/cooper/home')
    await page.locator('.portal-home,#username').first().waitFor({ timeout: 35000 })
    if (page.url().includes('/protocol/openid-connect/auth')) {
        await page.locator('#username').fill(process.env.COOPER_TEST_USER)
        await page.locator('#password').fill(process.env.COOPER_TEST_PASSWORD)
        await page.locator('#kc-login').click()
    }
    await page.waitForURL('**/cooper/home', { timeout: 25000 })
    await page.locator('.news-thumbnails button').first().waitFor()
    const photos = await page.evaluate(() => ({
        carousel: [...document.querySelectorAll('.photo-hero [data-news-id]')].map(n => n.dataset.newsId),
        thumbnails: [...document.querySelectorAll('.news-thumbnails [data-news-id]')].map(n => n.dataset.newsId),
    }))
    ok(photos.carousel.length === 4 && photos.thumbnails.length === 3 && new Set([...photos.carousel, ...photos.thumbnails]).size === 7, 'four carousel photos and three separate thumbnails use seven unique API records')
    await page.getByRole('tab', { name: '我的日程', exact: true }).click()
    await page.locator('.week-strip button').nth(4).click()
    await page.locator('.week-strip button.active').hover()
    ok(await page.locator('.week-strip button.active b').evaluate(el => getComputedStyle(el).color === 'rgb(255, 255, 255)'), 'selected calendar day keeps white text on blue while hovered')
    await page.screenshot({ animations: 'disabled', path: path.join(out, 'data-calendar-hover.png') })
    await page.getByRole('button', { name: '全部应用', exact: false }).click()
    await page.locator('.application-copy').first().waitFor()
    const cards = await page.locator('.application-cards > div').evaluateAll(cards => cards.map(card => {
        const copy = card.querySelector('.application-copy').getBoundingClientRect(), action = card.querySelector('.application-toggle').getBoundingClientRect()
        return { copyWidth: copy.width, separate: action.top >= copy.bottom - 1, titleHeight: card.querySelector('b').getBoundingClientRect().height }
    }))
    ok(cards.every(c => c.copyWidth >= 85 && c.separate && c.titleHeight <= 25), 'application descriptions have readable width and actions occupy a separate row')
    await page.screenshot({ animations: 'disabled', path: path.join(out, 'data-app-center.png') })
    await closeDialog('.systems-dialog')
    await page.locator('.bell-button .el-badge__content').waitFor()
    const counts = await page.evaluate(async () => {
        const api = await import('/src/features/cooper/api.ts'), { useAdminInfo } = await import('/src/stores/adminInfo.ts')
        const [tasks, messages] = await Promise.all([api.mytodo(useAdminInfo().userid), api.myMessages()])
        return { tasks: tasks.length, messages: messages.length }
    })
    ok(Number(await page.locator('.bell-button .el-badge__content').innerText()) === counts.tasks + counts.messages && !await page.locator('.bell-button i').count(), 'bell displays the computed task/message sum without the old dot or icon selector collision')
    await context.route('**://cooper-flow.test/**', route => route.fulfill({ contentType: 'text/html', body: '<p>Flow destination</p>' }))
    await context.route('**://cooper-message.test/**', route => route.fulfill({ contentType: 'text/html', body: '<p>Message destination</p>' }))
    await page.evaluate(async () => {
        const { inboxNavigation } = await import('/src/features/cooper/navigation.ts')
        Object.assign(inboxNavigation, { processCenter: 'http://cooper-flow.test/', processTask: 'http://cooper-flow.test/task/{taskId}?business={businessId}', messageCenter: 'http://cooper-message.test/' })
    })
    await page.locator('.bell-button').click()
    await page.locator('.portal-inbox:visible .portal-skeleton').waitFor({ state: 'hidden' })
    await page.locator('.portal-inbox:visible .inbox-list .el-button').first().waitFor()
    const aligned = await page.locator('.portal-inbox:visible .inbox-list li').evaluateAll(rows => rows.map(row => {
        const copy = row.querySelector('.inbox-item-copy').getBoundingClientRect(), action = row.querySelector('button').getBoundingClientRect()
        return { actionX: action.x, gap: action.x - copy.right }
    }))
    ok(aligned.length === counts.tasks && aligned.every(r => r.gap >= 15 && Math.abs(r.actionX - aligned[0].actionX) < 1), 'inbox title, metadata and action columns align consistently')
    await page.screenshot({ animations: 'disabled', path: path.join(out, 'data-inbox.png') })
    const taskPopupPromise = page.waitForEvent('popup')
    await page.locator('.portal-inbox:visible .inbox-list .el-button').first().click()
    const taskPopup = await taskPopupPromise
    await taskPopup.waitForURL('http://cooper-flow.test/task/t0?business=b0'); await taskPopup.close()
    ok(true, 'task action expands configured taskId and businessId and opens the process center')
    await page.locator('.bell-button').click()
    await page.locator('.portal-inbox:visible').getByRole('tab', { name: /消息中心/ }).click()
    await page.locator('.portal-inbox:visible .inbox-list li').first().waitFor()
    ok(await page.locator('.portal-inbox:visible .inbox-footer a').getAttribute('href') === 'http://cooper-message.test/', 'message-center destination follows the separate UI configuration')
    const messagePopupPromise = page.waitForEvent('popup')
    await page.getByRole('button', { name: '打开消息', exact: false }).first().click()
    const messagePopup = await messagePopupPromise
    await messagePopup.waitForURL('**/preview/notice?id=ann-0'); await messagePopup.locator('.official-paper h1').waitFor(); await messagePopup.close()
    await page.waitForFunction(expected => document.querySelector('.bell-button .el-badge__content')?.textContent === String(expected), counts.tasks + counts.messages - 1)
    ok(true, 'message url opens its destination and read acknowledgement updates the numeric badge')
    await page.locator('.bell-button').click()
    await page.getByRole('button', { name: '查看详情', exact: true }).first().waitFor()
    const messageBody = await page.locator('.portal-inbox:visible .inbox-item-copy b').first().getAttribute('title')
    await page.getByRole('button', { name: '查看详情', exact: true }).first().click()
    await page.locator('.message-detail-body').waitFor()
    ok(await page.locator('.message-detail-body').innerText() === messageBody, 'message without a url opens the complete API message body in a dialog')
    await page.screenshot({ animations: 'disabled', path: path.join(out, 'data-message-detail.png') }); await closeDialog('.inbox-detail-dialog')
    await page.locator('.fault-card .fault-row').first().waitFor()
    const dto = await page.evaluate(async () => {
        const api = await import('/src/features/cooper/api.ts')
        return { faults: await api.getFaultTableMessageapi(), manufacture: await api.getZZPWTMessageapi(), work: await api.getHotwork({ pageNo: 1, pageSize: 20 }) }
    })
    ok(await page.locator('.fault-card .fault-row b').first().innerText() === dto.faults[0].SMBC && await page.locator('.fault-card .fault-row p').first().innerText() === dto.faults[0].SS_GZNR, 'lower-right equipment panel uses SMBC and SS_GZNR from the fault list API')
    await page.locator('.fault-home-tabs').getByText('制造问题', { exact: true }).click()
    await page.locator('.fault-card .fault-row').first().waitFor()
    ok((await page.locator('.fault-card .fault-row b').first().innerText()).includes(dto.manufacture[0].LJTH), 'lower-right manufacturing panel renders the part drawing number from its own API')
    await page.locator('.fault-card .fault-row').first().click()
    await page.locator('.fault-dialog .el-table__body-wrapper').waitFor()
    ok((await page.locator('.fault-dialog').innerText()).includes('零件图号') && !(await page.locator('.fault-dialog').innerText()).includes('累计台数'), 'manufacturing dialog labels LJTH as a part drawing number')
    const selected = page.locator('.fault-state-cards button.selected'), before = await selected.evaluate(el => getComputedStyle(el).color)
    await selected.hover()
    ok(await selected.evaluate(el => getComputedStyle(el).color) === before, 'selected state filters also retain their colors while hovered')
    await closeDialog('.fault-dialog')
    ok((await page.locator('.tech-card').innerText()).includes('危险作业') && await page.locator('.tech-card .work-row b').first().innerText() === dto.work.list[0].workType && await page.locator('.tech-card .work-row p').first().innerText() === dto.work.list[0].hazardousWorkArea, 'hazardous work uses workType and hazardousWorkArea without project descriptions')
    let notice = context.pages().find(p => p.url().includes('/notice-popup'))
    if (!notice && await page.locator('.notice-launch button').isVisible()) { await page.locator('.notice-launch button').click(); notice = await page.waitForEvent('popup') }
    assert.ok(notice)
    await notice.locator('.official-body p').first().waitFor()
    const geometry = await notice.evaluate(() => ({ width: innerWidth, height: innerHeight, font: getComputedStyle(document.querySelector('.official-body')).fontSize, title: getComputedStyle(document.querySelector('.official-paper h1')).fontSize }))
    ok(geometry.width === 500 && geometry.height === 500 && geometry.font === '20px' && geometry.title === '26px', 'announcement opens at 500 by 500 with 20px body and 26px red title')
    await notice.screenshot({ animations: 'disabled', path: path.join(out, 'data-notice-readable.png') })
    }

    if (process.env.COOPER_PRODUCTION_URL) {
        const origin = process.env.COOPER_PRODUCTION_URL
        const state = process.env.COOPER_AUTH_STATE_PATH ? JSON.parse(fs.readFileSync(process.env.COOPER_AUTH_STATE_PATH, 'utf8')) : await context.storageState()
        const production = await browser.newContext({ storageState: state, viewport: { width: 1920, height: 1080 } })
        const live = await production.newPage(), requests = []
        productionPage = live
        live.on('pageerror', e => errors.push(e.message))
        let empty = false, failed = false, malformed = false
        const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
        const envelope = data => ({ code: 1, data, arr: [], count: 0 })
        await production.route('**/cooperRouter/**', async route => {
            const url = new URL(route.request().url()); requests.push(url.pathname)
            if (url.pathname.endsWith('/events/stream')) return route.abort()
            if (failed) return json(route, { message: '受控接口失败' }, 503)
            if (url.pathname.endsWith('/customization/index')) return json(route, envelope({ list: [] }))
            if (url.pathname.endsWith('/personal/common-system-show-list')) return json(route, empty ? [] : [{ Id: 'http-only-system', Name: '正式接口探针', Details: '来自真实 HTTP 传输的受控响应', Icon: '', JumpLink: '/cooper/home' }])
            if (url.pathname.endsWith('/news-center')) return json(route, envelope([]))
            if (url.pathname.endsWith('/on-duty/get-list')) return json(route, envelope({ list: [], total: 0, columns: [], remark: '' }))
            if (url.pathname.endsWith('/hot-work')) return json(route, envelope({ list: [], total: 0 }))
            if (url.pathname.endsWith('/get-fault-table-message')) return json(route, { list: malformed ? [{ SBMC: '旧字段', GS_GZNR: '错误映射' }] : empty ? [] : [{ SMBC: 'HTTP设备探针', SS_GZNR: '接口故障说明', GZFS_SJ: '2026-11-01T09:00:00', State: '未响应' }] })
            if (url.pathname.endsWith('/get-zZPWTMessage')) return json(route, { list: empty ? [] : [{ JX: 'HTTP机型', LJTH: 'PART-HTTP-001', DQZT: '待处理', TCSJ: '2026-11-01', ZRXM: '接口责任人' }] })
            if (url.pathname.endsWith('/honor')) return json(route, envelope([]))
            return json(route, [])
        })
        await production.route('**/newOARouter/**', route => json(route, envelope([])))
        await production.route('**/processRouter/**', route => json(route, { data: { items: [] } }))
        await production.route('**/MessageCenter/**', route => json(route, { items: [] }))
        await live.goto(origin + '/cooper/home'); await live.getByText('正式接口探针', { exact: true }).waitFor({ timeout: 30000 }).catch(async error => { console.error('Production path:', new URL(live.url()).pathname, 'business requests:', requests.length, 'state:', await live.locator('.portal-home').count()); throw error })
        ok(requests.includes('/cooperRouter/api/app/fault/get-fault-table-message') && requests.includes('/cooperRouter/api/app/z-zPWT/get-zZPWTMessage') && (await live.locator('.fault-card').innerText()).includes('HTTP设备探针'), 'Mock-off production bundle requests exact documented HTTP paths and renders only the intercepted API records')
        await live.locator('.fault-home-tabs').getByText('制造问题', { exact: true }).click()
        ok((await live.locator('.fault-card').innerText()).includes('PART-HTTP-001'), 'Mock-off manufacturing adapter reads list responses and preserves the part drawing number')
        empty = true; await live.reload(); await live.locator('.systems-card .system-grid').waitFor(); await live.locator('.fault-card').getByText('暂无数据', { exact: true }).waitFor()
        ok(!await live.locator('.fault-row,.work-row,.honor-item,.system-grid a,.news-thumbnails button').count() && !(await live.locator('.portal-home').innerText()).includes('OA办公'), 'empty HTTP responses leave empty panels without demo business records')
        malformed = true; empty = false; await live.reload(); await live.locator('.fault-card [role="alert"]').waitFor()
        ok((await live.locator('.fault-card').innerText()).includes('接口约定不一致') && !await live.locator('.fault-row').count(), 'wrong backend field names produce an explicit mapping error instead of blank or invented records')
        malformed = false; failed = true; await live.reload(); await live.locator('.fault-card [role="alert"]').waitFor()
        ok((await live.locator('.fault-card').innerText()).includes('受控接口失败') && !await live.locator('.fault-row').count(), 'failed HTTP requests show an error instead of a Mock fallback')
        await production.close()
    }
    ok(errors.length === 0, 'no runtime errors in the repaired flows')
    fs.writeFileSync(path.join(out, process.env.COOPER_ONLY_PRODUCTION ? 'production-boundaries-result.json' : 'data-boundaries-result.json'), JSON.stringify({ passed: checks.length, checks, errors, node: process.version }, null, 2))
} catch (error) {
    if (productionPage && !productionPage.isClosed()) await productionPage.screenshot({ path: path.join(out, 'production-boundary-failure.png') }).catch(() => {})
    await page.screenshot({ animations: 'disabled', path: path.join(out, 'data-boundaries-failure.png') })
    for (const p of context.pages()) { if (p.url().includes('/notice-popup')) { await p.screenshot({ path: path.join(out, 'data-notice-failure.png') }).catch(() => {}); console.error('Announcement document count:', await p.locator('.official-paper').count()) } }
    console.error('FAILED AFTER', checks.length, 'checks'); throw error
} finally { await browser.close() }
