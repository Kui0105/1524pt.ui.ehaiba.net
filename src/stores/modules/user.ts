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
                        this.routes = filterAsyncRoutes(injectLeaderboardUnderWorkbench(data.menu))
                        resolve(data)
                    })
                    .catch((error) => {
                        reject(error)
                    })
            })
        }
    }
})

// ============ 前端注入「榜单管理」菜单（挂在「工作台」下，不走后端接口）============
// 说明：仅在后端「权限管理-菜单」尚未配置榜单管理时使用；若后端已配置，请移除此注入以免菜单重复。
function findMenuNode(list: any[], predicate: (n: any) => boolean): any {
    for (const node of list) {
        if (predicate(node)) return node
        if (node.children && node.children.length) {
            const found = findMenuNode(node.children, predicate)
            if (found) return found
        }
    }
    return null
}

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

// 把「榜单管理」挂到「工作台」节点下；工作台若为叶子菜单则自动转为目录并保留原首页入口
function injectLeaderboardUnderWorkbench(menu: any[]) {
    const wb = findMenuNode(menu, (n) => n.name === '工作台' || (n.paths || '').toLowerCase().includes('workbench'))
    if (!wb) {
        // 兜底：找不到工作台时作为顶层菜单展示，保证可见
        menu.push(buildLeaderboardMenu('/leaderboard/index'))
        return menu
    }
    const wbPaths = (wb.paths || 'workbench').replace(/^\/+/, '')
    const listActivePath = `/${wbPaths}/leaderboard/index`
    const leaderboard = buildLeaderboardMenu(listActivePath)
    leaderboard.icon = wb.icon // 复用工作台图标，视觉统一
    if (!wb.children) wb.children = []
    // 工作台原为叶子菜单：转为目录，并把原首页提升为子项(路径留空, 保持 /workbench 可访问)
    if (wb.type === MenuEnum.MENU && wb.children.length === 0) {
        wb.children.unshift({
            paths: '',
            name: wb.name,
            type: MenuEnum.MENU,
            component: wb.component,
            icon: wb.icon,
            is_show: 1,
            is_cache: wb.is_cache ?? 0
        })
        wb.type = MenuEnum.CATALOGUE
    }
    wb.children.push(leaderboard)
    return menu
}

export default useUserStore
