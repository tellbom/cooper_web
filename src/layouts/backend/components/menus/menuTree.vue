<!--
 * @Description: 菜单树组件 — 递归渲染一级 / 子级菜单项
 * 排版规格：
 *   一级菜单  15px / 500 / letter-spacing 0.01em / padding 0 22px
 *   下拉菜单  由 menuHorizontal 全局样式统一控制（13.5px / 400）
-->
<template>
    <template v-for="menu in props.menus">
        <template v-if="menu.children && menu.children.length > 0">
            <el-sub-menu popper-class="ba-menu-popup" @click="onClickSubMenu(menu)" :index="menu.path" :key="menu.path">
                <template #title>
                    <Icon v-if="menu.meta?.icon" :name="String(menu.meta.icon)" size="16px" color="currentColor" />
                    <span class="menu-title">{{ menu.meta?.title ? menu.meta?.title : $t('noTitle') }}</span>
                </template>
                <menu-tree :extends="{ ...props.extends, level: props.extends.level + 1 }" :menus="menu.children"></menu-tree>
            </el-sub-menu>
        </template>
        <template v-else>
            <el-menu-item :index="menu.path" :key="menu.path" @click="onClickMenu(menu)">
                <Icon v-if="menu.meta?.icon" :name="String(menu.meta.icon)" size="16px" color="currentColor" />
                <span class="menu-title">{{ menu.meta?.title ? menu.meta?.title : $t('noTitle') }}</span>
            </el-menu-item>
        </template>
    </template>
</template>

<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'
import { getFirstRoute, onClickMenu } from '/@/utils/router'
import { ElNotification } from 'element-plus'
import { useI18n } from 'vue-i18n'
import Icon from '/@/components/icon/index.vue'

const { t } = useI18n()
interface Props {
    menus: RouteRecordRaw[]
    extends?: {
        level: number
        [key: string]: any
    }
}
const props = withDefaults(defineProps<Props>(), {
    menus: () => [],
    extends: () => {
        return {
            level: 1,
        }
    },
})

const onClickSubMenu = (menu: RouteRecordRaw) => {
    if (props.extends?.position == 'horizontal' && props.extends.level <= 1 && menu.children?.length) {
        const firstRoute = getFirstRoute(menu.children)
        if (firstRoute) {
            onClickMenu(firstRoute)
        } else {
            ElNotification({
                type: 'error',
                message: t('utils.No child menu to jump to!'),
            })
        }
    }
}
</script>

<style scoped lang="scss">
/*
 * 一级菜单文字规格
 * - 15px / 500：深色背景下对比度高，等效浅色背景 17px 的视觉冲击力
 * - letter-spacing 0.01em：略微打开字间距，商务感
 * - padding 0 22px：横向间距适中，不拥挤
 * - min-width auto：让 el-menu 按实际内容分配宽度，不强制等宽
 * - text-align 不强制 center（水平菜单由 el-menu 自动居中）
 */
.menu-title {
    display: inline-block;
    min-width: 0;
    padding: 0;
    font-family:
        'SF Pro Text',
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        sans-serif;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0;
    line-height: 1.29;
}
/* icon 对齐（保留以防后续开启图标） */
.el-sub-menu .icon,
.el-menu-item .icon {
    vertical-align: middle;
    margin-right: 5px;
    width: 24px;
    text-align: center;
    flex-shrink: 0;
    .is-active {
        font-weight: 800 !important;
    }
}

.is-active > .icon {
    color: inherit !important;
}

/*
 * 注意：一级菜单 is-active 的背景/颜色由 menuHorizontal.vue 中
 * .menu-horizontal :deep(.el-menu-item.is-active) 统一控制，
 * 此处不再重复设置，避免优先级冲突。
 *
 * 下拉子菜单的 is-active 样式由 menuHorizontal 的全局 <style> 块控制。
 */
</style>

<!-- 弹出层内的菜单标题字号（下拉子项） -->
<style lang="scss">
/*
 * 下拉层内 .menu-title 字号覆盖：
 * 弹出层中使用更小的 15px，与顶层 22px 形成层级区分。
 * 通过 .streamline-custom-popup 限定作用域，不污染其他地方。
 */
.streamline-custom-popup {
    .menu-title {
        font-size: 14px !important;
        font-weight: 400 !important;
        letter-spacing: 0 !important;
        padding: 0 4px !important;
    }

    &.el-menu--popup {
        .el-menu-item {
            color: #1d1d1f !important;
            background-color: transparent !important;
            transition: all 0.15s;

            &:hover {
                background-color: #f5f5f7 !important;
                color: #0066cc !important;
            }

            &.is-active {
                background-color: rgba(0, 102, 204, 0.1) !important;
                color: #0066cc !important;
            }

            &.is-active:hover {
                background-color: rgba(0, 102, 204, 0.14) !important;
                color: #0066cc !important;
            }
        }
    }
}

.ba-menu-popup.el-popper {
    border: 1px solid #e0e0e0 !important;
    border-radius: 8px !important;
    box-shadow: none !important;

    .el-menu {
        min-width: 180px;
        padding: 8px;
        border: 0;
        background-color: #ffffff !important;
    }

    .el-menu-item,
    .el-sub-menu__title {
        height: 44px;
        line-height: 44px;
        margin: 2px 0;
        border-radius: 8px;
        color: #1d1d1f !important;
        font-size: 14px;
        font-weight: 400;
        letter-spacing: 0;
    }

    .el-menu-item:hover,
    .el-sub-menu__title:hover {
        background-color: #f5f5f7 !important;
        color: #0066cc !important;
    }

    .el-menu-item.is-active,
    .el-sub-menu.is-active > .el-sub-menu__title {
        background-color: rgba(0, 102, 204, 0.1) !important;
        color: #0066cc !important;
        font-weight: 600;
    }
}
</style>
