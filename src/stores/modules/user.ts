import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'

import { getUserInfo, login, logout } from '@/api/user'
import { TOKEN_KEY } from '@/enums/cacheEnums'
import { PageEnum } from '@/enums/pageEnum'
import { MenuEnum } from '@/enums/appEnums'
import router, { filterAsyncRoutes } from '@/router'
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
                        this.routes = filterAsyncRoutes(injectLeaderboardAfterWorkbench(data.menu))
                        resolve(data)
                    })
                    .catch((error) => {
                        reject(error)
                    })
            })
        }
    }
})

// ============ 前端注入「榜单管理」菜单（顶级分类，排在「工作台」下方，不走后端接口）============
// 说明：仅在后端「权限管理-菜单」尚未配置榜单管理时使用；若后端已配置，请移除此注入以免菜单重复。
function buildLeaderboardMenu(listActivePath: string) {
    return {
        paths: 'leaderboard',
        name: '榜单管理',
        type: MenuEnum.CATALOGUE,
        is_show: 1,
        is_cache: 0,
        children: [
            {
                paths: 'index',
                name: '榜单列表',
                type: MenuEnum.MENU,
                component: 'leaderboard/index',
                is_show: 1,
                is_cache: 0
            },
            {
                paths: 'detail',
                name: '查看榜单',
                type: MenuEnum.MENU,
                component: 'leaderboard/detail',
                is_show: 0,
                selected: listActivePath
            }
        ]
    }
}

// 把「榜单管理」作为顶级分类，插入到「工作台」菜单项的正下方（与其同级，不嵌套）
function injectLeaderboardAfterWorkbench(menu: any[]) {
    const leaderboard = buildLeaderboardMenu('/leaderboard/index')
    const wbIndex = menu.findIndex(
        (n) => n.name === '工作台' || (n.paths || '').toLowerCase().includes('workbench')
    )
    if (wbIndex !== -1) {
        // 复用「工作台」图标，视觉统一；插到工作台之后
        leaderboard.icon = menu[wbIndex].icon
        menu.splice(wbIndex + 1, 0, leaderboard)
    } else {
        // 兜底：找不到工作台时追加到末尾，保证可见
        menu.push(leaderboard)
    }
    return menu
}

export default useUserStore
