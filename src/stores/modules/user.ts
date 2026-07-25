import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'

import { getUserInfo, login, logout } from '@/api/user'
import { TOKEN_KEY } from '@/enums/cacheEnums'
import { MenuEnum } from '@/enums/appEnums'
import { PageEnum } from '@/enums/pageEnum'
import router, { filterAsyncRoutes } from '@/router'
import { LAYOUT } from '@/router/routes'
import { clearAuthInfo, getToken } from '@/utils/auth'
import cache from '@/utils/cache'

export interface UserState {
    token: string
    userInfo: Record<string, any>
    routes: RouteRecordRaw[]
    perms: string[]
}

const useUserStore = defineStore({
    id: 'user',
    state: (): UserState => ({
        token: getToken() || '',
        // 用户信息
        userInfo: {},
        // 路由
        routes: [],
        // 权限
        perms: []
    }),
    getters: {},
    actions: {
        resetState() {
            this.token = ''
            this.userInfo = {}
            this.perms = []
        },
        login(playload: any) {
            const { account, password } = playload
            return new Promise((resolve, reject) => {
                login({
                    account: account.trim(),
                    password: password
                })
                    .then((data) => {
                        this.token = data.token
                        cache.set(TOKEN_KEY, data.token)
                        resolve(data)
                    })
                    .catch((error) => {
                        reject(error)
                    })
            })
        },
        logout() {
            return new Promise((resolve, reject) => {
                logout()
                    .then(async (data) => {
                        this.token = ''
                        await router.push(PageEnum.LOGIN)
                        clearAuthInfo()
                        resolve(data)
                    })
                    .catch((error) => {
                        reject(error)
                    })
            })
        },
        getUserInfo() {
            return new Promise((resolve, reject) => {
                getUserInfo()
                    .then((data) => {
                        this.userInfo = data.user
                        this.perms = data.permissions
                        this.routes = filterAsyncRoutes(data.menu).concat(buildLeaderboardMenu())
                        resolve(data)
                    })
                    .catch((error) => {
                        reject(error)
                    })
            })
        }
    }
})

export default useUserStore

// 前端注入「榜单管理」菜单：后端菜单管理未配置时的可见入口
// 结构：榜单管理(catalogue) -> 榜单列表(menu, 可见) / 查看榜单(menu, 隐藏, 供跳转)
function buildLeaderboardMenu() {
    return [
        {
            path: '/leaderboard',
            name: Symbol('leaderboard'),
            meta: {
                title: '榜单管理',
                type: MenuEnum.CATALOGUE
            },
            component: LAYOUT,
            children: [
                {
                    path: 'index',
                    name: Symbol('leaderboard-index'),
                    meta: {
                        title: '榜单列表',
                        type: MenuEnum.MENU,
                        activeMenu: '/leaderboard'
                    },
                    component: () => import('@/views/leaderboard/index.vue')
                },
                {
                    path: 'detail',
                    name: Symbol('leaderboard-detail'),
                    meta: {
                        title: '查看榜单',
                        type: MenuEnum.MENU,
                        hidden: true,
                        activeMenu: '/leaderboard'
                    },
                    component: () => import('@/views/leaderboard/detail.vue')
                }
            ]
        }
    ]
}
