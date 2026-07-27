<template>
    <div class="scripture-category">
        <el-card class="!border-none" shadow="never">
            <el-form :model="searchForm" inline>
                <el-form-item label="分类名称">
                    <el-input
                        v-model.trim="searchForm.keyword"
                        placeholder="请输入分类名称"
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
                    新建分类
                </el-button>
            </div>
            <el-table :data="pagedList" v-loading="loading" stripe>
                <el-table-column label="分类ID" prop="id" width="90" />
                <el-table-column label="分类名称" prop="name" min-width="160" />
                <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                            {{ row.status === 1 ? '启用' : '禁用' }}
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
            :title="dialogMode === 'add' ? '新建分类' : '编辑分类'"
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
                <el-form-item label="分类名称" prop="name">
                    <el-input
                        v-model.trim="formData.name"
                        placeholder="请输入分类名称"
                        maxlength="20"
                        show-word-limit
                    />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="formData.status">
                        <el-radio :value="1">启用</el-radio>
                        <el-radio :value="0">禁用</el-radio>
                    </el-radio-group>
                    <div class="text-xs text-tx-secondary mt-1">
                        启用则在选车页展示该门店对应分类；禁用则不展示
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

import { categoryList, scriptList, type CategoryItem } from './store'

// 顶部筛选
const searchForm = reactive({ keyword: '' })
const loading = ref(false)

const filteredList = computed(() => {
    const kw = searchForm.keyword.trim()
    if (!kw) return categoryList
    return categoryList.filter((c) => c.name.includes(kw))
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
    status: 1 as 0 | 1
})
const formData = reactive(blankForm())

const formRules = {
    name: [
        { required: true, message: '请输入分类名称', trigger: 'blur' },
        {
            validator: (_: any, v: string, cb: any) => {
                const dup = categoryList.find(
                    (c) => c.name === v.trim() && c.id !== editingId.value
                )
                if (dup) return cb(new Error('分类名称已存在'))
                cb()
            },
            trigger: 'blur'
        }
    ],
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

const handleEdit = (row: CategoryItem) => {
    dialogMode.value = 'edit'
    editingId.value = row.id
    Object.assign(formData, { name: row.name, status: row.status })
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
        const newId = categoryList.length
            ? Math.max(...categoryList.map((c) => c.id)) + 1
            : 1
        const now = new Date()
            .toISOString()
            .replace('T', ' ')
            .slice(0, 19)
        categoryList.unshift({
            id: newId,
            name: formData.name.trim(),
            status: formData.status,
            createTime: now
        })
        ElMessage.success('新建成功')
    } else {
        const idx = categoryList.findIndex((c) => c.id === editingId.value)
        if (idx >= 0) {
            categoryList[idx] = {
                ...categoryList[idx],
                name: formData.name.trim(),
                status: formData.status
            }
        }
        ElMessage.success('编辑成功')
    }
    submitLoading.value = false
    dialogVisible.value = false
}

// 删除：若存在关联剧本则无法删除（业务规则）
const handleDelete = (row: CategoryItem) => {
    const relatedCount = scriptList.filter((s) => s.categoryId === row.id).length
    if (relatedCount > 0) {
        ElMessage.error(
            `分类「${row.name}」存在 ${relatedCount} 部关联剧本，无法删除`
        )
        return
    }
    ElMessageBox.confirm(
        `确定要删除分类「${row.name}」吗？删除后不可恢复，且不可恢复防止误操作。`,
        '删除确认',
        {
            type: 'warning',
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            closeOnClickModal: false
        }
    )
        .then(() => {
            const idx = categoryList.findIndex((c) => c.id === row.id)
            if (idx >= 0) categoryList.splice(idx, 1)
            ElMessage.success('删除成功')
        })
        .catch(() => {})
}

</script>

<style lang="scss" scoped>
.scripture-category {
}
</style>