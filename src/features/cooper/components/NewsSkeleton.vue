<template>
    <div v-if="kind === 'list'" class="news-skeleton news-skeleton-list" aria-hidden="true">
        <div v-if="featured" class="news-list-lead news-skeleton-lead">
            <el-skeleton-item variant="image" class="news-skeleton-lead-image" />
            <div class="news-skeleton-lead-copy">
                <el-skeleton-item class="news-skeleton-kicker" />
                <div class="news-skeleton-lead-title">
                    <el-skeleton-item class="news-skeleton-title" style="width: 94%" />
                    <el-skeleton-item class="news-skeleton-title" style="width: 68%" />
                </div>
                <div class="news-skeleton-lines"><el-skeleton-item style="width: 100%" /><el-skeleton-item style="width: 86%" /></div>
                <div class="news-skeleton-metadata"><el-skeleton-item /><el-skeleton-item /><el-skeleton-item /></div>
            </div>
        </div>
        <div v-for="(width, i) in [86, 72, 94, 66]" :key="i" class="news-list-row news-skeleton-list-row">
            <div class="news-skeleton-row-copy">
                <el-skeleton-item class="news-skeleton-row-title" :style="{ width: width + '%' }" />
                <div class="news-skeleton-lines">
                    <el-skeleton-item style="width: 100%" /><el-skeleton-item :style="{ width: (i % 2 ? 68 : 86) + '%' }" />
                </div>
                <div class="news-skeleton-metadata"><el-skeleton-item /><el-skeleton-item /><el-skeleton-item /></div>
            </div>
            <el-skeleton-item v-if="i !== 1" variant="image" class="news-skeleton-thumbnail" />
        </div>
        <div class="news-skeleton-pagination"><el-skeleton-item v-for="i in 5" :key="i" /></div>
    </div>
    <div v-else-if="kind === 'detail'" class="news-skeleton news-detail-layout news-skeleton-detail" aria-hidden="true">
        <article>
            <el-skeleton-item class="news-skeleton-kicker" />
            <div class="news-skeleton-headline">
                <el-skeleton-item class="news-skeleton-title" style="width: 88%" />
                <el-skeleton-item class="news-skeleton-subtitle" style="width: 62%" />
            </div>
            <div class="news-skeleton-article-meta">
                <div class="news-skeleton-metadata"><el-skeleton-item /><el-skeleton-item /><el-skeleton-item /></div>
                <div class="news-skeleton-controls"><el-skeleton-item /><el-skeleton-item /><el-skeleton-item /></div>
            </div>
            <div class="news-skeleton-abstract">
                <el-skeleton-item class="news-skeleton-kicker" />
                <div class="news-skeleton-lines"><el-skeleton-item /><el-skeleton-item /><el-skeleton-item style="width: 74%" /></div>
            </div>
            <div class="news-skeleton-paragraph"><el-skeleton-item /><el-skeleton-item /><el-skeleton-item style="width: 68%" /></div>
            <el-skeleton-item variant="image" class="news-skeleton-cover" />
            <div class="news-skeleton-paragraph">
                <el-skeleton-item /><el-skeleton-item style="width: 92%" /><el-skeleton-item style="width: 58%" />
            </div>
        </article>
        <aside class="news-skeleton-detail-side">
            <div class="news-skeleton-section-title"><el-skeleton-item /></div>
            <div v-for="i in 4" :key="i" class="news-skeleton-brief news-skeleton-related">
                <el-skeleton-item v-if="i !== 3" variant="image" class="news-skeleton-related-image" />
                <div class="news-skeleton-brief-copy">
                    <el-skeleton-item /><el-skeleton-item style="width: 70%" /><el-skeleton-item class="news-skeleton-date" />
                </div>
            </div>
            <div class="news-skeleton-section-title news-skeleton-section-next"><el-skeleton-item style="width: 90px" /></div>
            <div v-for="i in 3" :key="'brief-' + i" class="news-skeleton-brief">
                <div class="news-skeleton-brief-copy">
                    <el-skeleton-item /><el-skeleton-item style="width: 76%" /><el-skeleton-item class="news-skeleton-date" />
                </div>
            </div>
        </aside>
    </div>
    <div v-else-if="kind === 'channels'" class="news-skeleton news-skeleton-channels" aria-hidden="true">
        <div v-for="(width, i) in [64, 72, 58, 68, 56, 64, 72]" :key="i" :class="{ 'is-current': i === 0, 'is-child': i === 2 || i === 3 }">
            <el-skeleton-item :style="{ width: width + '%' }" />
        </div>
    </div>
    <div v-else class="news-skeleton news-skeleton-briefs" aria-hidden="true">
        <div v-for="(width, i) in [94, 82, 90, 72, 88]" :key="i" class="news-skeleton-brief" :class="{ 'news-skeleton-related': kind === 'related' }">
            <el-skeleton-item v-if="kind === 'related' && i !== 2" variant="image" class="news-skeleton-related-image" />
            <div class="news-skeleton-brief-copy">
                <el-skeleton-item :style="{ width: width + '%' }" /><el-skeleton-item style="width: 68%" /><el-skeleton-item
                    class="news-skeleton-date"
                />
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ kind: 'list' | 'detail' | 'channels' | 'briefs' | 'related'; featured?: boolean }>(), { featured: true })
</script>
