export async function copyText(text: string) {
    if (navigator.clipboard) return navigator.clipboard.writeText(text)
    const input = document.createElement('textarea')
    input.value = text
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.append(input)
    input.select()
    const copied = document.execCommand('copy')
    input.remove()
    if (!copied) throw new Error('copy_unavailable')
}
