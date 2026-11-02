export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const weekStart = (d: Date) => addDays(d, -((d.getDay() + 6) % 7))
export function localIso(d: Date) {
    const offset = -d.getTimezoneOffset(),
        sign = offset >= 0 ? '+' : '-'
    return `${ymd(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}${sign}${String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')}:${String(Math.abs(offset) % 60).padStart(2, '0')}`
}
export const hm = (s: string) => s.slice(11, 16)

// Calendar ranges use an exclusive end, matching FullCalendar and the list API.
export function overlapsRange(event: { startAt: string; endAt: string }, start: Date, end: Date) {
    return new Date(event.startAt).getTime() < end.getTime() && new Date(event.endAt).getTime() > start.getTime()
}
export function overlapsDay(event: { startAt: string; endAt: string }, day: Date | string) {
    const date = typeof day === 'string' ? new Date(day + 'T00:00:00') : day
    return overlapsRange(event, new Date(date.getFullYear(), date.getMonth(), date.getDate()), addDays(date, 1))
}
export const calendarTime = (value: string) => {
    const date = new Date(value)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
export const calendarDateTime = (value: string) => `${ymd(new Date(value))} ${calendarTime(value)}`
