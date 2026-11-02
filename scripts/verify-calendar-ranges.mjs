import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

if (!process.env.COOPER_TEST_USER || !process.env.COOPER_TEST_PASSWORD) throw new Error('Provide local test credentials.')
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Asia/Shanghai' }), page = await context.newPage()
const out = path.resolve('.tmp/portal-qa'), checks = [], errors = []
fs.mkdirSync(out, { recursive: true })
page.on('pageerror', e => errors.push(e.message))
const ok = (value, label) => { assert.ok(value, label); checks.push(label); console.log('PASS', label) }
const save = () => page.locator('.event-form-dialog').getByRole('button', { name: '保存日程', exact: true })
async function setRange(start, end) {
    const inputs = page.locator('.event-range-picker .el-range-input')
    await inputs.nth(0).fill(start); await inputs.nth(1).fill(end); await inputs.nth(1).press('Enter')
    await page.locator('.event-subject-field .el-form-item__label').click()
}
async function record(title) {
    return page.evaluate(async title => {
        const api = await import('/src/features/cooper/api.ts')
        return (await api.listCalendarEvents('2026-11-01T00:00:00+08:00', '2027-02-01T00:00:00+08:00')).find(e => e.title === title)
    }, title)
}
async function day(date) {
    for (let i = 0; i < 65; i++) {
        const first = await page.locator('.week-strip button').first().getAttribute('aria-label'), last = await page.locator('.week-strip button').last().getAttribute('aria-label')
        if (date >= first && date <= last) { await page.locator(`.week-strip button[aria-label="${date}"]`).click(); return }
        await page.getByRole('button', { name: date < first ? '上一页日程' : '下一页日程', exact: true }).click()
    }
    throw new Error('Day navigation did not reach the requested date')
}
try {
    await page.goto('http://localhost:1919/cooper/home')
    await page.locator('.portal-home,#username').first().waitFor({ timeout: 35000 })
    if (page.url().includes('/protocol/openid-connect/auth')) {
        await page.locator('#username').fill(process.env.COOPER_TEST_USER); await page.locator('#password').fill(process.env.COOPER_TEST_PASSWORD); await page.locator('#kc-login').click()
    }
    await page.locator('.portal-home').waitFor()
    await page.getByRole('tab', { name: '我的日程', exact: true }).click()
    await page.locator('.agenda-card').getByRole('button', { name: '新建日程', exact: true }).click()
    await page.locator('.event-range-picker').click()
    await page.locator('.portal-event-range-popper:visible .el-date-range-picker.has-time').waitFor()
    ok(await page.locator('.event-range-picker .el-range-input').count() === 2 && !await page.locator('.event-form-dialog input[type=date],.event-form-dialog input[type=time]').count(), 'editor uses Element Plus datetimerange with two complete date/time values')
    await page.screenshot({ animations: 'disabled', path: path.join(out, 'calendar-range-picker.png') })
    await page.locator('.event-subject-field input').fill('跨月日程验收')
    await page.locator('.event-subject-field .el-form-item__label').click()
    await page.locator('.event-range-picker').hover(); await page.locator('.event-range-picker .el-range__close-icon').click()
    ok(await save().isDisabled(), 'clearing the range prevents submission instead of saving an old date')
    await setRange('2026-11-30 22:15', '2026-12-02 01:30')
    ok(await save().isEnabled(), 'a valid cross-month range ending at an earlier clock hour is accepted')
    await page.screenshot({ animations: 'disabled', path: path.join(out, 'calendar-range-form.png') })
    await save().click(); await page.locator('.event-form-dialog').waitFor({ state: 'hidden' })
    const created = await record('跨月日程验收')
    ok(created?.startAt === '2026-11-30T22:15:00+08:00' && created.endAt === '2026-12-02T01:30:00+08:00', 'creation preserves independent API startAt/endAt dates and local UTC offsets')
    await day('2026-12-01')
    const chip = page.locator('.event-chip').filter({ hasText: '跨月日程验收' }); await chip.waitFor()
    ok((await chip.innerText()).includes('持续中') && (await chip.innerText()).includes('跨日') && await page.locator('.week-strip button.active .event-dot-row i').count() > 0, 'a multi-day event remains in the following day list and dot indicators')
    await chip.click(); await page.locator('.event-full-range').waitFor()
    const detail = await page.locator('.event-time-summary').innerText()
    ok(detail.includes('2026-11-30 22:15') && detail.includes('2026-12-02 01:30') && detail.includes('1天3小时15分钟'), 'detail displays both full dates and an accurate multi-day duration')
    await page.screenshot({ animations: 'disabled', path: path.join(out, 'calendar-range-detail.png') })
    await page.getByRole('button', { name: '编辑日程', exact: true }).click()
    const values = await page.locator('.event-range-picker .el-range-input').evaluateAll(inputs => inputs.map(input => input.value))
    ok(values[0] === '2026-11-30 22:15' && values[1] === '2026-12-02 01:30', 'editing restores the original range without resetting the end date')
    await setRange('2026-11-30 22:15', '2026-12-03 08:00'); await save().click(); await page.locator('.event-form-dialog').waitFor({ state: 'hidden' })
    const updated = await record('跨月日程验收')
    ok(updated?.id === created.id && updated.endAt === '2026-12-03T08:00:00+08:00', 'PATCH updates the same event with an independent new end date')
    await page.locator('.agenda-card').getByRole('button', { name: '新建日程', exact: true }).click()
    await page.locator('.event-subject-field input').fill('跨年日程验收'); await setRange('2026-12-31 23:00', '2027-01-01 02:00')
    await save().click(); await page.locator('.event-form-dialog').waitFor({ state: 'hidden' })
    const yearEvent = await record('跨年日程验收')
    ok(yearEvent?.startAt === '2026-12-31T23:00:00+08:00' && yearEvent.endAt === '2027-01-01T02:00:00+08:00', 'cross-year creation keeps both years and accepts overnight times')
    await page.locator('.agenda-card .more-link').click()
    await page.locator('.fc-timeGridWeek-view').waitFor(); await page.locator('.calendar-loading').waitFor({ state: 'hidden' })
    await page.locator('.fc-event-title').filter({ hasText: '跨月日程验收' }).first().waitFor()
    ok(await page.locator('.fc-event-title').filter({ hasText: '跨月日程验收' }).count() >= 2 && await page.locator('.fc-timegrid-slot[data-time="23:00:00"]').count() > 0, 'FullCalendar renders the multi-day range and supports late-night hours')
    await page.screenshot({ animations: 'disabled', path: path.join(out, 'calendar-range-week.png') })
    await page.locator('.schedule-actions').getByText('月', { exact: true }).click()
    await page.locator('.fc-dayGridMonth-view').waitFor(); await page.locator('.calendar-loading').waitFor({ state: 'hidden' })
    while (!(await page.locator('.schedule-dialog .dialog-heading-title').innerText()).includes('2026年12月')) {
        await page.locator('.calendar-step').getByRole('button', { name: '下一页', exact: true }).click()
        await page.locator('.calendar-loading').waitFor({ state: 'hidden' })
    }
    const monthCount = await page.evaluate(async () => {
        const api = await import('/src/features/cooper/api.ts')
        return (await api.listCalendarEvents('2026-12-01T00:00:00+08:00', '2027-01-01T00:00:00+08:00')).length
    })
    ok((await page.locator('.schedule-dialog .dialog-subtitle').innerText()).includes(`共 ${monthCount} 项`), 'month count includes events beginning in the preceding month')
    await page.locator('.schedule-actions').getByText('年', { exact: true }).click()
    await page.locator('.fc-multimonth').waitFor(); await page.locator('.calendar-loading').waitFor({ state: 'hidden' })
    await page.waitForFunction(() => !!document.querySelector('.calendar-year [data-date="2026-12-01"].heat-1'))
    ok(true, 'year heatmap marks every occupied day of a cross-month event')
    const boundaries = await page.evaluate(async () => {
        const { overlapsDay, overlapsRange, calendarDateTime, localIso } = await import('/src/features/cooper/date.ts')
        const night = { startAt: '2026-12-01T22:00:00+08:00', endAt: '2026-12-02T00:00:00+08:00' }
        return overlapsDay(night, '2026-12-01') && !overlapsDay(night, '2026-12-02') &&
            overlapsDay({ startAt: '2026-12-01T15:00:00Z', endAt: '2026-12-02T01:00:00Z' }, '2026-12-02') &&
            calendarDateTime('2026-12-02T01:00:00Z') === '2026-12-02 09:00' &&
            localIso(new Date('2026-12-01T09:23:17+08:00')) === '2026-12-01T09:23:17+08:00' &&
            overlapsRange({ startAt: '2026-11-30T22:15:00+08:00', endAt: '2026-12-03T08:00:00+08:00' }, new Date(2026, 11, 1), new Date(2027, 0, 1))
    })
    ok(boundaries, 'midnight exclusivity, UTC conversion, month overlap and ISO seconds remain correct')
    await page.evaluate(async ids => { const api = await import('/src/features/cooper/api.ts'); await Promise.all(ids.map(id => api.deleteCalendarEvent(id))) }, [created.id, yearEvent.id])
    ok(errors.length === 0, 'no browser runtime errors in range creation, editing and rendering')
    fs.writeFileSync(path.join(out, 'calendar-ranges-result.json'), JSON.stringify({ passed: checks.length, checks, errors, node: process.version }, null, 2))
} catch (error) {
    await page.screenshot({ animations: 'disabled', path: path.join(out, 'calendar-ranges-failure.png') }); console.error('FAILED AFTER', checks.length); throw error
} finally { await browser.close() }
