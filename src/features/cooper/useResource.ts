import { onBeforeUnmount, ref, shallowRef } from 'vue'
export function useResource<T>(fetcher: () => Promise<T>) {
    const data = shallowRef<T | null>(null),
        pending = ref(false),
        error = ref(''),
        failure = shallowRef<unknown>(null)
    let sequence = 0,
        disposed = false
    async function load() {
        const version = ++sequence
        pending.value = true
        error.value = ''
        failure.value = null
        try {
            const result = await fetcher()
            if (!disposed && version === sequence) data.value = result
        } catch (reason) {
            if (!disposed && version === sequence) {
                error.value = reason instanceof Error ? reason.message : '加载失败'
                failure.value = reason
            }
        } finally {
            if (!disposed && version === sequence) pending.value = false
        }
    }
    onBeforeUnmount(() => {
        disposed = true
        sequence++
    })
    void load()
    return { data, pending, error, failure, load }
}
