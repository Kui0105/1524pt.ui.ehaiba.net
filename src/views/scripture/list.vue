<template>
    <div class="scripture-list">
        <el-card class="!border-none" shadow="never">
            <el-form :model="searchForm" inline>
                <el-form-item label="剧本名称">
                    <el-input
                        v-model.trim="searchForm.keyword"
                        placeholder="请输入剧本名称进行搜索筛选"
                        clearable
                        style="width: 260px"
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
                    新建剧本
                </el-button>
            </div>
            <el-table :data="pagedList" v-loading="loading" stripe>
                <el-table-column label="剧本名称" prop="name" min-width="160" />
                <el-table-column label="剧本分类" min-width="160">
                    <template #default="{ row }">
                        {{ getCategoryPath(row.categoryId) }}
                    </template>
                </el-table-column>
                <el-table-column label="简介" prop="intro" min-width="240" show-overflow-tooltip />
                <el-table-column label="状态" width="90">
                    <template #default="{ row }">
                        <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                            {{ row.status === 1 ? '上架' : '下架' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" prop="createTime" width="180" />
                <el-table-column label="操作" width="170" fixed="right">
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
            :title="dialogMode === 'add' ? '新建剧本' : '编辑剧本'"
            width="680px"
            :close-on-click-modal="false"
            destroy-on-close
        >
            <el-form
                ref="formRef"
                :model="formData"
                :rules="formRules"
                label-width="100px"
            >
                <el-form-item label="剧本名称" prop="name">
                    <el-input
                        v-model.trim="formData.name"
                        placeholder="请输入剧本名称"
                        maxlength="30"
                        show-word-limit
                    />
                </el-form-item>
                <el-form-item label="剧本分类" prop="categoryId">
                    <div class="flex items-center gap-2 w-full">
                        <el-select
                            v-model="formData.parentCategoryId"
                            placeholder="请选择一级分类"
                            clearable
                            class="!w-1/2"
                            @change="onParentCategoryChange"
                        >
                            <el-option
                                v-for="c in availableLevel1"
                                :key="c.id"
                                :label="c.name"
                                :value="c.id"
                                :disabled="c.status === 0"
                            />
                        </el-select>
                        <el-select
                            v-model="formData.categoryId"
                            placeholder="请选择二级分类"
                            clearable
                            :disabled="!formData.parentCategoryId"
                            class="!w-1/2"
                        >
                            <el-option
                                v-for="c in availableLevel2"
                                :key="c.id"
                                :label="c.name"
                                :value="c.id"
                                :disabled="c.status === 0"
                            />
                        </el-select>
                    </div>
                    <div class="text-xs text-tx-secondary mt-1">
                        先选择一级分类，再选择其下的二级分类；仅显示已启用分类
                    </div>
                </el-form-item>
                <el-form-item label="简介" prop="intro">
                    <el-input
                        v-model="formData.intro"
                        type="textarea"
                        :rows="3"
                        placeholder="请输入剧本简介"
                        maxlength="200"
                        show-word-limit
                    />
                </el-form-item>
                <el-form-item label="关联车次" prop="scheduleIds">
                    <el-select
                        v-model="formData.scheduleIds"
                        multiple
                        collapse-tags
                        collapse-tags-tooltip
                        placeholder="请选择车次（多选）"
                        class="!w-full"
                    >
                        <el-option
                            v-for="s in availableSchedules"
                            :key="s.id"
                            :label="`${s.name}（${s.startTime}）`"
                            :value="s.id"
                            :disabled="s.status === 0"
                        />
                    </el-select>
                    <div class="text-xs text-tx-secondary mt-1">
                        前端可预置所关联车次；下架车次无法被选择
                    </div>
                </el-form-item>
                <el-form-item label="封面图">
                    <el-upload
                        :show-file-list="false"
                        :auto-upload="false"
                        accept="image/*"
                        :on-change="handleCoverChange"
                    >
                        <div v-if="formData.cover" class="cover-preview">
                            <img :src="formData.cover" alt="封面" />
                            <div class="cover-mask">点击替换</div>
                        </div>
                        <div v-else class="cover-placeholder">
                            <icon name="shangchuanzhaopian" :size="20" />
                            <div class="mt-1 text-xs">点击上传</div>
                        </div>
                    </el-upload>
                    <div class="text-xs text-tx-secondary mt-1">
                        建议尺寸 750×400，支持 jpg / png
                    </div>
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="formData.status">
                        <el-radio :value="1">上架</el-radio>
                        <el-radio :value="0">下架</el-radio>
                    </el-radio-group>
                    <div class="text-xs text-tx-secondary mt-1">
                        上架后可在选车页中显示并进入详情预览；下架后则不显示
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
    scheduleList,
    scriptList,
    getParentName,
    type ScriptItem
} from './store'

// 顶部筛选
const searchForm = reactive({ keyword: '' })
const loading = ref(false)

const filteredList = computed(() => {
    const kw = searchForm.keyword.trim()
    if (!kw) return scriptList
    return scriptList.filter((s) => s.name.includes(kw))
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

// 工具
const getCategoryName = (id: number) =>
    categoryList.find((c) => c.id === id)?.name || '-'
const getCategoryParent = (id: number) =>
    categoryList.find((c) => c.id === id)?.parentId ?? null
const getCategoryPath = (id: number) => {
    const self = getCategoryName(id)
    const parent = getParentName(getCategoryParent(id))
    return parent === '-' ? self : `${parent} / ${self}`
}
// 剧本分类：先选一级，再选其下二级
const availableLevel1 = computed(() =>
    categoryList.filter((c) => c.parentId === null)
)
const availableLevel2 = computed(() =>
    categoryList.filter((c) => c.parentId === formData.parentCategoryId)
)
const onParentCategoryChange = () => {
    // 一级变动时清空已选二级
    formData.categoryId = undefined
}
const availableSchedules = computed(() => scheduleList)

// 弹窗状态
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editingId = ref<number | null>(null)
const submitLoading = ref(false)
const formRef = ref()

const blankForm = () => ({
    name: '',
    parentCategoryId: undefined as number | undefined,
    categoryId: undefined as number | undefined,
    intro: '',
    scheduleIds: [] as number[],
    cover: '',
    status: 1 as 0 | 1
})
const formData = reactive(blankForm())

const formRules = {
    name: [
        { required: true, message: '请输入剧本名称', trigger: 'blur' },
        {
            validator: (_: any, v: string, cb: any) => {
                const dup = scriptList.find(
                    (s) => s.name === v.trim() && s.id !== editingId.value
                )
                if (dup) return cb(new Error('剧本名称已存在'))
                cb()
            },
            trigger: 'blur'
        }
    ],
    parentCategoryId: [
        { required: true, message: '请先选择一级分类', trigger: 'change' }
    ],
    categoryId: [{ required: true, message: '请选择二级分类', trigger: 'change' }],
    intro: [{ required: true, message: '请输入简介', trigger: 'blur' }],
    scheduleIds: [
        {
            validator: (_: any, v: number[], cb: any) => {
                if (!v || v.length === 0) return cb()
                // 校验所选车次都存在且未下架
                const invalid = v.find((id) => {
                    const s = scheduleList.find((x) => x.id === id)
                    return !s || s.status === 0
                })
                if (invalid !== undefined) return cb(new Error('所选车次包含已下架或已删除项'))
                cb()
            },
            trigger: 'change'
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

const handleEdit = (row: ScriptItem) => {
    dialogMode.value = 'edit'
    editingId.value = row.id
    const parentId = categoryList.find((c) => c.id === row.categoryId)?.parentId ?? null
    Object.assign(formData, {
        name: row.name,
        parentCategoryId: parentId ?? undefined,
        categoryId: row.categoryId,
        intro: row.intro,
        scheduleIds: [...row.scheduleIds],
        cover: row.cover,
        status: row.status
    })
    dialogVisible.value = true
}

const handleCoverChange = (file: any) => {
    if (file.raw) {
        try {
            formData.cover = URL.createObjectURL(file.raw)
        } catch {
            formData.cover = `https://picsum.photos/seed/${Date.now()}/750/400`
        }
    } else if (file.url) {
        formData.cover = file.url
    }
}

const submitForm = async () => {
    try {
        await formRef.value?.validate()
    } catch {
        return
    }
    submitLoading.value = true
    await new Promise((r) => setTimeout(r, 300))
    if (dialogMode.value === 'add') {
        const newId = scriptList.length
            ? Math.max(...scriptList.map((s) => s.id)) + 1
            : 1
        const now = new Date()
            .toISOString()
            .replace('T', ' ')
            .slice(0, 19)
        scriptList.unshift({
            id: newId,
            name: formData.name.trim(),
            categoryId: formData.categoryId!,
            intro: formData.intro,
            scheduleIds: [...formData.scheduleIds],
            cover: formData.cover,
            status: formData.status,
            createTime: now
        })
        ElMessage.success('新建成功')
    } else {
        const idx = scriptList.findIndex((s) => s.id === editingId.value)
        if (idx >= 0) {
            scriptList[idx] = {
                ...scriptList[idx],
                name: formData.name.trim(),
                categoryId: formData.categoryId!,
                intro: formData.intro,
                scheduleIds: [...formData.scheduleIds],
                cover: formData.cover,
                status: formData.status
            }
        }
        ElMessage.success('编辑成功')
    }
    submitLoading.value = false
    dialogVisible.value = false
}

const handleDelete = (row: ScriptItem) => {
    ElMessageBox.confirm(
        `确定要删除剧本「${row.name}」吗？删除后不可恢复，且不可恢复防止误操作。`,
        '删除确认',
        {
            type: 'warning',
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            closeOnClickModal: false
        }
    )
        .then(() => {
            const idx = scriptList.findIndex((s) => s.id === row.id)
            if (idx >= 0) scriptList.splice(idx, 1)
            ElMessage.success('删除成功')
        })
        .catch(() => {})
}

</script>

<style lang="scss" scoped>
.scripture-list {
    .cover-placeholder {
        width: 200px;
        height: 110px;
        border: 1px dashed #d9d9d9;
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #909399;
        cursor: pointer;
        &:hover {
            border-color: var(--el-color-primary);
            color: var(--el-color-primary);
        }
    }
    .cover-preview {
        position: relative;
        width: 200px;
        height: 110px;
        border: 1px solid #ebeef5;
        border-radius: 6px;
        overflow: hidden;
        cursor: pointer;
        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
        .cover-mask {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.45);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            opacity: 0;
            transition: opacity 0.2s;
        }
        &:hover .cover-mask {
            opacity: 1;
        }
    }
}
</style>