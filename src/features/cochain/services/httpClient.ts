import axios, { type AxiosInstance } from 'axios'
import { useAdminInfo } from '/@/stores/adminInfo'

export const client: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_AXIOS_BASE_URL || '',
    timeout: 20_000,
})

client.interceptors.request.use((config) => {
    const token = useAdminInfo().token
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})
