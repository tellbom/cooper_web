/**
 * RBAC 适配器 / 枚举映射
 *
 * 职责：
 * 1. 权限中心表单枚举与后端 RBAC 枚举双向映射
 * 2. permissionCode 自动生成逻辑
 * 3. 状态显示文案 / 标签颜色
 */

import type { RecordStatus, RuleMenuType, RuleType } from '../types'

// ── RuleType 映射 ─────────────────────────────────────────────────────────────

/** 权限中心菜单类型值 → RBAC 后端枚举 */
const UI_TO_RULE_TYPE: Record<string, RuleType> = {
    menu_dir: 'MenuDir',
    menu: 'Menu',
    button: 'Button',
}

/** RBAC 后端枚举 → 权限中心菜单类型值 */
const RULE_TYPE_TO_UI: Record<RuleType, string> = {
    MenuDir: 'menu_dir',
    Menu: 'menu',
    Button: 'button',
}

/** 权限中心菜单类型字符串 → RBAC RuleType */
export function toRuleType(uiValue: string): RuleType {
    const mapped = UI_TO_RULE_TYPE[uiValue]
    if (!mapped) {
        console.warn(`[rbac/adapters] Unknown UI rule type: "${uiValue}", fallback to "Menu"`)
        return 'Menu'
    }
    return mapped
}

/** RBAC RuleType → 权限中心菜单类型字符串 */
export function fromRuleType(type: RuleType): string {
    return RULE_TYPE_TO_UI[type] ?? 'menu'
}

// ── RuleMenuType 映射 ─────────────────────────────────────────────────────────

const UI_TO_MENU_TYPE: Record<string, RuleMenuType> = {
    tab: 'Tab',
    link: 'Link',
    iframe: 'Iframe',
}

const MENU_TYPE_TO_UI: Record<RuleMenuType, string> = {
    Tab: 'tab',
    Link: 'link',
    Iframe: 'iframe',
}

export function toMenuType(uiValue: string): RuleMenuType {
    const mapped = UI_TO_MENU_TYPE[uiValue]
    if (!mapped) {
        console.warn(`[rbac/adapters] Unknown UI menu type: "${uiValue}", fallback to "Tab"`)
        return 'Tab'
    }
    return mapped
}

export function fromMenuType(type: RuleMenuType): string {
    return MENU_TYPE_TO_UI[type] ?? 'tab'
}

// ── RecordStatus 映射 ─────────────────────────────────────────────────────────

/**
 * 权限中心 1/0 或 true/false → RBAC RecordStatus
 * 兼容处理：string "1"/"0"、number 1/0、boolean true/false
 */
export function toRecordStatus(uiValue: string | number | boolean): RecordStatus {
    if (uiValue === 1 || uiValue === '1' || uiValue === true) return 'Active'
    if (uiValue === 0 || uiValue === '0' || uiValue === false) return 'Disabled'
    // 已是 RBAC 格式时直通
    if (uiValue === 'Active' || uiValue === 'Disabled') return uiValue as RecordStatus
    console.warn(`[rbac/adapters] Unknown status value: "${uiValue}", fallback to "Disabled"`)
    return 'Disabled'
}

/** RBAC RecordStatus → 权限中心数字状态 */
export function fromRecordStatus(status: RecordStatus): number {
    return status === 'Active' ? 1 : 0
}

// ── Keepalive 映射 ────────────────────────────────────────────────────────────

/** 权限中心 1/0 → boolean */
export function toKeepalive(uiValue: number | string | boolean): boolean {
    if (typeof uiValue === 'boolean') return uiValue
    return uiValue === 1 || uiValue === '1'
}

/** boolean → 权限中心 0/1 */
export function fromKeepalive(keepalive: boolean): number {
    return keepalive ? 1 : 0
}

// ── permissionCode 自动生成 ───────────────────────────────────────────────────

/**
 * 根据 ruleCode 和类型自动生成推荐的 permissionCode。
 *
 * 规则：
 * - MenuDir / Menu → `menu:${ruleCode}`
 * - Button         → `button:${ruleCode}`
 *
 * 允许前端用户手动覆盖，此函数仅用于填充默认值和表单提示。
 *
 * @example
 * suggestPermissionCode('system.user', 'Menu')    // → "menu:system.user"
 * suggestPermissionCode('system.user.add', 'Button') // → "button:system.user.add"
 */
export function suggestPermissionCode(ruleCode: string, type: RuleType): string {
    if (!ruleCode) return ''
    if (type === 'Button') return `button:${ruleCode}`
    return `menu:${ruleCode}`
}

// ── 状态显示配置 ──────────────────────────────────────────────────────────────

export interface StatusDisplay {
    label: string
    tagType: 'success' | 'danger' | 'warning' | 'info'
}

const STATUS_DISPLAY_MAP: Record<RecordStatus, StatusDisplay> = {
    Active: { label: '启用', tagType: 'success' },
    Disabled: { label: '禁用', tagType: 'danger' },
}

export function getStatusDisplay(status: RecordStatus): StatusDisplay {
    return STATUS_DISPLAY_MAP[status] ?? { label: status, tagType: 'info' }
}

// ── RuleType 显示配置 ─────────────────────────────────────────────────────────

export interface RuleTypeDisplay {
    label: string
    tagType: 'primary' | 'success' | 'warning' | 'info'
}

const RULE_TYPE_DISPLAY_MAP: Record<RuleType, RuleTypeDisplay> = {
    MenuDir: { label: '目录', tagType: 'primary' },
    Menu: { label: '菜单', tagType: 'success' },
    Button: { label: '按钮', tagType: 'warning' },
}

export function getRuleTypeDisplay(type: RuleType): RuleTypeDisplay {
    return RULE_TYPE_DISPLAY_MAP[type] ?? { label: type, tagType: 'info' }
}

// ── isSuper 显示 ──────────────────────────────────────────────────────────────

export function getSuperDisplay(isSuper: boolean): { label: string; tagType: 'warning' | 'info' } {
    return isSuper ? { label: '超管', tagType: 'warning' } : { label: '普通', tagType: 'info' }
}

// ── 分页参数标准化 ────────────────────────────────────────────────────────────

/**
 * 将旧 baTable 分页格式标准化为 RBAC API 分页参数。
 */
export function normalizePageParams(page = 1, pageSize = 20) {
    return {
        page: Math.max(1, page),
        pageSize: Math.min(100, Math.max(1, pageSize)),
    }
}
