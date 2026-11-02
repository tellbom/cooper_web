import { nextTick } from 'vue'
import * as elementIcons from '@element-plus/icons-vue'

function getViteStylesheets(devId: string) {
    const sheets: CSSStyleSheet[] = []
    for (const sheet of Array.from(document.styleSheets)) {
        const ownerNode = sheet.ownerNode as HTMLElement | null
        if (import.meta.env.MODE === 'production' || ownerNode?.dataset?.viteDevId?.includes(devId)) {
            sheets.push(sheet)
        }
    }
    return sheets
}

export function getAwesomeIconfontNames() {
    return nextTick().then(() => {
        const names: string[] = []
        for (const sheet of getViteStylesheets('font-awesome.min.css')) {
            let rules: CSSRuleList
            try {
                rules = sheet.cssRules
            } catch {
                continue
            }
            for (const rule of Array.from(rules)) {
                const selector = (rule as CSSStyleRule).selectorText
                if (!selector?.startsWith('.fa-')) continue
                const match = selector.match(/^\.(fa-[\w-]+)(?:::before|:before)/)
                if (match) names.push(match[1])
            }
        }
        return [...new Set(names)]
    })
}

export function getElementPlusIconfontNames() {
    return nextTick().then(() => Object.values(elementIcons).map((icon: any) => `el-icon-${icon.name}`))
}

export function getLocalIconfontNames() {
    return nextTick().then(() => {
        const names = document.getElementById('local-icon')?.dataset.iconName
        return names ? names.split(',').filter(Boolean) : []
    })
}

export function getIconfontNames() {
    return nextTick().then(() => {
        const names: string[] = []
        for (const sheet of Array.from(document.styleSheets)) {
            let rules: CSSRuleList
            try {
                rules = sheet.cssRules
            } catch {
                continue
            }
            for (const rule of Array.from(rules)) {
                const selector = (rule as CSSStyleRule).selectorText
                const match = selector?.match(/^\.(icon-[\w-]+)(?:::before|:before)/)
                if (match) names.push(match[1])
            }
        }
        return [...new Set(names)]
    })
}
