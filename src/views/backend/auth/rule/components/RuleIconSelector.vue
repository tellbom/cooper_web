<template>
  <el-popover
    :placement="placement"
    trigger="focus"
    :hide-after="0"
    :width="selectorWidth"
    :visible="popoverVisible"
  >
    <div
      class="icon-selector"
      @mouseover.stop="iconSelectorMouseover = true"
      @mouseout.stop="iconSelectorMouseover = false"
    >
      <div class="selector-header">
        <div class="selector-title">{{ title || '请选择图标' }}</div>
        <div class="selector-tab">
          <span
            title="Element Plus 图标"
            :class="{ active: iconType === 'ele' }"
            @click="changeTab('ele')"
          >ele</span>
          <span
            title="Font Awesome 图标"
            :class="{ active: iconType === 'awe' }"
            @click="changeTab('awe')"
          >awe</span>
          <span
            title="阿里 Iconfont 图标"
            :class="{ active: iconType === 'ali' }"
            @click="changeTab('ali')"
          >ali</span>
        </div>
      </div>

      <div class="selector-body">
        <el-scrollbar ref="selectorScrollbarRef">
          <div v-if="renderIconNames.length" class="selector-grid">
            <button
              v-for="item in renderIconNames"
              :key="item"
              type="button"
              class="icon-selector-item"
              :class="{ selected: item === modelValue }"
              :title="item"
              @click="selectIcon(item)"
            >
              <Icon :name="item" />
            </button>
          </div>
          <div v-else class="selector-empty">未找到匹配图标</div>
        </el-scrollbar>
      </div>
    </div>

    <template #reference>
      <el-input
        ref="selectorInput"
        v-model="inputValue"
        :size="size"
        :disabled="disabled"
        placeholder="搜索或选择图标"
        clearable
        @focus="onInputFocus"
        @blur="onInputBlur"
        @clear="clearIcon"
      >
        <template #prepend>
          <div class="icon-prepend">
            <Icon :key="iconKey" :name="modelValue || defaultIcon" />
          </div>
        </template>
        <template #append>
          <button type="button" class="icon-reset-btn" title="恢复默认图标" @click.stop="resetIcon">
            <Icon name="el-icon-RefreshRight" />
          </button>
        </template>
      </el-input>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import type { Placement } from 'element-plus'
import Icon from '/@/components/icon/index.vue'
import {
  getAwesomeIconfontNames,
  getElementPlusIconfontNames,
  getIconfontNames,
} from '/@/utils/iconfont'

type IconType = 'ele' | 'awe' | 'ali'

const props = withDefaults(defineProps<{
  modelValue?: string
  size?: 'default' | 'small' | 'large'
  disabled?: boolean
  title?: string
  type?: IconType
  placement?: Placement
  defaultIcon?: string
}>(), {
  modelValue: '',
  size: 'default',
  disabled: false,
  title: '',
  type: 'ele',
  placement: 'bottom',
  defaultIcon: 'fa fa-circle-o',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

const selectorInput = ref()
const selectorWidth = ref(320)
const popoverVisible = ref(false)
const inputFocus = ref(false)
const iconSelectorMouseover = ref(false)
const iconType = ref<IconType>(props.type)
const iconNames = ref<string[]>([])
const inputValue = ref('')
const iconKey = ref(0)

const renderIconNames = computed(() => {
  const keyword = inputValue.value.trim().toLowerCase()
  if (!keyword) return iconNames.value
  return iconNames.value.filter(name => name.toLowerCase().includes(keyword))
})

function updatePopoverVisible() {
  popoverVisible.value = inputFocus.value || iconSelectorMouseover.value
}

function onInputFocus() {
  inputFocus.value = true
  popoverVisible.value = true
}

function onInputBlur() {
  inputFocus.value = false
  popoverVisible.value = iconSelectorMouseover.value
}

function emitIcon(icon: string) {
  iconKey.value++
  emit('update:modelValue', icon)
  emit('change', icon)
}

function selectIcon(icon: string) {
  iconSelectorMouseover.value = false
  popoverVisible.value = false
  inputValue.value = ''
  emitIcon(icon)
  nextTick(() => selectorInput.value?.blur?.())
}

function clearIcon() {
  emitIcon('')
}

function resetIcon() {
  inputValue.value = ''
  emitIcon(props.defaultIcon)
}

async function changeTab(type: IconType) {
  iconType.value = type
  iconNames.value = []

  try {
    if (type === 'ele') {
      iconNames.value = await getElementPlusIconfontNames()
    } else if (type === 'awe') {
      iconNames.value = (await getAwesomeIconfontNames()).map(name => `fa ${name}`)
    } else {
      iconNames.value = (await getIconfontNames()).map(name => `iconfont ${name}`)
    }
  } catch {
    iconNames.value = []
  }
}

function updateSelectorWidth() {
  nextTick(() => {
    const width = selectorInput.value?.$el?.offsetWidth ?? 320
    selectorWidth.value = Math.max(width, 320)
  })
}

watch(() => props.modelValue, () => {
  iconKey.value++
})

onMounted(() => {
  updateSelectorWidth()
  useEventListener(document, 'click', updatePopoverVisible)
  changeTab(iconType.value)
})
</script>

<style scoped>
.selector-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.selector-title {
  font-size: 13px;
  font-weight: 600;
  color: #1d1d1f;
}

.selector-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.selector-tab span {
  font-size: 12px;
  color: #86868b;
  cursor: pointer;
  user-select: none;
}

.selector-tab span.active,
.selector-tab span:hover {
  color: #0066cc;
  text-decoration: underline;
}

.selector-body {
  height: 260px;
}

.selector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 6px;
  padding-right: 4px;
}

.icon-selector-item {
  width: 40px;
  height: 40px;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  color: #1d1d1f;
  transition: border-color .15s, background .15s, color .15s;
}

.icon-selector-item:hover,
.icon-selector-item.selected {
  border-color: #0066cc;
  background: #eef6ff;
  color: #0066cc;
}

.selector-empty {
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #86868b;
}

.icon-prepend {
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-reset-btn {
  width: 20px;
  height: 20px;
  min-height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: #606266;
  cursor: pointer;
}

:deep(.el-input-group__prepend),
:deep(.el-input-group__append) {
  padding: 0 10px;
}
</style>
