<template>
    <div class="workbench">
        <el-card class="!border-none mb-4" shadow="never">
            <template #header>
                <span class="card-title">数据概览</span>
            </template>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                    v-for="item in statCards"
                    :key="item.label"
                    class="rounded-lg px-5 py-6 flex flex-col"
                    :style="{ background: item.bg }"
                >
                    <div class="text-sm text-white/80">{{ item.label }}</div>
                    <div class="text-3xl font-semibold text-white mt-2">
                        {{ item.value }}
                    </div>
                    <div class="text-xs text-white/70 mt-1">{{ item.tip }}</div>
                </div>
            </div>
        </el-card>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <el-card class="!border-none" shadow="never">
                <template #header>
                    <div class="flex items-center justify-between">
                        <span class="card-title">本期打赏排名</span>
                        <span class="text-xs text-tx-secondary"
                            >统计当前正在进行中 DM 榜单打赏积分前十名</span
                        >
                    </div>
                </template>
                <el-table :data="dmRank" stripe>
                    <el-table-column label="排名" width="80" align="center">
                        <template #default="{ $index }">
                            <span
                                class="inline-block w-6 h-6 leading-6 rounded-full text-xs"
                                :class="rankClass($index + 1)"
                            >
                                {{ $index + 1 }}
                            </span>
                        </template>
                    </el-table-column>
                    <el-table-column label="DM" min-width="180">
                        <template #default="{ row }">
                            <div class="flex items-center">
                                <el-avatar
                                    :size="32"
                                    :src="row.avatar"
                                    class="mr-2"
                                />
                                <span>{{ row.name }}</span>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="积分数" align="right" min-width="120">
                        <template #default="{ row }">
                            <span class="text-primary font-medium">
                                {{ row.score.toLocaleString() }}
                            </span>
                        </template>
                    </el-table-column>
                </el-table>
            </el-card>

            <el-card class="!border-none" shadow="never">
                <template #header>
                    <div class="flex items-center justify-between">
                        <span class="card-title">最近打赏玩家</span>
                        <span class="text-xs text-tx-secondary"
                            >最新 10 条打赏记录</span
                        >
                    </div>
                </template>
                <el-table :data="recentReward" stripe>
                    <el-table-column label="玩家" min-width="160">
                        <template #default="{ row }">
                            <div class="flex items-center">
                                <el-avatar
                                    :size="32"
                                    :src="row.avatar"
                                    class="mr-2"
                                />
                                <span>{{ row.nickname }}</span>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="打赏DM" prop="dm_name" min-width="120" />
                    <el-table-column label="积分" align="right" width="100">
                        <template #default="{ row }">
                            <span class="text-primary font-medium">
                                +{{ row.score.toLocaleString() }}
                            </span>
                        </template>
                    </el-table-column>
                    <el-table-column
                        label="时间"
                        prop="time"
                        align="right"
                        width="170"
                    />
                </el-table>
            </el-card>
        </div>
    </div>
</template>

<script lang="ts" setup name="workbench">
// 顶部 4 张统计卡
const statCards = [
    {
        label: '在册DM数',
        value: '128',
        tip: '当前有效 DM 总人数',
        bg: 'linear-gradient(135deg, #5b8def 0%, #6fa8ff 100%)'
    },
    {
        label: '本期打赏积分数',
        value: '86,420',
        tip: '进行中 DM 榜单打赏积分总额',
        bg: 'linear-gradient(135deg, #36cbcb 0%, #5ce0d4 100%)'
    },
    {
        label: '累计打赏积分数',
        value: '1,256,890',
        tip: '历史累计打赏积分',
        bg: 'linear-gradient(135deg, #f0932b 0%, #ffb55c 100%)'
    },
    {
        label: '在册剧本数',
        value: '56',
        tip: '当前在售剧本数',
        bg: 'linear-gradient(135deg, #9b59b6 0%, #c39bd3 100%)'
    }
]

// 排名前三色
const rankClass = (rank: number) => {
    if (rank === 1) return 'bg-red-500 text-white'
    if (rank === 2) return 'bg-orange-400 text-white'
    if (rank === 3) return 'bg-yellow-400 text-white'
    return 'bg-gray-200 text-gray-600'
}

// mock：本期打赏排名前十
const dmRank = [
    { name: '夜行者', score: 9820, avatar: '' },
    { name: '白茶清欢', score: 8650, avatar: '' },
    { name: '孤城闭', score: 7430, avatar: '' },
    { name: '青衫客', score: 6910, avatar: '' },
    { name: '南风知我意', score: 6280, avatar: '' },
    { name: '月下独酌', score: 5740, avatar: '' },
    { name: '云深不知处', score: 5120, avatar: '' },
    { name: '长安忆', score: 4680, avatar: '' },
    { name: '春风不解意', score: 4050, avatar: '' },
    { name: '一纸荒年', score: 3640, avatar: '' }
]

// mock：最近 10 条打赏
const recentReward = [
    {
        nickname: '听风者',
        dm_name: '夜行者',
        score: 200,
        time: '2026-07-23 11:08',
        avatar: ''
    },
    {
        nickname: '半夏微凉',
        dm_name: '白茶清欢',
        score: 500,
        time: '2026-07-23 10:52',
        avatar: ''
    },
    {
        nickname: '山有木兮',
        dm_name: '孤城闭',
        score: 100,
        time: '2026-07-23 10:30',
        avatar: ''
    },
    {
        nickname: '南风未起',
        dm_name: '青衫客',
        score: 300,
        time: '2026-07-23 10:12',
        avatar: ''
    },
    {
        nickname: '听雪落',
        dm_name: '南风知我意',
        score: 800,
        time: '2026-07-23 09:48',
        avatar: ''
    },
    {
        nickname: '小满未满',
        dm_name: '月下独酌',
        score: 150,
        time: '2026-07-23 09:31',
        avatar: ''
    },
    {
        nickname: '云归处',
        dm_name: '云深不知处',
        score: 600,
        time: '2026-07-23 09:15',
        avatar: ''
    },
    {
        nickname: '长安故里',
        dm_name: '长安忆',
        score: 250,
        time: '2026-07-23 08:58',
        avatar: ''
    },
    {
        nickname: '春风十里',
        dm_name: '春风不解意',
        score: 400,
        time: '2026-07-23 08:33',
        avatar: ''
    },
    {
        nickname: '旧巷听雨',
        dm_name: '一纸荒年',
        score: 1000,
        time: '2026-07-23 08:12',
        avatar: ''
    }
]
</script>

<style lang="scss" scoped></style>
