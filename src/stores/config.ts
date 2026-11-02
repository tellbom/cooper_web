import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { STORE_CONFIG } from '/@/stores/constant/cacheKey'
import type { Lang, Layout } from '/@/stores/interface'

export const useConfig = defineStore(
    'config',
    () => {
        const layout: Layout = reactive({
            shrink: false,
            mainAnimation: 'slide-right',

            menuBackground: '#ffffff',
            menuColor: '#1d1d1f',
            menuActiveBackground: '#e8f1ff',
            menuActiveColor: '#0066cc',
            menuTopBarBackground: '#ffffff',
            menuWidth: 220,
            menuDefaultIcon: 'fa fa-circle-o',
            menuCollapse: false,
            menuUniqueOpened: false,
            menuShowTopBar: true,
        })

        const lang: Lang = reactive({
            defaultLang: 'zh-cn',
            fallbackLang: 'zh-cn',
            langArray: [
                { name: 'zh-cn', value: '中文简体' },
                { name: 'en', value: 'English' },
            ],
        })

        function menuWidth() {
            if (layout.shrink) {
                return layout.menuCollapse ? '0px' : layout.menuWidth + 'px'
            }

            return layout.menuCollapse ? '64px' : layout.menuWidth + 'px'
        }

        function setLang(val: string) {
            lang.defaultLang = val
        }

        const setLayout = (name: keyof Layout, value: any) => {
            layout[name] = value as never
        }

        const getColorVal = function (name: keyof Layout): string {
            return layout[name] as string
        }

        return { layout, lang, menuWidth, setLang, setLayout, getColorVal }
    },
    {
        persist: {
            key: STORE_CONFIG,
        },
    }
)
