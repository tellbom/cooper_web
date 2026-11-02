<template>
    <div v-if="error" class="portal-state" role="alert">
        <p>{{ error }}</p>
        <el-button size="small" @click="$emit('retry')">重新加载</el-button>
    </div>
    <el-skeleton
        v-else-if="loading"
        animated
        class="portal-skeleton"
        :class="'skeleton-' + variant"
        role="status"
        aria-label="正在加载"
        aria-busy="true"
        ><template #template>
            <slot v-if="$slots.skeleton" name="skeleton" />
            <template v-else-if="variant === 'news'"
                ><div class="skeleton-photo">
                    <el-skeleton-item variant="image" />
                    <div class="skeleton-caption">
                        <el-skeleton-item style="width: 66%; height: 22px" /><el-skeleton-item style="width: 85%; margin-top: 10px" />
                        <div class="skeleton-row-meta">
                            <el-skeleton-item style="width: 80px; height: 10px" /><el-skeleton-item style="width: 60px; height: 10px" />
                        </div>
                    </div>
                </div>
                <div class="skeleton-thumbnails">
                    <div v-for="i in 3" :key="i">
                        <el-skeleton-item variant="image" /><el-skeleton-item style="width: 90%; margin-top: 10px" /><el-skeleton-item
                            style="width: 55%; margin-top: 6px; height: 10px"
                        />
                    </div></div
            ></template>
            <template v-else-if="variant === 'systems'"
                ><div class="skeleton-apps">
                    <div v-for="i in 8" :key="i">
                        <el-skeleton-item variant="rect" style="width: 44px; height: 44px; border-radius: 12px" /><el-skeleton-item
                            style="width: 48px; height: 10px; margin-top: 8px"
                        />
                    </div></div
            ></template>
            <template v-else-if="variant === 'honor'"
                ><div class="skeleton-honors">
                    <div v-for="i in 4" :key="i">
                        <el-skeleton-item variant="image" /><el-skeleton-item style="width: 75%; height: 16px; margin-top: 14px" /><el-skeleton-item
                            style="width: 90%; height: 10px; margin-top: 10px"
                        />
                    </div></div
            ></template>
            <template v-else-if="variant === 'article'"
                ><div class="skeleton-article">
                    <el-skeleton-item style="width: 20%; height: 10px" /><el-skeleton-item
                        style="width: 88%; height: 34px; margin-top: 20px"
                    /><el-skeleton-item style="width: 65%; height: 24px; margin-top: 12px" />
                    <div class="skeleton-article-meta">
                        <el-skeleton-item variant="circle" /><el-skeleton-item style="width: 130px" /><el-skeleton-item style="width: 90px" />
                    </div>
                    <el-skeleton-item variant="image" class="skeleton-article-cover" /><el-skeleton-item
                        v-for="i in 5"
                        :key="i"
                        :style="{ width: i === 5 ? '62%' : '100%', marginTop: '14px', height: '12px' }"
                    /></div
            ></template>
            <template v-else-if="variant === 'table'"
                ><div class="skeleton-table-header">
                    <el-skeleton-item v-for="i in 4" :key="i" :style="{ width: [40, 72, 60, 32][i - 1] + 'px', height: '10px' }" />
                </div>
                <div v-for="i in 4" :key="i" class="skeleton-table-row">
                    <el-skeleton-item style="width: 58px; height: 12px" />
                    <div class="skeleton-copy">
                        <el-skeleton-item :style="{ width: [85, 70, 93, 60][i - 1] + '%', height: '13px' }" /><el-skeleton-item
                            style="width: 50%; height: 8px; margin-top: 8px"
                        />
                    </div>
                    <el-skeleton-item variant="circle" style="width: 22px; height: 22px" /><el-skeleton-item
                        style="width: 40px; height: 18px; border-radius: 4px"
                    /></div
            ></template>
            <template v-else-if="variant === 'timeline'"
                ><div v-for="i in 3" :key="i" class="skeleton-timeline-group">
                    <div class="skeleton-date">
                        <el-skeleton-item style="width: 38px; height: 32px" /><el-skeleton-item
                            style="width: 72px; height: 10px; margin-top: 10px"
                        /><el-skeleton-item style="width: 56px; height: 8px; margin-top: 8px" />
                    </div>
                    <div class="skeleton-result-card">
                        <div class="skeleton-copy">
                            <div class="skeleton-row-meta">
                                <el-skeleton-item style="width: 48px; height: 18px; border-radius: 4px" /><el-skeleton-item
                                    style="width: 100px; height: 10px"
                                />
                            </div>
                            <el-skeleton-item :style="{ width: i === 2 ? '68%' : '85%', height: '19px', marginTop: '16px' }" /><el-skeleton-item
                                style="width: 94%; height: 10px; margin-top: 16px"
                            /><el-skeleton-item style="width: 60%; height: 10px; margin-top: 10px" />
                        </div>
                        <el-skeleton-item v-if="i !== 2" variant="image" style="width: 144px; height: 96px; border-radius: 8px" />
                    </div></div
            ></template>
            <template v-else-if="variant === 'work' || variant === 'fault'"
                ><div v-for="i in 4" :key="i" class="skeleton-work-row" :class="{ 'skeleton-fault-row': variant === 'fault' }">
                    <el-skeleton-item v-if="variant === 'fault'" variant="circle" style="width: 6px; height: 6px" />
                    <div class="skeleton-copy">
                        <el-skeleton-item :style="{ width: [68, 82, 58, 74][i - 1] + '%', height: '13px' }" /><el-skeleton-item
                            style="width: 90%; height: 9px; margin-top: 10px"
                        /><el-skeleton-item v-if="variant === 'work'" style="width: 66%; height: 8px; margin-top: 9px" />
                    </div>
                    <div class="skeleton-work-meta">
                        <el-skeleton-item
                            :variant="variant === 'work' ? 'circle' : 'rect'"
                            :style="{
                                width: variant === 'work' ? '22px' : '42px',
                                height: variant === 'work' ? '22px' : '18px',
                                borderRadius: variant === 'work' ? '50%' : '4px',
                            }"
                        /><el-skeleton-item style="width: 32px; height: 8px; margin-top: 9px" />
                    </div></div
            ></template>
            <template v-else
                ><div v-for="i in Math.min(rows || 4, 6)" :key="i" class="skeleton-list-row">
                    <el-skeleton-item
                        :variant="variant === 'agenda' ? 'circle' : 'image'"
                        :style="{ width: variant === 'agenda' ? '8px' : '40px', height: variant === 'agenda' ? '8px' : '40px', borderRadius: '8px' }"
                    />
                    <div class="skeleton-copy">
                        <el-skeleton-item :style="{ width: [72, 89, 58, 80, 62, 74][i - 1] + '%', height: '13px' }" />
                        <div class="skeleton-row-meta">
                            <el-skeleton-item style="width: 35%; height: 9px" /><el-skeleton-item style="width: 22%; height: 9px" />
                        </div>
                    </div>
                    <el-skeleton-item v-if="variant !== 'agenda'" style="width: 32px; height: 18px; border-radius: 4px" /></div
            ></template> </template
    ></el-skeleton>
    <div v-else-if="empty" class="portal-state">{{ emptyText || '暂无数据' }}</div>
    <slot v-else />
</template>
<script setup lang="ts">
withDefaults(
    defineProps<{
        loading?: boolean
        error?: string
        empty?: boolean
        emptyText?: string
        rows?: number
        variant?: 'list' | 'agenda' | 'news' | 'honor' | 'table' | 'systems' | 'article' | 'timeline' | 'work' | 'fault' | 'editorial'
    }>(),
    { variant: 'list' }
)
defineEmits(['retry'])
</script>
