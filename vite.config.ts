import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import type { ConfigEnv, UserConfig } from 'vite'
import { loadEnv } from 'vite'

const pathResolve = (dir: string): any => {
    return resolve(__dirname, '.', dir)
}

const viteConfig = ({ mode }: ConfigEnv): UserConfig => {
    const env = loadEnv(mode, process.cwd())
    const { VITE_PORT, VITE_OPEN, VITE_BASE_PATH, VITE_OUT_DIR, VITE_RBAC_BASE_URL } = env
    const serviceGateways:Record<string,string> = {cooperRouter:'VITE_COOPER_API_TARGET',newOARouter:'VITE_NEW_OA_API_TARGET',processRouter:'VITE_PROCESS_API_TARGET',MessageCenter:'VITE_MESSAGE_API_TARGET',likeFeatureUrl:'VITE_LIKE_API_TARGET',YiyanQC:'VITE_QUALITY_API_TARGET',aurasearchserviceUrl:'VITE_AURA_URL'}
    const serviceProxies=Object.fromEntries(Object.entries(serviceGateways).filter(([,key])=>!!env[key]).map(([prefix,key])=>['/'+prefix,{target:env[key],changeOrigin:true,rewrite:(path:string)=>path.replace('/'+prefix,'')}]))

    const alias: Record<string, string> = {
        '/@': pathResolve('./src/'),
        assets: pathResolve('./src/assets'),
        'vue-i18n': mode === 'production' ? 'vue-i18n/dist/vue-i18n.cjs.prod.js' : 'vue-i18n/dist/vue-i18n.cjs.js',
    }

    return {
        plugins: [vue()],
        root: process.cwd(),
        resolve: { alias },
        base: VITE_BASE_PATH,
        server: {
            host: true,
            port: parseInt(VITE_PORT),
            open: VITE_OPEN != 'false',
            proxy: {
                ...serviceProxies,
                '/rbacServer': {
                    target: VITE_RBAC_BASE_URL,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/rbacServer/, ''),
                },
            },
        },
        build: {
            target: 'chrome109',
            cssTarget: 'chrome109',
            cssCodeSplit: false,
            sourcemap: false,
            outDir: VITE_OUT_DIR,
            emptyOutDir: true,
            chunkSizeWarningLimit: 1500,
            rollupOptions: {
                output: {
                    manualChunks: {
                        vue: ['vue', 'vue-router', 'pinia', 'vue-i18n', 'element-plus'],
                    },
                },
            },
        },
    }
}

export default viteConfig
