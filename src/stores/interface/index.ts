import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'

export interface Layout {
    shrink: boolean
    mainAnimation: string
    menuWidth: number
    menuDefaultIcon: string
    menuCollapse: boolean
    menuUniqueOpened: boolean
    menuShowTopBar: boolean
    menuBackground: string
    menuColor: string
    menuActiveBackground: string
    menuActiveColor: string
    menuTopBarBackground: string
}

export interface Lang {
    defaultLang: string
    fallbackLang: string
    langArray: { name: string; value: string }[]
}

export interface NavTabs {
    activeIndex: number
    activeRoute: RouteLocationNormalized | null
    tabsView: RouteLocationNormalized[]
    tabFullScreen: boolean
    tabsViewRoutes: RouteRecordRaw[]
    authNode: Map<string, string[]>
}

export interface AdminInfo {
    id: string | number
    username: string
    nickname: string
    token: string
    refresh_token?: string
    avatar?: string
    userid?: string
    project?: string
    super?: boolean
}
