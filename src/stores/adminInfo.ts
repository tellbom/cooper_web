import { defineStore } from 'pinia'
import { ADMIN_INFO } from '/@/stores/constant/cacheKey'
import type { AdminInfo } from '/@/stores/interface'

export const useAdminInfo = defineStore('adminInfo', {
    state: (): AdminInfo => {
        return {
            id: 0,
            username: '',
            nickname: '',
            avatar: '',
            token: '',
            refresh_token: '',
            super: false,
            // ── 新增 ──────────────────────────────
            userid: '',
            project: '',
        }
    },
    actions: {
        dataFill(state: AdminInfo) {
            this.$state = { ...this.$state, ...state }
        },
        // adminInfo.ts - actions 追加
        setRbacInfo(info: { id?: string | number; userid?: string; username?: string; project?: string; super?: boolean }) {
            if (info.id !== undefined) this.id = String(info.id)
            if (info.userid !== undefined) this.userid = info.userid
            if (info.project !== undefined) this.project = info.project
            if (info.super !== undefined) this.super = info.super
            if (info.username !== undefined) {
                this.username = info.username
                if (!this.nickname) this.nickname = info.username
            }
        },
        clearRbacInfo() {
            this.userid = ''
            this.project = ''
            this.super = false
        },

        // adminInfo.ts - removeToken 末尾追加
        removeToken() {
            this.token = ''
            this.refresh_token = ''
            this.clearRbacInfo() // ← 新增
        },
        setToken(token: string, type: 'auth' | 'refresh') {
            const field = type == 'auth' ? 'token' : 'refresh_token'
            this[field] = token
        },
        getToken(type: 'auth' | 'refresh' = 'auth') {
            return type === 'auth' ? this.token : this.refresh_token
        },
        setSuper(val: boolean) {
            this.super = val
        },
    },
    persist: {
        key: ADMIN_INFO,
    },
})
