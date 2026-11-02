export interface PermissionFixture {
    can(permissionCode: string): boolean
    assert(permissionCode: string): void
}

/** 仅供组件测试和 Story 场景使用；生产权限仍来自远端 RBAC 与 v-auth。 */
export const createPermissionFixture = (granted: Iterable<string>): PermissionFixture => {
    const permissions = new Set(granted)
    return {
        can: (permissionCode) => permissions.has('*') || permissions.has(permissionCode),
        assert(permissionCode) {
            if (!permissions.has('*') && !permissions.has(permissionCode)) throw new Error(`Permission denied: ${permissionCode}`)
        },
    }
}
