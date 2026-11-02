<script lang="ts">
import { createVNode, resolveComponent, defineComponent, computed, type CSSProperties } from 'vue'
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
        const iconStyle = computed((): CSSProperties => {
            const { size, color } = props
            let s = `${size.replace('px', '')}px`
            return {
                fontSize: s,
                color: color,
            }
        })

        if (props.name.indexOf('el-icon-') === 0) {
            return () => createVNode('el-icon', { class: 'icon el-icon', style: iconStyle.value }, [createVNode(resolveComponent(props.name))])
        } else {
            return () => createVNode('i', { class: [props.name, 'icon'], style: iconStyle.value })
        }
    },
})
</script>
