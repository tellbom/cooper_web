import { nextTick } from 'vue'
import '/@/styles/loading.scss'

export const loading = {
    show: () => {
        const bodys: Element = document.body
        const div = document.createElement('div')
        div.className = 'block-loading'
        div.setAttribute('role', 'status')
        div.setAttribute('aria-label', '正在加载协同工作平台')
        div.innerHTML = `<div class="cooper-boot-mark"><span></span><img src="/cooper-logo.svg" alt=""/><i></i></div><p>协同工作平台</p><small>正在连接工作空间</small>`
        bodys.insertBefore(div, bodys.childNodes[0])
    },
    hide: () => {
        nextTick(() => {
            setTimeout(() => {
                const el = document.querySelector('.block-loading')
                el && el.parentNode?.removeChild(el)
            }, 180)
        })
    },
}
