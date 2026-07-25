<template>
    <div class="leaderboard-lists">
        <el-card class="!border-none" shadow="never">
            <el-form ref="formRef" class="mb-[-16px]" :model="queryParams" :inline="true">
                <el-form-item class="w-[280px]" label="期数名称">
                    <el-input
                        v-model="queryParams.name"
                        placeholder="请输入期数名称"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item class="w-[200px]" label="榜单状态">
                    <el-select v-model="queryParams.status" placeholder="全部" clearable>
                        <el-option label="全部" value="" />
                        <el-option label="未开始" :value="0" />
                        <el-option label="进行中" :value="1" />
                        <el-option label="已结束" :value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
            <el-button type="primary" class="mb-4" @click="openCreateDialog">
                <template #icon>
                    <icon name="el-icon-Plus" />
                </template>
                新建榜单
            </el-button>

            <el-table size="large" v-loading="pager.loading" :data="pager.lists">
                <el-table-column label="ID" prop="id" width="80" />
                <el-table-column label="期数名称" prop="name" min-width="160" show-tooltip-when-overflow />
                <el-table-column label="开始时间" prop="start_time" min-width="170" />
                <el-table-column label="结束时间" prop="end_time" min-width="170" />
                <el-table-column label="状态" min-width="100">
                    <template #default="{ row }">
                        <el-tag :type="statusTagType(row.status)">
                            {{ statusLabel(row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" min-width="280" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="goDetail(row)">
                            查看榜单
                        </el-button>
                        <el-button
                            type="primary"
                            link
                            :disabled="row.status === 2"
                            @click="openEditDialog(row)"
                        >
                            编辑
                        </el-button>
                        <el-button
                            type="warning"
                            link
                            :disabled="row.status !== 0"
                            @click="handleAdvance(row, 'start')"
                        >
                            提前开始
                        </el-button>
                        <el-button
                            type="warning"
                            link
                            :disabled="row.status !== 1"
                            @click="handleAdvance(row, 'end')"
                        >
                            提前结束
                        </el-button>
                        <el-button type="danger" link @click="handleDelete(row)">
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="flex justify-end mt-4">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>

        <!-- 新建/编辑弹窗 -->
        <el-dialog
            v-model="dialogVisible"
            :title="dialogMode === 'create' ? '新建榜单' : '编辑榜单'"
            width="540px"
            :close-on-click-modal="false"
            @closed="handleDialogClosed"
        >
            <el-form
                ref="dialogFormRef"
                :model="dialogForm"
                :rules="dialogRules"
                label-width="100px"
            >
                <el-form-item label="期数名称" prop="name">
                    <el-input
                        v-model="dialogForm.name"
                        placeholder="请输入期数名称"
                        maxlength="30"
                        show-word-limit
                    />
                </el-form-item>
                <el-form-item label="开始时间" prop="start_time">
                    <el-date-picker
                        v-model="dialogForm.start_time"
                        type="datetime"
                        placeholder="选择开始时间"
                        format="YYYY-MM-DD HH:mm:ss"
                        value-format="YYYY-MM-DD HH:mm:ss"
                        :disabled="isStartTimeLocked"
                        class="!w-full"
                    />
                </el-form-item>
                <el-form-item label="结束时间" prop="end_time">
                    <el-date-picker
                        v-model="dialogForm.end_time"
                        type="datetime"
                        placeholder="选择结束时间"
                        format="YYYY-MM-DD HH:mm:ss"
                        value-format="YYYY-MM-DD HH:mm:ss"
                        class="!w-full"
                    />
                </el-form-item>
                <el-form-item label="榜单状态">
                    <el-input :model-value="statusLabel(dialogForm.status)" disabled />
                    <div class="form-tips">榜单状态不可手动修改，将根据时间自动变更</div>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="dialogSubmitting" @click="submitDialog">
                    确认
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup name="leaderboard">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'

// ====== 类型 ======
type Status = 0 | 1 | 2 // 0未开始 1进行中 2已结束
interface BoardItem {
    id: number
    name: string
    start_time: string
    end_time: string
    status: Status
}

// ====== mock 全量数据 ======
const allBoards = reactive<BoardItem[]>([
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
    },
    {
        id: 7,
        name: '2026年Q1榜首争夺战',
        start_time: '2026-01-01 00:00:00',
        end_time: '2026-03-31 23:59:59',
        status: 2
    },
    {
        id: 8,
        name: '2026年女神节榜',
        start_time: '2026-03-08 00:00:00',
        end_time: '2026-03-15 23:59:59',
        status: 2
    },
    {
        id: 9,
        name: '2026年端午榜',
        start_time: '2026-06-10 00:00:00',
        end_time: '2026-06-15 23:59:59',
        status: 2
    },
    {
        id: 10,
        name: '2026年520榜',
        start_time: '2026-05-18 00:00:00',
        end_time: '2026-05-22 23:59:59',
        status: 2
    },
    {
        id: 11,
        name: '2026年七夕榜',
        start_time: '2026-08-20 00:00:00',
        end_time: '2026-08-25 23:59:59',
        status: 0
    },
    {
        id: 12,
        name: '2026年圣诞榜',
        start_time: '2026-12-24 00:00:00',
        end_time: '2026-12-26 23:59:59',
        status: 0
    }
])

// ====== 工具：时间相关 ======
const toTs = (s: string) => new Date(s.replace(/-/g, '/')).getTime()
const now = () => Date.now()

// 根据时间自动算状态（不存盘，每次访问时重算）
const computeStatus = (b: BoardItem): Status => {
    const t = now()
    if (t < toTs(b.start_time)) return 0
    if (t > toTs(b.end_time)) return 2
    return 1
}

// 时间区间是否重叠 [aS,aE] ∩ [bS,bE]
const rangesOverlap = (aS: string, aE: string, bS: string, bE: string) =>
    toTs(aS) <= toTs(bE) && toTs(bS) <= toTs(aE)

// ====== 查询 ======
const queryParams = reactive({
    name: '',
    status: '' as '' | Status
})

// 分页参数
const pager = reactive({
    page: 1,
    size: 10,
    loading: false,
    count: 0,
    lists: [] as BoardItem[],
    extend: {} as Record<string, any>
})

const getLists = () => {
    pager.loading = true
    // 重新计算状态
    allBoards.forEach((b) => (b.status = computeStatus(b)))
    // 过滤
    const name = queryParams.name.trim()
    let filtered = allBoards.filter(
        (b) =>
            (!name || b.name.includes(name)) &&
            (queryParams.status === '' || b.status === queryParams.status)
    )
    // 排序：进行中 → 未开始（按开始时间升序）→ 已结束（按结束时间倒序）
    filtered.sort((a, b) => {
        const order = (s: Status) => (s === 1 ? 0 : s === 0 ? 1 : 2)
        if (order(a.status) !== order(b.status)) return order(a.status) - order(b.status)
        if (a.status === 0) return toTs(a.start_time) - toTs(b.start_time)
        if (a.status === 2) return toTs(b.end_time) - toTs(a.end_time)
        return b.id - a.id
    })
    pager.count = filtered.length
    const start = (pager.page - 1) * pager.size
    pager.lists = filtered.slice(start, start + pager.size)
    pager.loading = false
    return Promise.resolve()
}
const resetPage = () => {
    pager.page = 1
    getLists()
}
const resetParams = () => {
    queryParams.name = ''
    queryParams.status = ''
    resetPage()
}

// ====== 状态显示 ======
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

// ====== 操作：查看/编辑/提前开始/提前结束/删除 ======
const router = useRouter()
const goDetail = (row: BoardItem) => {
    router.push({ path: '/leaderboard/detail', query: { id: row.id } })
}

const handleAdvance = async (row: BoardItem, type: 'start' | 'end') => {
    const text = type === 'start' ? '确定要提前开始此榜单吗？' : '确定要提前结束此榜单吗？'
    await feedback.confirm(text)
    if (type === 'start') {
        row.start_time = nowDateString()
        row.status = computeStatus(row)
        feedback.msgSuccess('已提前开始')
    } else {
        row.end_time = nowDateString()
        row.status = computeStatus(row)
        feedback.msgSuccess('已提前结束')
    }
    getLists()
}

const nowDateString = () => {
    const d = new Date()
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
        d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const handleDelete = async (row: BoardItem) => {
    const tip =
        row.status === 2
            ? '该榜单已结束，删除后不可恢复，是否继续？'
            : '确定要删除此榜单？删除后不可恢复'
    await feedback.confirm(tip)
    const idx = allBoards.findIndex((b) => b.id === row.id)
    if (idx >= 0) allBoards.splice(idx, 1)
    feedback.msgSuccess('已删除')
    // 若当前页已空，退到上一页
    if (pager.lists.length === 1 && pager.page > 1) pager.page--
    getLists()
}

// ====== 新建/编辑弹窗 ======
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const dialogSubmitting = ref(false)
const dialogFormRef = ref()
const dialogForm = reactive<{
    id: number
    name: string
    start_time: string
    end_time: string
    status: Status
}>({
    id: 0,
    name: '',
    start_time: '',
    end_time: '',
    status: 0
})
const isStartTimeLocked = computed(() => {
    // 编辑时：已开始/已结束的榜单，开始时间不可改
    if (dialogMode.value !== 'edit') return false
    if (!dialogForm.start_time) return false
    const t = now()
    return t >= toTs(dialogForm.start_time)
})

const dialogRules = {
    name: [
        { required: true, message: '请输入期数名称', trigger: 'blur' },
        { max: 30, message: '期数名称不超过 30 字', trigger: 'blur' }
    ],
    start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
    end_time: [
        { required: true, message: '请选择结束时间', trigger: 'change' },
        {
            validator: (_: any, v: string, cb: any) => {
                if (!dialogForm.start_time) return cb()
                if (toTs(v) <= toTs(dialogForm.start_time))
                    return cb(new Error('结束时间必须晚于开始时间'))
                cb()
            },
            trigger: 'change'
        },
        {
            // 时间区间不可与已有榜单重叠
            validator: (_: any, v: string, cb: any) => {
                if (!dialogForm.start_time) return cb()
                const conflict = allBoards.find(
                    (b) =>
                        b.id !== dialogForm.id &&
                        rangesOverlap(dialogForm.start_time, v, b.start_time, b.end_time)
                )
                if (conflict) return cb(new Error(`与已存在榜单「${conflict.name}」时间区间重叠`))
                cb()
            },
            trigger: 'change'
        }
    ]
}

const openCreateDialog = () => {
    dialogMode.value = 'create'
    dialogForm.id = 0
    dialogForm.name = ''
    dialogForm.start_time = ''
    dialogForm.end_time = ''
    dialogForm.status = 0
    dialogVisible.value = true
}

const openEditDialog = (row: BoardItem) => {
    dialogMode.value = 'edit'
    dialogForm.id = row.id
    dialogForm.name = row.name
    dialogForm.start_time = row.start_time
    dialogForm.end_time = row.end_time
    dialogForm.status = computeStatus(row)
    dialogVisible.value = true
}

const handleDialogClosed = () => {
    dialogFormRef.value?.resetFields()
}

const submitDialog = async () => {
    await dialogFormRef.value?.validate()
    dialogSubmitting.value = true
    try {
        if (dialogMode.value === 'create') {
            const newId = Math.max(0, ...allBoards.map((b) => b.id)) + 1
            allBoards.unshift({
                id: newId,
                name: dialogForm.name.trim(),
                start_time: dialogForm.start_time,
                end_time: dialogForm.end_time,
                status: 0
            })
            feedback.msgSuccess('新建成功')
        } else {
            const target = allBoards.find((b) => b.id === dialogForm.id)
            if (target) {
                target.name = dialogForm.name.trim()
                // 已开始的不可改 start_time
                if (!isStartTimeLocked.value) target.start_time = dialogForm.start_time
                target.end_time = dialogForm.end_time
                target.status = computeStatus(target)
            }
            feedback.msgSuccess('保存成功')
        }
        dialogVisible.value = false
        pager.page = 1
        getLists()
    } finally {
        dialogSubmitting.value = false
    }
}

onMounted(() => {
    getLists()
})
</script>

<style lang="scss" scoped>
.leaderboard-lists {
    .form-tips {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        line-height: 1.4;
        margin-top: 4px;
    }
}
</style>