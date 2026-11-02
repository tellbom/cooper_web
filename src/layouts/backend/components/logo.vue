<template>
    <div class="layout-logo">
        <span class="brand-mark" aria-hidden="true"><el-icon><Link /></el-icon></span>
        <div v-if="!config.layout.menuCollapse" :style="{ color: config.getColorVal('menuColor') }" class="website-name">
            <!-- <strong>Cochain</strong> -->
            <span>外协分包管理系统</span>
        </div>
        <button class="fold" type="button" :aria-label="config.layout.menuCollapse ? '打开导航菜单' : '收起导航菜单'" @click="onMenuCollapse">
            <Icon
                :name="config.layout.menuCollapse ? 'fa fa-indent' : 'fa fa-dedent'"
                color="#6e6e73"
                size="16"
            />
        </button>
    </div>
</template>

<script setup lang="ts">
import { useConfig } from '/@/stores/config'
import { closeShade } from '/@/utils/pageShade'
import { Session } from '/@/utils/storage'
import { BEFORE_RESIZE_LAYOUT } from '/@/stores/constant/cacheKey'
import { setNavTabsWidth } from '/@/utils/layout'
import { Link } from '@element-plus/icons-vue'

const config = useConfig()

const onMenuCollapse = function () {
    if (config.layout.shrink && !config.layout.menuCollapse) {
        closeShade()
    }

    config.setLayout('menuCollapse', !config.layout.menuCollapse)

    Session.set(BEFORE_RESIZE_LAYOUT, {
        menuCollapse: config.layout.menuCollapse,
    })

    // 等待侧边栏动画结束后重新计算导航栏宽度
    setTimeout(() => {
        setNavTabsWidth()
    }, 350)
}
</script>

<style scoped lang="scss">
.layout-logo {
    width: 220px;
    min-width: 220px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    box-sizing: border-box;
    padding: 7px 12px;
    border-right: 1px solid var(--co-hairline);
    background: #ffffff;
}
.brand-mark {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    flex: 0 0 30px;
    border-radius: 8px;
    background: #0066cc;
    color: #ffffff;
    font-size: 18px;
}
.website-name {
    display: flex;
    flex-direction: column;
    width: 132px;
    padding-left: 9px;
    font-family: var(--co-font-family);
    font-size: 12px;
    font-weight: 400;
    line-height: 14px;
    letter-spacing: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.website-name strong {
    font-size: 14px;
    font-weight: 600;
    line-height: 16px;
}
.fold {
    margin-left: auto;
    display: grid;
    width: 28px;
    height: 28px;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: 7px;
    background: transparent;
    cursor: pointer;
}
.fold:hover {
    background: #f5f5f7;
}
</style>
