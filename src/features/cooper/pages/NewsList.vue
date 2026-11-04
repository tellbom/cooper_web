<template>
    <div class="editorial-page news-list-page">
        <div class="breadcrumbs"><router-link to="/cooper/home">首页</router-link> / 新闻资讯</div>
        <header class="editorial-heading">
            <div>
                <span class="eyebrow">NEWS CENTER</span>
                <h1>新闻资讯</h1>
                <p>公司要闻、基层动态与科技前沿，一处阅览 · <router-link to="/cooper/search">按时间轴检索新闻与公告 →</router-link></p>
            </div>
        </header>
        <div class="news-list-layout">
            <aside class="channel-rail">
                <small>频道</small
                ><LoadState :loading="channels.pending.value" :error="channels.error.value" variant="editorial" @retry="channels.load"
                    ><template #skeleton><NewsSkeleton kind="channels" /></template><button
                        v-for="c in flattened"
                        :key="c.Id"
                        :class="{ active: c.DxE_id === channelId, child: !!c.Parentid }"
                        @click="setQuery({ channel: c.DxE_id, page: 1 })"
                    >
                        {{ c.Title }}
                    </button></LoadState
                >
            </aside>
            <main>
                <div class="list-subheading">
                    <h2>{{ currentChannel?.Title || '新闻' }}</h2>
                    <el-skeleton v-if="list.pending.value || channels.pending.value" animated class="news-count-skeleton" aria-hidden="true"><template #template><el-skeleton-item /></template></el-skeleton>
                    <small v-else>共 {{ list.data.value?.count || 0 }} 篇</small>
                </div>
                <LoadState
                    :loading="list.pending.value || channels.pending.value"
                    :error="list.error.value || channels.error.value"
                    :empty="!list.data.value?.arr.length"
                    :rows="8"
                    variant="editorial"
                    @retry="list.load"
                    ><template #skeleton><NewsSkeleton kind="list" :featured="page === 1" /></template><template v-if="lead"
                        ><router-link :to="newsLink(lead.Id, (page - 1) * 8 + 1)" class="news-list-lead"
                            ><img :src="lead.Cover" alt="" />
                            <div>
                                <span class="eyebrow">头条</span>
                                <h2>{{ lead.Title }}</h2>
                                <p>{{ lead.Abstract }}</p>
                                <small>{{ lead.Author }} · {{ lead.CreateTime.slice(0, 10) }}　<Eye :size="13" /> {{ lead.Hits }}</small>
                            </div></router-link
                        ></template
                    ><router-link v-for="(n, i) in rest" :key="n.Id" :to="newsLink(n.Id, (page - 1) * 8 + i + (lead ? 2 : 1))" class="news-list-row"
                        ><div>
                            <h3><em v-if="n.IsTop === 1">置顶</em>{{ n.Title }}</h3>
                            <p>{{ n.Abstract }}</p>
                            <small>{{ n.Author }}　{{ n.CreateTime.slice(0, 10) }}　<Eye :size="13" /> {{ n.Hits }}</small>
                        </div>
                        <img v-if="n.isImage && n.Cover" :src="n.Cover" alt="" /></router-link
                    ><el-pagination
                        :current-page="page"
                        :page-size="8"
                        :total="list.data.value?.count || 0"
                        layout="prev,pager,next,total"
                        @current-change="setQuery({ page: $event })"
                /></LoadState>
            </main>
            <aside class="news-side">
                <h3>文字快报</h3>
                <LoadState :loading="briefs.pending.value" :error="briefs.error.value" variant="editorial" @retry="briefs.load"
                    ><template #skeleton><NewsSkeleton kind="briefs" /></template><router-link v-for="n in briefs.data.value" :key="n.Id" :to="newsLink(n.Id)"
                        ><h4>{{ n.Title }}</h4>
                        <small>{{ n.CreateTime.slice(0, 10) }}</small></router-link
                    ></LoadState
                >
            </aside>
        </div>
    </div>
</template>
<script setup lang="ts">
import { computed, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Eye } from 'lucide-vue-next'
import * as api from '../api'
import { useResource } from '../useResource'
import { newsLink } from '../links'
import LoadState from '../components/LoadState.vue'
import NewsSkeleton from '../components/NewsSkeleton.vue'
import { portalEvents } from '../realtime'
const route = useRoute(),
    router = useRouter()
const channels = useResource(api.getnewscenterapi),
    briefs = useResource(() => api.getNewsKuaiBao(6))
const flatten = (items: api.ChannelChildrenDto[]): api.ChannelChildrenDto[] => items.flatMap((c) => [c, ...flatten(c.children || [])])
const flattened = computed(() => flatten(channels.data.value || [])),
    channelId = computed(() => Number(route.query.channel) || flattened.value[0]?.DxE_id),
    page = computed(() => Math.max(1, Number(route.query.page) || 1))
const currentChannel = computed(() => flattened.value.find((c) => c.DxE_id === channelId.value))
const list = useResource(async () =>
    channelId.value ? api.getNewsDetail({ ChannelID: channelId.value, Page: page.value, Limit: 8 }) : { arr: [], count: 0, data: null as never }
)
watch(
    () => [channelId.value, page.value],
    () => {
        void list.load()
    }
)
const lead = computed(() => (page.value === 1 && list.data.value?.arr[0]?.isImage ? list.data.value.arr[0] : null))
const rest = computed(() => (lead.value ? list.data.value?.arr.slice(1) : list.data.value?.arr))
function reloadNews() {
    void list.load()
    void briefs.load()
}
portalEvents.on('news', reloadNews)
onBeforeUnmount(() => portalEvents.off('news', reloadNews))
function setQuery(patch: Record<string, string | number>) {
    router.push({ query: { ...route.query, ...patch } })
}
</script>
