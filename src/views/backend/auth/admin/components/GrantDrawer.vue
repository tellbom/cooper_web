<template>
  <el-drawer
    v-model="visible"
    :title="`Project 授权 · ${target?.username ?? ''}`"
    size="480px"
    direction="rtl"
    destroy-on-close
    class="grant-drawer rbac-auth-drawer"
  >
    <div class="grant-content" v-loading="loading">
      <!-- 用户概览卡片 -->
      <div class="user-card" v-if="target">
        <div class="user-card__avatar">
          <i class="fa fa-user" />
        </div>
        <div class="user-card__info">
          <div class="user-card__name">{{ target.username }}</div>
          <div class="user-card__id">{{ target.userid }}</div>
        </div>
        <div class="user-card__badge">
          <el-tag
            v-if="target.isSuper"
            size="small"
            class="super-badge"
          >超管</el-tag>
          <el-tag
            :type="target.status === 'Active' ? 'success' : 'danger'"
            size="small"
          >
            {{ target.status === 'Active' ? '启用' : '禁用' }}
          </el-tag>
        </div>
      </div>

      <!-- 分隔线 -->
      <el-divider class="section-divider">
        <span class="divider-label">当前 Project 授权状态</span>
      </el-divider>

      <!-- Project 授权状态展示 -->
      <div class="grant-status">
        <div class="status-row">
          <span class="status-label">Project</span>
          <el-tag type="info" size="small">{{ rbacProject }}</el-tag>
        </div>
        <div class="status-row">
          <span class="status-label">授权状态</span>
          <el-tag :type="isGranted ? 'success' : 'info'" size="small">
            {{ isGranted ? '已授权' : '未授权' }}
          </el-tag>
        </div>
        <div class="status-row">
          <span class="status-label">超管权限</span>
          <el-tag :type="isSuper ? 'warning' : 'info'" size="small">
            {{ isSuper ? '是（超管）' : '否' }}
          </el-tag>
        </div>
      </div>

      <!-- 超管说明 -->
      <div class="info-block">
        <el-icon class="info-icon"><InfoFilled /></el-icon>
        <span>超管用户在当前 Project 下可访问完整菜单树，不受权限组限制。超管变更会立即触发缓存失效。</span>
      </div>

      <!-- 操作区 -->
      <el-divider class="section-divider">
        <span class="divider-label">操作</span>
      </el-divider>

      <div class="action-group">
        <!-- 授权到当前 Project -->
        <div class="action-item" v-if="!isGranted && canGrant">
          <div class="action-item__desc">
            <div class="action-item__title">授权进入 Project</div>
            <div class="action-item__hint">允许该用户访问当前 Project 的资源</div>
          </div>
          <el-button
            type="primary"
            size="small"
            :loading="actionLoading.grant"
            @click="handleGrant(false)"
          >
            授权
          </el-button>
        </div>

        <!-- 授权并设为超管 -->
        <div class="action-item" v-if="!isGranted && canGrant && canManageSuper">
          <div class="action-item__desc">
            <div class="action-item__title">授权并设为超管</div>
            <div class="action-item__hint">授权进入 Project 同时赋予超管权限</div>
          </div>
          <el-button
            type="warning"
            size="small"
            :loading="actionLoading.grantSuper"
            v-if="canManageSuper"
            @click="handleGrant(true)"
          >
            授权为超管
          </el-button>
        </div>

        <!-- 切换超管状态 -->
        <div class="action-item" v-if="isGranted && canManageSuper">
          <div class="action-item__desc">
            <div class="action-item__title">{{ isSuper ? '取消超管' : '设为超管' }}</div>
            <div class="action-item__hint">
              {{ isSuper ? '降级为普通权限组用户' : '赋予当前 Project 超管权限' }}
            </div>
          </div>
          <el-button
            :type="isSuper ? 'info' : 'warning'"
            size="small"
            :loading="actionLoading.super"
            v-if="canManageSuper"
            @click="handleToggleSuper"
          >
            {{ isSuper ? '取消超管' : '设为超管' }}
          </el-button>
        </div>

        <!-- 撤销授权（高风险，红色，二次确认） -->
        <div class="action-item action-item--danger" v-if="isGranted && canRevoke">
          <div class="action-item__desc">
            <div class="action-item__title">撤销 Project 授权</div>
            <div class="action-item__hint">该用户将无法访问当前 Project</div>
          </div>
          <el-button
            type="danger"
            size="small"
            plain
            :loading="actionLoading.revoke"
            @click="handleRevoke"
          >
            撤销授权
          </el-button>
        </div>
      </div>
    </div>

    <!-- 底部 -->
    <template #footer>
      <div class="drawer-footer">
        <el-button @click="visible = false">关闭</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  grantProjectAccess,
  revokeProjectAccess,
  toggleProjectSuper,
  type AdminItem,
} from '/@/api/backend/rbac'
import { RBAC_PROJECT } from '/@/api/backend/rbac'
import { useAdminInfo } from '/@/stores/adminInfo'
import { auth } from '/@/utils/common'
import { getIssuedRouteByComponent } from '/@/utils/router'

// ── Props / Emits ──────────────────────────────────────────────
interface Props {
  modelValue: boolean
  target: AdminItem | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  target: null,
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'refresh'): void
}>()

// ── 可见性 ─────────────────────────────────────────────────────
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// ── 当前登录用户 ───────────────────────────────────────────────
const adminInfo = useAdminInfo()
const rbacProject = RBAC_PROJECT

const grantPage = computed(() => getIssuedRouteByComponent('/src/views/backend/auth/projectGrant/index.vue'))
const allowed = (action: string) => !!grantPage.value && auth({ name: grantPage.value.path, subNodeName: grantPage.value.path + '/' + action })
const canManageSuper = computed(() => allowed('super'))
const canGrant = computed(() => allowed('add'))
const canRevoke = computed(() => allowed('del'))

// ── 派生状态：从 target 中读取当前 project 授权信息 ───────────
const isGranted = computed(() => {
  if (!props.target) return false
  return (props.target.projectCodes ?? []).includes(rbacProject)
})

const isSuper = computed(() => props.target?.isSuper ?? false)

// ── Loading 状态分离，避免互相影响 ────────────────────────────
const loading = ref(false)
const actionLoading = ref({
  grant: false,
  grantSuper: false,
  super: false,
  revoke: false,
})

// ── 授权 ───────────────────────────────────────────────────────
async function handleGrant(asSuper: boolean) {
  if (!props.target || !canGrant.value || asSuper && !canManageSuper.value) return
  const key = asSuper ? 'grantSuper' : 'grant'
  actionLoading.value[key] = true
  try {
    await grantProjectAccess({ userid: props.target.userid, isSuper: asSuper })
    ElMessage.success(asSuper ? '已授权并设为超管' : '授权成功')
    emit('refresh')
  } finally {
    actionLoading.value[key] = false
  }
}

// ── 超管切换 ───────────────────────────────────────────────────
async function handleToggleSuper() {
  if (!props.target || !canManageSuper.value) return
  const toSuper = !isSuper.value
  const label = toSuper ? '设为超管' : '取消超管'

  try {
    await ElMessageBox.confirm(
      toSuper
        ? `确定将「${props.target.username}」设为超管？超管可访问当前 Project 完整菜单，权限变更立即生效。`
        : `确定取消「${props.target.username}」的超管权限？降级后仅保留其权限组内的访问权限。`,
      `${label}确认`,
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }

  actionLoading.value.super = true
  try {
    if (!canManageSuper.value) return
    await toggleProjectSuper(props.target.userid, { isSuper: toSuper })
    ElMessage.success(`${label}成功`)
    emit('refresh')
  } finally {
    actionLoading.value.super = false
  }
}

// ── 撤销授权 ───────────────────────────────────────────────────
async function handleRevoke() {
  if (!props.target || !canRevoke.value) return

  try {
    await ElMessageBox.confirm(
      `确定撤销「${props.target.username}」（${props.target.userid}）在当前 Project 的授权？撤销后该用户将无法访问当前 Project，此操作不可撤回。`,
      '撤销授权确认',
      {
        confirmButtonText: '确定撤销',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger',
      }
    )
  } catch {
    return
  }

  actionLoading.value.revoke = true
  try {
    if (!canRevoke.value) return
    await revokeProjectAccess(props.target.userid)
    ElMessage.success('授权已撤销')
    emit('refresh')
  } finally {
    actionLoading.value.revoke = false
  }
}
</script>

<style scoped>
.grant-drawer {
  font-family: 'SF Pro Text', system-ui, -apple-system, sans-serif;
}

.grant-content {
  padding: 0 20px 20px;
  height: 100%;
  overflow-y: auto;
}

/* 用户卡片 */
.user-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #f5f5f7;
  border-radius: 12px;
  margin-bottom: 4px;
}

.user-card__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0066cc 0%, #2997ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 18px;
  flex-shrink: 0;
}

.user-card__info {
  flex: 1;
  min-width: 0;
}

.user-card__name {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
  letter-spacing: -0.224px;
}

.user-card__id {
  font-size: 12px;
  color: #86868b;
  margin-top: 2px;
  letter-spacing: -0.12px;
}

.user-card__badge {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.super-badge {
  background-color: #fff3e0;
  color: #e65100;
  border-color: #ffcc80;
  font-weight: 600;
}

/* 分隔线 */
.section-divider {
  margin: 20px 0 16px;
}

.divider-label {
  font-size: 12px;
  font-weight: 600;
  color: #86868b;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* 状态展示 */
.grant-status {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  padding: 4px 0;
  margin-bottom: 16px;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.status-row:last-child {
  border-bottom: none;
}

.status-label {
  font-size: 14px;
  color: #1d1d1f;
  font-weight: 400;
}

/* 信息提示块 */
.info-block {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  background: #f0f6ff;
  border-radius: 8px;
  border: 1px solid #cce0ff;
  margin-bottom: 4px;
  font-size: 13px;
  color: #1d4e8a;
  line-height: 1.5;
}

.info-icon {
  color: #0066cc;
  font-size: 16px;
  margin-top: 1px;
  flex-shrink: 0;
}

/* 操作组 */
.action-group {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid #e5e5e5;
  margin-bottom: 10px;
  background: #ffffff;
  transition: border-color 0.2s;
}

.action-item:hover {
  border-color: #b3cfee;
}

.action-item--danger {
  border-color: #fbc4c4;
  background: #fff8f8;
}

.action-item--danger:hover {
  border-color: #f56565;
}

.action-item__desc {
  flex: 1;
  min-width: 0;
  margin-right: 16px;
}

.action-item__title {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  letter-spacing: -0.224px;
  margin-bottom: 3px;
}

.action-item__hint {
  font-size: 12px;
  color: #86868b;
  letter-spacing: -0.12px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

/* El-tag 颜色覆盖 */
:deep(.el-tag--warning) {
  --el-tag-bg-color: #fff3e0;
  --el-tag-border-color: #ffcc80;
  --el-tag-text-color: #e65100;
}

:deep(.el-tag--success) {
  --el-tag-bg-color: #e6f4ea;
  --el-tag-border-color: #b7dfbc;
  --el-tag-text-color: #1e7e34;
}

:deep(.el-button--primary) {
  background-color: #0066cc;
  border-color: #0066cc;
}
:deep(.el-button--primary:hover) {
  background-color: #0071e3;
  border-color: #0071e3;
}
:deep(.el-button--warning) {
  --el-button-bg-color: #f0a030;
  --el-button-border-color: #f0a030;
}
</style>
