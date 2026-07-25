<template>
    <div class="leaderboard-detail">
        <el-card class="!border-none" shadow="never">
            <el-page-header :content="board?.name || '查看榜单'" @back="$router.back()" />
            <div v-if="board" class="meta mt-3 text-tx-secondary text-sm flex flex-wrap gap-x-6">
                <span>状态：<el-tag :type="statusTagType(board.status)" size="small">{{
                    statusLabel(board.status)
                }}</el-tag></span>
                <span>开始：{{ board.start_time }}</span>
                <span>结束：{{ board.end_time }}</span>
            </div>
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
            <el-tabs v-model="activeTab" @tab-change="onTabChange">
                <!-- DM榜单 -->
                <el-tab-pane label="DM榜单" name="dm">
                    <div class="tab-toolbar">
                        <el-input
                            v-model="searchDm"
                            placeholder="输入DM姓名搜索"
                            clearable
                            class="!w-[260px]"
                            @keyup.enter="filterDm"
                            @clear="filterDm"
                        />
                        <div class="flex-1" />
                        <el-button type="primary" @click="exportCurrentTab">
                            导出
                        </el-button>
                    </div>
                    <el-table size="large" :data="dmFiltered" stripe>
                        <el-table-column label="排名" width="100" align="center">
                            <template #default="{ $index }">
                                <span
                                    class="inline-block w-7 h-7 leading-7 rounded-full text-xs"
                                    :class="rankClass($index + 1)"
                                >
                                    {{ $index + 1 }}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column label="DM" min-width="200">
                            <template #default="{ row }">
                                <div class="flex items-center">
                                    <el-avatar :size="32" :src="row.avatar" class="mr-2" />
                                    <span>{{ row.name }}</span>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column label="本期积分" align="right" min-width="140">
                            <template #default="{ row }">
                                <span class="text-primary font-medium">
                                    {{ row.score.toLocaleString() }}
                                </span>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-tab-pane>

                <!-- 玩家榜单 -->
                <el-tab-pane label="玩家榜单" name="player">
                    <div class="tab-toolbar">
                        <el-input
                            v-model="searchPlayer"
                            placeholder="输入玩家昵称搜索"
                            clearable
                            class="!w-[260px]"
                            @keyup.enter="filterPlayer"
                            @clear="filterPlayer"
                        />
                        <div class="flex-1" />
                        <el-button type="primary" @click="exportCurrentTab">
                            导出
                        </el-button>
                    </div>
                    <el-table size="large" :data="playerFiltered" stripe>
                        <el-table-column label="排名" width="100" align="center">
                            <template #default="{ $index }">
                                <span
                                    class="inline-block w-7 h-7 leading-7 rounded-full text-xs"
                                    :class="rankClass($index + 1)"
                                >
                                    {{ $index + 1 }}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column label="玩家" min-width="200">
                            <template #default="{ row }">
                                <div class="flex items-center">
                                    <el-avatar :size="32" :src="row.avatar" class="mr-2" />
                                    <span>{{ row.nickname }}</span>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column label="本期打赏积分" align="right" min-width="160">
                            <template #default="{ row }">
                                <span class="text-primary font-medium">
                                    {{ row.score.toLocaleString() }}
                                </span>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-tab-pane>

                <!-- 打赏明细 -->
                <el-tab-pane label="打赏明细" name="detail">
                    <div class="tab-toolbar">
                        <el-input
                            v-model="searchDetail"
                            placeholder="输入玩家昵称或DM姓名"
                            clearable
                            class="!w-[260px]"
                            @keyup.enter="filterDetail"
                            @clear="filterDetail"
                        />
                        <el-date-picker
                            v-model="detailRange"
                            type="datetimerange"
                            range-separator="至"
                            start-placeholder="开始时间"
                            end-placeholder="结束时间"
                            format="YYYY-MM-DD HH:mm:ss"
                            value-format="YYYY-MM-DD HH:mm:ss"
                            class="!w-[420px]"
                            @change="filterDetail"
                        />
                        <div class="flex-1" />
                        <el-button type="primary" @click="exportCurrentTab">
                            导出
                        </el-button>
                    </div>
                    <el-table size="large" :data="detailFiltered" stripe>
                        <el-table-column label="玩家" min-width="180">
                            <template #default="{ row }">
                                <div class="flex items-center">
                                    <el-avatar :size="32" :src="row.avatar" class="mr-2" />
                                    <span>{{ row.nickname }}</span>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column label="打赏DM" prop="dm_name" min-width="140" />
                        <el-table-column label="打赏积分" align="right" width="120">
                            <template #default="{ row }">
                                <span class="text-primary font-medium">
                                    +{{ row.score.toLocaleString() }}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column label="打赏时间" prop="time" align="right" width="180" />
                    </el-table>
                </el-tab-pane>
            </el-tabs>
        </el-card>
    </div>
</template>

<script lang="ts" setup name="leaderboardDetail">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import feedback from '@/utils/feedback'

// ====== 榜单基础信息（mock，从路由 id 找）======
type Status = 0 | 1 | 2
interface BoardInfo {
    id: number
    name: string
    start_time: string
    end_time: string
    status: Status
}
const allBoards: BoardInfo[] = [
    {
        id: 1,
        name: '2026年Q2榜首争夺战',
        start_time: '2026-04-01 00:00:00',
        end_time: '2026-06-30 23:59:59',
        status: 1
    },
    {
        id: 2,
        name: '2026年Q3榜首争夺战',
        start_time: '2026-07-01 00:00:00',
        end_time: '2026-09-30 23:59:59',
        status: 1
    },
    {
        id: 3,
        name: '2026年暑期特别榜',
        start_time: '2026-07-15 00:00:00',
        end_time: '2026-08-15 23:59:59',
        status: 1
    },
    {
        id: 4,
        name: '2026年中秋榜',
        start_time: '2026-09-10 00:00:00',
        end_time: '2026-09-17 23:59:59',
        status: 0
    },
    {
        id: 5,
        name: '2026年国庆榜',
        start_time: '2026-10-01 00:00:00',
        end_time: '2026-10-07 23:59:59',
        status: 0
    },
    {
        id: 6,
        name: '2026年新春榜',
        start_time: '2026-02-01 00:00:00',
        end_time: '2026-02-15 23:59:59',
        status: 2
    }
]

const route = useRoute()
const boardId = computed(() => Number(route.query.id) || 0)
const board = computed(() => allBoards.find((b) => b.id === boardId.value))

const statusLabel = (s: Status | ''): string => {
    if (s === 0) return '未开始'
    if (s === 1) return '进行中'
    if (s === 2) return '已结束'
    return ''
}
const statusTagType = (s: Status): '' | 'success' | 'warning' | 'info' => {
    if (s === 0) return 'info'
    if (s === 1) return 'success'
    return 'warning'
}
const rankClass = (rank: number) => {
    if (rank === 1) return 'bg-red-500 text-white'
    if (rank === 2) return 'bg-orange-400 text-white'
    if (rank === 3) return 'bg-yellow-400 text-white'
    return 'bg-gray-200 text-gray-600'
}

// ====== DM 榜单 mock ======
const dmRankAll = ref([
    { name: '夜行者', score: 9820, avatar: '' },
    { name: '白茶清欢', score: 8650, avatar: '' },
    { name: '孤城闭', score: 7430, avatar: '' },
    { name: '青衫客', score: 6910, avatar: '' },
    { name: '南风知我意', score: 6280, avatar: '' },
    { name: '月下独酌', score: 5740, avatar: '' },
    { name: '云深不知处', score: 5120, avatar: '' },
    { name: '长安忆', score: 4680, avatar: '' },
    { name: '春风不解意', score: 4050, avatar: '' },
    { name: '一纸荒年', score: 3640, avatar: '' },
    { name: '梦里花落', score: 3120, avatar: '' },
    { name: '烟雨江南', score: 2780, avatar: '' }
])
const searchDm = ref('')
const dmFiltered = computed(() => {
    const k = searchDm.value.trim()
    return k ? dmRankAll.value.filter((r) => r.name.includes(k)) : dmRankAll.value
})
const filterDm = () => {
    /* computed 自动响应 */
}

// ====== 玩家榜单 mock ======
const playerRankAll = ref([
    { nickname: '听风者', score: 4200, avatar: '' },
    { nickname: '半夏微凉', score: 3850, avatar: '' },
    { nickname: '山有木兮', score: 3420, avatar: '' },
    { nickname: '南风未起', score: 3100, avatar: '' },
    { nickname: '听雪落', score: 2780, avatar: '' },
    { nickname: '小满未满', score: 2540, avatar: '' },
    { nickname: '云归处', score: 2210, avatar: '' },
    { nickname: '长安故里', score: 1980, avatar: '' },
    { nickname: '春风十里', score: 1650, avatar: '' },
    { nickname: '旧巷听雨', score: 1420, avatar: '' },
    { nickname: '江南可采莲', score: 1180, avatar: '' },
    { nickname: '陌上花开', score: 980, avatar: '' }
])
const searchPlayer = ref('')
const playerFiltered = computed(() => {
    const k = searchPlayer.value.trim()
    return k ? playerRankAll.value.filter((r) => r.nickname.includes(k)) : playerRankAll.value
})
const filterPlayer = () => {
    /* computed 自动响应 */
}

// ====== 打赏明细 mock ======
const detailAll = ref([
    { nickname: '听风者', dm_name: '夜行者', score: 200, time: '2026-07-23 11:08', avatar: '' },
    { nickname: '半夏微凉', dm_name: '白茶清欢', score: 500, time: '2026-07-23 10:52', avatar: '' },
    { nickname: '山有木兮', dm_name: '孤城闭', score: 100, time: '2026-07-23 10:30', avatar: '' },
    { nickname: '南风未起', dm_name: '青衫客', score: 300, time: '2026-07-23 10:12', avatar: '' },
    { nickname: '听雪落', dm_name: '南风知我意', score: 800, time: '2026-07-23 09:48', avatar: '' },
    { nickname: '小满未满', dm_name: '月下独酌', score: 150, time: '2026-07-23 09:31', avatar: '' },
    { nickname: '云归处', dm_name: '云深不知处', score: 600, time: '2026-07-23 09:15', avatar: '' },
    { nickname: '长安故里', dm_name: '长安忆', score: 250, time: '2026-07-23 08:58', avatar: '' },
    { nickname: '春风十里', dm_name: '春风不解意', score: 400, time: '2026-07-23 08:33', avatar: '' },
    { nickname: '旧巷听雨', dm_name: '一纸荒年', score: 1000, time: '2026-07-23 08:12', avatar: '' },
    { nickname: '江南可采莲', dm_name: '梦里花落', score: 350, time: '2026-07-22 22:40', avatar: '' },
    { nickname: '陌上花开', dm_name: '烟雨江南', score: 180, time: '2026-07-22 21:15', avatar: '' },
    { nickname: '听风者', dm_name: '夜行者', score: 600, time: '2026-07-22 18:02', avatar: '' },
    { nickname: '半夏微凉', dm_name: '白茶清欢', score: 1200, time: '2026-07-22 15:24', avatar: '' }
])
const searchDetail = ref('')
const detailRange = ref<[string, string] | null>(null)
const detailFiltered = computed(() => {
    const k = searchDetail.value.trim()
    let list = detailAll.value
    if (k) {
        list = list.filter(
            (r) => r.nickname.includes(k) || r.dm_name.includes(k)
        )
    }
    if (detailRange.value && detailRange.value.length === 2) {
        const [a, b] = detailRange.value
        const toTs = (s: string) => new Date(s.replace(/-/g, '/')).getTime()
        list = list.filter((r) => {
            const t = new Date(r.time.replace(/-/g, '/')).getTime()
            return t >= toTs(a) && t <= toTs(b)
        })
    }
    return list
})
const filterDetail = () => {
    /* computed 自动响应 */
}

// ====== Tab 切换：导出同时只能针对一个 Tab ======
const activeTab = ref<'dm' | 'player' | 'detail'>('dm')
const onTabChange = (name: string | number) => {
    activeTab.value = name as 'dm' | 'player' | 'detail'
}

// ====== 导出（客户端 CSV，UTF-8 BOM，Excel 可直接打开）======
const exportCurrentTab = () => {
    const tabName = activeTab.value
    let headers: string[] = []
    let rows: (string | number)[][] = []
    let filename = ''
    if (tabName === 'dm') {
        headers = ['排名', 'DM姓名', '本期积分']
        rows = dmFiltered.value.map((r, i) => [i + 1, r.name, r.score])
        filename = (board.value?.name || 'DM榜单') + '-DM榜单'
    } else if (tabName === 'player') {
        headers = ['排名', '玩家昵称', '本期打赏积分']
        rows = playerFiltered.value.map((r, i) => [i + 1, r.nickname, r.score])
        filename = (board.value?.name || '玩家榜单') + '-玩家榜单'
    } else {
        headers = ['玩家昵称', '打赏DM', '打赏积分', '打赏时间']
        rows = detailFiltered.value.map((r) => [r.nickname, r.dm_name, r.score, r.time])
        filename = (board.value?.name || '打赏明细') + '-打赏明细'
    }
    const csv =
        '\uFEFF' +
        [headers, ...rows]
            .map((line) =>
                line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
            )
            .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename + '.xls'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    feedback.msgSuccess('已开始下载')
}

onMounted(() => {
    if (!board.value) feedback.msgError('未找到对应榜单')
})
</script>

<style lang="scss" scoped>
.leaderboard-detail {
    .tab-toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        flex-wrap: wrap;
    }
    .meta {
        line-height: 1.6;
    }
}
</style>