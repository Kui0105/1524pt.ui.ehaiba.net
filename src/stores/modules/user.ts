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
                        this.routes = filterAsyncRoutes(
                            injectScriptureConfigAfterScripture(
                                injectScriptureAfterDm(
                                    injectDmAfterLeaderboard(
                                        injectLeaderboardAfterWorkbench(data.menu)
                                    )
                                )
                            )
                        )
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

// ============ 前端注入「DM管理」菜单（顶级菜单，排在「榜单管理」下方，不走后端接口）============
// 说明：仅在后端「权限管理-菜单」尚未配置DM管理时使用；若后端已配置，请移除此注入以免菜单重复。
function buildDmMenu() {
    return {
        paths: 'dm',
        name: 'DM管理',
        type: MenuEnum.MENU,
        component: 'dm/index',
        is_show: 1,
        is_cache: 0
    }
}

// 把「DM管理」作为顶级菜单，插入到「榜单管理」菜单项的正下方（与其同级，不嵌套）
function injectDmAfterLeaderboard(menu: any[]) {
    const dm = buildDmMenu()
    const lbIndex = menu.findIndex(
        (n) => n.name === '榜单管理' || (n.paths || '').toLowerCase().includes('leaderboard')
    )
    if (lbIndex !== -1) {
        // 复用「榜单管理」图标，视觉统一
        dm.icon = menu[lbIndex].icon
        menu.splice(lbIndex + 1, 0, dm)
    } else {
        // 兜底：找不到榜单管理时追加到末尾
        menu.push(dm)
    }
    return menu
}

// ============ 前端注入「剧本管理」菜单（顶级分类，排在「DM管理」下方，不走后端接口）============
// 说明：仅在后端「权限管理-菜单」尚未配置剧本管理时使用；若后端已配置，请移除此注入以免菜单重复。
// 剧本管理下包含三个子菜单：剧本列表 / 分类列表 / 车次列表
function buildScriptureMenu() {
    return {
        paths: 'scripture',
        name: '剧本管理',
        type: MenuEnum.CATALOGUE,
        is_show: 1,
        is_cache: 0,
        children: [
            {
                paths: 'list',
                name: '剧本列表',
                type: MenuEnum.MENU,
                component: 'scripture/list',
                is_show: 1,
                is_cache: 0
            },
            {
                paths: 'category',
                name: '分类列表',
                type: MenuEnum.MENU,
                component: 'scripture/category',
                is_show: 1,
                is_cache: 0
            },
            {
                paths: 'schedule',
                name: '车次列表',
                type: MenuEnum.MENU,
                component: 'scripture/schedule',
                is_show: 1,
                is_cache: 0
            }
        ]
    }
}

// 把「剧本管理」作为顶级分类，插入到「DM管理」菜单项的正下方（与其同级，不嵌套）
function injectScriptureAfterDm(menu: any[]) {
    const sc = buildScriptureMenu()
    const dmIndex = menu.findIndex(
        (n) => n.name === 'DM管理' || (n.paths || '').toLowerCase() === 'dm'
    )
    if (dmIndex !== -1) {
        // 复用「DM管理」图标，视觉统一
        sc.icon = menu[dmIndex].icon
        menu.splice(dmIndex + 1, 0, sc)
    } else {
        // 兜底：找不到 DM 管理时追加到末尾
        menu.push(sc)
    }
    return menu
}

// ============ 前端注入「剧本配置」菜单（顶级菜单，排在「剧本管理」下方，不走后端接口）============
// 说明：仅在后端「权限管理-菜单」尚未配置剧本配置时使用；若后端已配置，请移除此注入以免菜单重复。
function buildScriptureConfigMenu() {
    return {
        paths: 'scripture-config',
        name: '剧本配置',
        type: MenuEnum.MENU,
        component: 'scripture/config',
        is_show: 1,
        is_cache: 0
    }
}

// 把「剧本配置」作为顶级菜单，插入到「剧本管理」菜单项的正下方（与其同级，不嵌套）
function injectScriptureConfigAfterScripture(menu: any[]) {
    const scConfig = buildScriptureConfigMenu()
    const scIndex = menu.findIndex(
        (n) => n.name === '剧本管理' || (n.paths || '').toLowerCase() === 'scripture'
    )
    if (scIndex !== -1) {
        // 复用「剧本管理」图标，视觉统一
        scConfig.icon = menu[scIndex].icon
        menu.splice(scIndex + 1, 0, scConfig)
    } else {
        // 兜底：找不到剧本管理时追加到末尾
        menu.push(scConfig)
    }
    return menu
}

export default useUserStore
