<template>
    <div class="scripture-schedule">
        <el-card class="!border-none" shadow="never">
            <el-form :model="searchForm" inline>
                <el-form-item label="车次名称">
                    <el-input
                        v-model.trim="searchForm.keyword"
                        placeholder="请输入车次名称"
                        clearable
                        style="width: 240px"
                        @keyup.enter="handleSearch"
                    />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch">查询</el-button>
                    <el-button @click="handleReset">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
            <div class="mb-4 flex justify-start">
                <el-button type="primary" @click="handleAdd">
                    <template #icon><icon name="el-icon-Plus" :size="14" /></template>
                    新建车次
                </el-button>
            </div>
            <el-table :data="pagedList" v-loading="loading" stripe>
                <el-table-column label="车次ID" prop="id" width="90" />
                <el-table-column label="车次名称" prop="name" min-width="180" />
                <el-table-column label="开始时间" prop="startTime" width="180" />
                <el-table-column label="状态" width="90">
                    <template #default="{ row }">
                        <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                            {{ row.status === 1 ? '上架' : '下架' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" prop="createTime" width="180" />
                <el-table-column label="操作" width="160" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
                        <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="mt-4 flex justify-end">
                <el-pagination
                    v-model:current-page="page.current"
                    v-model:page-size="page.size"
                    :total="filteredList.length"
                    :page-sizes="[10, 20, 50]"
                    layout="total, sizes, prev, pager, next, jumper"
                    background
                />
            </div>
        </el-card>

        <!-- 新建/编辑弹窗 -->
        <el-dialog
            v-model="dialogVisible"
            :title="dialogMode === 'add' ? '新建车次' : '编辑车次'"
            width="520px"
            :close-on-click-modal="false"
            destroy-on-close
        >
            <el-form
                ref="formRef"
                :model="formData"
                :rules="formRules"
                label-width="100px"
            >
                <el-form-item label="车次名称" prop="name">
                    <el-input
                        v-model.trim="formData.name"
                        placeholder="请输入车次名称"
                        maxlength="30"
                        show-word-limit
                    />
                </el-form-item>
                <el-form-item label="开始时间" prop="startTime">
                    <el-time-picker
                        v-model="formData.startTime"
                        format="HH:mm"
                        value-format="HH:mm"
                        placeholder="选择开始时间"
                        class="!w-full"
                    />
                    <div class="text-xs text-tx-secondary mt-1">
                        仅选择时:分（24 小时制）
                    </div>
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="formData.status">
                        <el-radio :value="1">上架</el-radio>
                        <el-radio :value="0">下架</el-radio>
                    </el-radio-group>
                    <div class="text-xs text-tx-secondary mt-1">
                        上架后可在选车详情展示该车次；下架后则不展示
                    </div>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button
                    type="primary"
                    :loading="submitLoading"
                    @click="submitForm"
                >
                    确认
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { scheduleList, scriptList, type ScheduleItem } from './store'

// 顶部筛选
const searchForm = reactive({ keyword: '' })
const loading = ref(false)

const filteredList = computed(() => {
    const kw = searchForm.keyword.trim()
    if (!kw) return scheduleList
    return scheduleList.filter((s) => s.name.includes(kw))
})

// 分页
const page = reactive({ current: 1, size: 10 })
const pagedList = computed(() => {
    const start = (page.current - 1) * page.size
    return filteredList.value.slice(start, start + page.size)
})

const handleSearch = () => {
    page.current = 1
}
const handleReset = () => {
    searchForm.keyword = ''
    page.current = 1
}

// 弹窗状态
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editingId = ref<number | null>(null)
const submitLoading = ref(false)
const formRef = ref()

const blankForm = () => ({
    name: '',
    startTime: '',
    status: 1 as 0 | 1
})
const formData = reactive(blankForm())

const formRules = {
    name: [
        { required: true, message: '请输入车次名称', trigger: 'blur' },
        {
            validator: (_: any, v: string, cb: any) => {
                const dup = scheduleList.find(
                    (s) => s.name === v.trim() && s.id !== editingId.value
                )
                if (dup) return cb(new Error('车次名称已存在'))
                cb()
            },
            trigger: 'blur'
        }
    ],
    startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const resetForm = () => {
    Object.assign(formData, blankForm())
    formRef.value?.clearValidate()
}

const handleAdd = () => {
    dialogMode.value = 'add'
    editingId.value = null
    resetForm()
    dialogVisible.value = true
}

const handleEdit = (row: ScheduleItem) => {
    dialogMode.value = 'edit'
    editingId.value = row.id
    Object.assign(formData, {
        name: row.name,
        startTime: row.startTime,
        status: row.status
    })
    dialogVisible.value = true
}

const submitForm = async () => {
    try {
        await formRef.value?.validate()
    } catch {
        return
    }
    submitLoading.value = true
    await new Promise((r) => setTimeout(r, 250))
    if (dialogMode.value === 'add') {
        const newId = scheduleList.length
            ? Math.max(...scheduleList.map((s) => s.id)) + 1
            : 1
        const now = new Date()
            .toISOString()
            .replace('T', ' ')
            .slice(0, 19)
        scheduleList.unshift({
            id: newId,
            name: formData.name.trim(),
            startTime: formData.startTime,
            status: formData.status,
            createTime: now
        })
        ElMessage.success('新建成功')
    } else {
        const idx = scheduleList.findIndex((s) => s.id === editingId.value)
        if (idx >= 0) {
            scheduleList[idx] = {
                ...scheduleList[idx],
                name: formData.name.trim(),
                startTime: formData.startTime,
                status: formData.status
            }
        }
        ElMessage.success('编辑成功')
    }
    submitLoading.value = false
    dialogVisible.value = false
}

const handleDelete = (row: ScheduleItem) => {
    ElMessageBox.confirm(
        `确定要删除车次「${row.name}」吗？删除后不可恢复，且不可恢复防止误操作。`,
        '删除确认',
        {
            type: 'warning',
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            closeOnClickModal: false
        }
    )
        .then(() => {
            const idx = scheduleList.findIndex((s) => s.id === row.id)
            if (idx >= 0) scheduleList.splice(idx, 1)
            // 同步：从所有剧本的 scheduleIds 中移除该车次
            scriptListPatch(row.id)
            ElMessage.success('删除成功')
        })
        .catch(() => {})
}

// 车次删除时反向清理剧本的关联
const scriptListPatch = (scheduleId: number) => {
    scriptList.forEach((s) => {
        s.scheduleIds = s.scheduleIds.filter((id) => id !== scheduleId)
    })
}

</script>

<style lang="scss" scoped>
.scripture-schedule {
}
</style>