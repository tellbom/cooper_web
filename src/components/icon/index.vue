<script lang="ts">
import { createVNode, getCurrentInstance, defineComponent, computed, type CSSProperties } from 'vue'
export default defineComponent({
    name: 'Icon',
    props: {
        name: {
            type: String,
            required: true,
        },
        size: {
            type: String,
            default: '18px',
        },
        color: {
            type: String,
            default: '#000000',
        },
    },
    setup(props) {
        const instance = getCurrentInstance()
        const iconStyle = computed((): CSSProperties => {
            const { size, color } = props
            let s = `${size.replace('px', '')}px`
            return {
                fontSize: s,
                color: color,
            }
        })

        return () => {
            const name = props.name.trim()
            const componentName = name.startsWith('el-icon-') ? name : 'el-icon-' + name
            const component = instance?.appContext.components[componentName]
            if (component) return createVNode('span', { class: 'icon el-icon', style: iconStyle.value }, [createVNode(component)])
            return createVNode('i', { class: [name, 'icon'], style: iconStyle.value })
        }
    },
})
</script>
