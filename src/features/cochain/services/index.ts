import type { ResourceKey, ResourceTypeMap } from '../contracts'
import { createHttpResourceService } from './httpAdapter'
import { createMockResourceService } from './mockAdapter'
import type { ResourceService } from './types'

const useMock = String(import.meta.env.VITE_COCHAIN_USE_MOCK).toLowerCase() === 'true'
const cache = new Map<ResourceKey, ResourceService<any>>()

export const getResourceService = <K extends ResourceKey>(key: K): ResourceService<ResourceTypeMap[K]> => {
    if (!cache.has(key)) cache.set(key, useMock ? createMockResourceService(key) : createHttpResourceService(key))
    return cache.get(key)! as ResourceService<ResourceTypeMap[K]>
}

export { setMockScenario } from './mockAdapter'
export type { MockScenario, ResourceService } from './types'
