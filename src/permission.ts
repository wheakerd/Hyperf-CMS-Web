import router from './router'
import { RouteRecordRaw } from 'vue-router'
import { useTitle } from '@/hooks/web/useTitle'
import { useNProgress } from '@/hooks/web/useNProgress'
import { usePermissionStore, usePermissionStoreWithOut } from '@/store/modules/permission'
import { usePageLoading } from '@/hooks/web/usePageLoading'
import { NO_REDIRECT_WHITE_LIST } from '@/constants'
import { useUserStoreWithOut } from '@/store/modules/user'
import { getRoutesApi } from '@/api/login'

const { start, done } = useNProgress()

const { loadStart, loadDone } = usePageLoading()

router.beforeEach(async (to, from, next) => {
    start()
    loadStart()
    const permissionStore = usePermissionStoreWithOut()
    const userStore = useUserStoreWithOut()
    if (userStore.getToken) {
        if (to.path === '/login') {
            next({ path: '/' })
        } else {
            if (permissionStore.getIsAddRouters) {
                next()
                return
            }

            // 开发者可根据实际情况进行修改
            const res = await getRoutesApi()
            if (res) {
                const routers = res.data || []
                userStore.setRoleRouters(routers)

                const permissionStore = usePermissionStore()

                await permissionStore.generateRoutes('server', routers)

                permissionStore.getAddRouters.forEach((route) => {
                    router.addRoute(route as unknown as RouteRecordRaw) // 动态添加可访问路由表
                })

                const redirectPath = from.query.redirect || to.path
                const redirect = decodeURIComponent(redirectPath as string)
                const nextData =
                    to.path === redirect ? { ...to, replace: true } : { path: redirect }
                permissionStore.setIsAddRouters(true)
                next(nextData)
            }
        }
    } else {
        if (NO_REDIRECT_WHITE_LIST.indexOf(to.path) !== -1) {
            next()
        } else {
            next(`/login?redirect=${to.path}`) // 否则全部重定向到登录页
        }
    }
})

router.afterEach((to) => {
    useTitle(to?.meta?.title as string)
    done() // 结束Progress
    loadDone()
})
