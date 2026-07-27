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
            <div class="mb-4 flex items-center justify-between">
                <el-button type="primary" @click="handleAdd">
                    <template #icon><icon name="el-icon-Plus" :size="14" /></template>
                    新建分类
                </el-button>
                <div class="flex items-center gap-2">
                    <el-button @click="expandAll(true)">展开全部</el-button>
                    <el-button @click="expandAll(false)">折叠全部</el-button>
                </div>
            </div>
            <el-table
                ref="tableRef"
                :data="treeData"
                v-loading="loading"
                row-key="id"
                :tree-props="{ children: 'children' }"
                stripe
            >
                <el-table-column label="分类ID" prop="id" width="90" />
                <el-table-column label="分类名称" prop="name" min-width="200">
                    <template #default="{ row }">
                        <span :class="row.parentId === null ? 'fw-600' : 'text-tx-secondary'">
                            {{ row.name }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="层级" width="90">
                    <template #default="{ row }">
                        <el-tag
                            :type="row.parentId === null ? 'warning' : 'primary'"
                            size="small"
                        >
                            {{ row.parentId === null ? '一级' : '二级' }}
                        </el-tag>
                    </template>
                </el-table-column>
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
                <el-form-item label="上级分类" prop="parentId">
                    <el-select
                        v-model="formData.parentId"
                        placeholder="不选则为一级分类"
                        clearable
                        class="!w-full"
                    >
                        <el-option
                            v-for="p in parentCandidates"
                            :key="p.id"
                            :label="p.name"
                            :value="p.id"
                        />
                    </el-select>
                    <div class="text-xs text-tx-secondary mt-1">
                        不选则为一级分类；选择后为该分类下的二级分类
                    </div>
                </el-form-item>
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

import {
    categoryList,
    scriptList,
    getLevel1Categories,
    type CategoryItem
} from './store'

// 顶部筛选
const searchForm = reactive({ keyword: '' })
const loading = ref(false)

// 树形数据：二级分类挂在其一级分类 children 下
const treeData = computed<CategoryItem[]>(() => {
    const kw = searchForm.keyword.trim()
    const parents = categoryList.filter((c) => c.parentId === null)
    const result: CategoryItem[] = []
    for (const p of parents) {
        const allChildren = categoryList.filter((c) => c.parentId === p.id)
        if (!kw) {
            result.push({ ...p, children: allChildren.length ? allChildren : undefined })
            continue
        }
        const parentMatch = p.name.includes(kw)
        const matchedChildren = allChildren.filter((c) => c.name.includes(kw))
        if (parentMatch) {
            // 一级名称命中 → 展示该一级及其全部二级
            result.push({ ...p, children: allChildren })
        } else if (matchedChildren.length) {
            // 仅二级名称命中 → 展示该一级及命中的二级
            result.push({ ...p, children: matchedChildren })
        }
    }
    return result
})

// 展开 / 折叠全部
const tableRef = ref()
const expandAll = (expanded: boolean) => {
    treeData.value.forEach((row) => {
        tableRef.value?.toggleRowExpansion(row, expanded)
    })
}

const handleSearch = () => {}
const handleReset = () => {
    searchForm.keyword = ''
}

// 弹窗状态
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editingId = ref<number | null>(null)
const submitLoading = ref(false)
const formRef = ref()

const blankForm = () => ({
    name: '',
    parentId: undefined as number | undefined,
    status: 1 as 0 | 1
})
const formData = reactive(blankForm())

// 父级候选：仅一级分类，编辑时排除自身
const parentCandidates = computed(() =>
    getLevel1Categories(editingId.value ?? undefined)
)

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
    Object.assign(formData, {
        name: row.name,
        parentId: row.parentId,
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
            parentId: formData.parentId ?? null,
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
                parentId: formData.parentId ?? null,
                status: formData.status
            }
        }
        ElMessage.success('编辑成功')
    }
    submitLoading.value = false
    dialogVisible.value = false
}

// 删除：若存在关联剧本或存在下级分类，则无法删除（业务规则）
const handleDelete = (row: CategoryItem) => {
    const relatedScripts = scriptList.filter((s) => s.categoryId === row.id).length
    if (relatedScripts > 0) {
        ElMessage.error(`分类「${row.name}」存在 ${relatedScripts} 部关联剧本，无法删除`)
        return
    }
    const childCount = categoryList.filter((c) => c.parentId === row.id).length
    if (childCount > 0) {
        ElMessage.error(`分类「${row.name}」存在 ${childCount} 个下级分类，无法删除`)
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
    .fw-600 {
        font-weight: 600;
    }
}
</style>