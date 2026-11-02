<template>
    <PortalCard
        title="新闻中心"
        :icon="Reading"
        more="更多"
        class="news-card"
        @more="router.push({ path: '/cooper/news', query: channelId ? { channel: channelId } : {} })"
    >
        <template #tabs
            ><div class="line-tabs compact-tabs">
                <button v-for="t in tabs" :key="t" :class="{ active: tab === t }" @click="tab = t">{{ t }}</button>
            </div></template
        >
        <LoadState
            :loading="current.pending.value"
            variant="news"
            :error="current.error.value"
            :empty="!items?.length"
            :rows="8"
            @retry="current.load"
        >
            <template v-if="tab === '图片新闻'">
                <el-carousel class="photo-hero" height="100%" :interval="5000" arrow="hover" trigger="click" :pause-on-hover="true"
                    ><el-carousel-item v-for="n in carouselPhotos" :key="n.Id" :data-news-id="n.Id"
                        ><img class="hero-photo" :src="n.Cover" alt="" />
                        <div class="photo-shade" />
                        <button class="photo-caption" @click="open(n.Id)">
                            <h3>{{ n.Title }}</h3>
                            <p>{{ n.Abstract }}</p>
                            <small
                                ><span><CalendarDays :size="13" />{{ n.CreateTime.slice(0, 10) }}</span
                                ><span><Eye :size="13" />浏览量 {{ n.Hits.toLocaleString() }}</span></small
                            >
                        </button></el-carousel-item
                    ></el-carousel
                >
                <div class="news-thumbnails">
                    <button v-for="n in thumbnailPhotos" :key="n.Id" :data-news-id="n.Id" @click="open(n.Id)">
                        <img :src="n.Cover" alt="" /><b>{{ n.Title }}</b
                        ><small>{{ n.CreateTime.slice(0, 10) }}</small>
                    </button>
                </div>
            </template>
            <div v-else-if="tab === '文字新闻'" class="text-news">
                <button v-if="briefs.data.value?.[0]" class="brief-lead" @click="open(briefs.data.value[0].Id)">
                    <small class="eyebrow">头条快报</small>
                    <h3>{{ briefs.data.value[0].Title }}</h3>
                    <p>{{ api.htmlText(briefs.data.value[0].Content) }}</p>
                    <footer>{{ briefs.data.value[0].Author }}　|　{{ briefs.data.value[0].CreateTime.slice(0, 10) }}</footer>
                </button>
                <ol class="scroll-area">
                    <li v-for="(n, i) in briefs.data.value?.slice(1)" :key="n.Id">
                        <button @click="open(n.Id)">
                            <span>{{ String(i + 2).padStart(2, '0') }}</span>
                            <div>
                                <h4>{{ n.Title }}</h4>
                                <small>{{ n.Author }}　{{ n.CreateTime.slice(0, 10) }}</small>
                            </div>
                        </button>
                    </li>
                </ol>
            </div>
            <div v-else-if="tab === '质量快报'" class="quality-grid">
                <button v-for="n in channel.data.value?.arr" :key="n.Id" @click="open(n.Id)">
                    <img :src="n.Cover" alt="" /><span
                        ><b>{{ n.Title }}</b
                        ><small>{{ n.CreateTime.slice(0, 10) }}</small></span
                    >
                </button>
            </div>
            <div v-else class="tech-news-split">
                <div class="tech-image-column scroll-area">
                    <button v-for="n in channel.data.value?.arr.filter((n) => n.isImage)" :key="n.Id" @click="open(n.Id)">
                        <img :src="n.Cover" alt="" /><span
                            ><h4>{{ n.Title }}</h4>
                            <p>{{ n.Abstract }}</p>
                            <small
                                >{{ n.CreateTime.slice(0, 10) }} <span><Eye :size="12" />{{ n.Hits }}</span></small
                            ></span
                        >
                    </button>
                </div>
                <div class="tech-text-column scroll-area">
                    <button v-for="n in channel.data.value?.arr.filter((n) => !n.isImage)" :key="n.Id" @click="open(n.Id)">
                        <h4>{{ n.Title }}</h4>
                        <p>{{ n.Abstract }}</p>
                        <small>{{ n.Author }} · {{ n.CreateTime.slice(0, 10) }}</small>
                    </button>
                </div>
            </div>
        </LoadState>
    </PortalCard>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Newspaper as Reading, Eye, CalendarDays } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import * as api from '../api'
import { newsLink } from '../links'
import { useResource } from '../useResource'
import { portalEvents } from '../realtime'
import PortalCard from './PortalCard.vue'
import LoadState from './LoadState.vue'
const tabs = ['图片新闻', '文字新闻', '先进科技', '质量快报'],
    tab = ref(tabs[0]),
    router = useRouter()
const channels = useResource(api.getnewscenterapi),
    photos = useResource(() => api.getnewsimgApi({ Type: '0', Pageindex: 1, Pagesize: 7 })),
    briefs = useResource(() => api.getNewsKuaiBao(10))
const channelId = computed(() => channels.data.value?.find((c) => c.Title === tab.value)?.DxE_id)
const channel = useResource(async () =>
    channelId.value ? api.getNewsDetail({ ChannelID: channelId.value, Page: 1, Limit: 6 }) : { arr: [], count: 0, data: null as never }
)
watch(channelId, () => channel.load())
const current = computed(() => (tab.value === '图片新闻' ? photos : tab.value === '文字新闻' ? briefs : channel))
const items = computed(() => (tab.value === '图片新闻' ? photos.data.value : tab.value === '文字新闻' ? briefs.data.value : channel.data.value?.arr))
const photoItems = computed(() => {
    const ids = new Set<string>()
    return (photos.data.value || []).filter(n => {
        if (ids.has(n.Id)) return false
        ids.add(n.Id)
        return true
    }).slice(0, 7)
})
const carouselPhotos = computed(() => photoItems.value.slice(0, 4))
const thumbnailPhotos = computed(() => photoItems.value.slice(4, 7))
const open = (id: string) => router.push(newsLink(id))
function reload() {
    void photos.load()
    void briefs.load()
    if (channelId.value) void channel.load()
}
portalEvents.on('news', reload)
onBeforeUnmount(() => {
    portalEvents.off('news', reload)
})
</script>
