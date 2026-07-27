<template>
    <div class="dm-manage">
        <!-- 顶部筛选 -->
        <el-card class="!border-none" shadow="never">
            <el-form :model="searchForm" inline>
                <el-form-item label="DM名称">
                    <el-input
                        v-model.trim="searchForm.keyword"
                        placeholder="请输入DM名称"
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

        <!-- 列表 -->
        <el-card class="!border-none mt-4" shadow="never">
            <div class="mb-4 flex justify-start">
                <el-button type="primary" @click="handleAdd">
                    <template #icon><icon name="el-icon-Plus" :size="14" /></template>
                    新建DM
                </el-button>
            </div>
            <el-table :data="pagedList" v-loading="loading" stripe>
                <el-table-column label="ID" prop="id" width="70" />
                <el-table-column label="头像" width="90">
                    <template #default="{ row }">
                        <el-avatar :src="row.avatar" :size="40">
                            {{ row.name?.slice(0, 1) }}
                        </el-avatar>
                    </template>
                </el-table-column>
                <el-table-column label="DM名称" prop="name" min-width="120" />
                <el-table-column label="标签" min-width="180">
                    <template #default="{ row }">
                        <el-tag
                            v-for="tag in row.tags"
                            :key="tag"
                            class="mr-1 mb-1"
                            size="small"
                            type="info"
                        >
                            {{ tag }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column
                    label="简介"
                    prop="intro"
                    min-width="220"
                    show-overflow-tooltip
                />
                <el-table-column label="累计积分" prop="points" width="120">
                    <template #default="{ row }">
                        {{ row.points.toLocaleString() }}
                    </template>
                </el-table-column>
                <el-table-column label="状态" width="90">
                    <template #default="{ row }">
                        <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                            {{ row.status === 1 ? '上架' : '下架' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" prop="createTime" width="170" />
                <el-table-column label="操作" width="170" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
                        <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
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
            :title="dialogMode === 'add' ? '新建DM' : '编辑DM'"
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
                <el-form-item label="DM名称" prop="name">
                    <el-input
                        v-model.trim="formData.name"
                        placeholder="请输入DM名称"
                        maxlength="30"
                        show-word-limit
                    />
                </el-form-item>
                <el-form-item label="标签" prop="tagsInput">
                    <el-input
                        v-model.trim="formData.tagsInput"
                        placeholder="多个标签用英文逗号分隔，如：推理,硬核,新手"
                    />
                    <div class="text-xs text-tx-secondary mt-1">
                        前端主页会按多个标签展示
                    </div>
                </el-form-item>
                <el-form-item label="简介" prop="intro">
                    <el-input
                        v-model="formData.intro"
                        type="textarea"
                        :rows="3"
                        placeholder="请输入简介"
                        maxlength="200"
                        show-word-limit
                    />
                </el-form-item>
                <el-form-item label="背景音乐">
                    <div class="flex w-full">
                        <el-input
                            v-model="formData.bgm"
                            placeholder="请输入背景音乐URL，或点击右侧上传音频"
                            clearable
                            class="flex-1"
                        />
                        <el-upload
                            :show-file-list="false"
                            :auto-upload="false"
                            accept="audio/*"
                            :on-change="handleBgmChange"
                            class="ml-2"
                        >
                            <el-button>上传音频</el-button>
                        </el-upload>
                    </div>
                </el-form-item>
                <el-form-item label="头像">
                    <el-upload
                        :show-file-list="false"
                        :auto-upload="false"
                        accept="image/*"
                        :on-change="handleAvatarChange"
                    >
                        <el-avatar
                            v-if="formData.avatar"
                            :src="formData.avatar"
                            :size="80"
                            class="avatar-preview"
                        />
                        <div v-else class="avatar-placeholder">
                            <icon name="shangchuanzhaopian" :size="20" />
                            <div class="mt-1 text-xs">点击上传</div>
                        </div>
                    </el-upload>
                </el-form-item>
                <el-form-item label="主页轮播图">
                    <el-upload
                        list-type="picture-card"
                        :auto-upload="false"
                        :file-list="formData.carousel"
                        accept="image/*"
                        :on-change="handleCarouselChange"
                        :on-remove="handleCarouselRemove"
                    >
                        <template #default>
                            <icon name="shangchuanzhaopian" :size="22" />
                            <div class="upload-add-text">点击上传</div>
                        </template>
                    </el-upload>
                    <div class="text-xs text-tx-secondary mt-1">
                        点击或拖拽上传图片，建议尺寸 750×400，最多上传 9 张
                    </div>
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="formData.status">
                        <el-radio :value="1">上架</el-radio>
                        <el-radio :value="0">下架</el-radio>
                    </el-radio-group>
                    <div class="text-xs text-tx-secondary mt-1">
                        上架后可在当期榜单显示并被打赏；下架不影响往期榜单数据
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

interface DmItem {
    id: number
    name: string
    tags: string[]
    intro: string
    bgm: string
    avatar: string
    carousel: string[]
    status: 0 | 1
    points: number
    hasCurrentTips: boolean
    createTime: string
}

// 顶部 4 张统计卡（mock 计数）
const dmList = ref<DmItem[]>([
    {
        id: 1,
        name: '暗夜猎手',
        tags: ['推理', '硬核', '新手友好'],
        intro: '十年剧本杀主持经验，擅长悬疑推理类剧本，节奏紧凑不冷场',
        bgm: '',
        avatar: 'https://i.pravatar.cc/100?img=11',
        carousel: [
            'https://picsum.photos/750/400?random=101',
            'https://picsum.photos/750/400?random=102'
        ],
        status: 1,
        points: 12450,
        hasCurrentTips: true,
        createTime: '2025-03-12 10:23:11'
    },
    {
        id: 2,
        name: '星月旅人',
        tags: ['情感', '古风'],
        intro: '情感本专精，主持细腻，氛围感强，适合沉浸式玩家',
        bgm: '',
        avatar: 'https://i.pravatar.cc/100?img=12',
        carousel: ['https://picsum.photos/750/400?random=103'],
        status: 1,
        points: 8920,
        hasCurrentTips: false,
        createTime: '2025-04-08 14:32:50'
    },
    {
        id: 3,
        name: '午夜钟声',
        tags: ['恐怖', '沉浸', '推理'],
        intro: '恐怖沉浸本王牌 DM，营造氛围一流',
        bgm: '',
        avatar: 'https://i.pravatar.cc/100?img=13',
        carousel: [],
        status: 0,
        points: 6780,
        hasCurrentTips: false,
        createTime: '2025-05-19 09:11:00'
    },
    {
        id: 4,
        name: '云端漫步',
        tags: ['欢乐', '新手'],
        intro: '欢乐机制本专精，节奏好，新手友好',
        bgm: '',
        avatar: 'https://i.pravatar.cc/100?img=14',
        carousel: [],
        status: 1,
        points: 4220,
        hasCurrentTips: false,
        createTime: '2025-06-25 16:45:32'
    }
])

// 顶部筛选
const searchForm = reactive({ keyword: '' })
const loading = ref(false)

const filteredList = computed(() => {
    const kw = searchForm.keyword.trim()
    if (!kw) return dmList.value
    return dmList.value.filter((d) => d.name.includes(kw))
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
    tagsInput: '',
    intro: '',
    bgm: '',
    avatar: '',
    carousel: [] as { name: string; url: string; uid: number | string }[],
    status: 1 as 0 | 1
})
const formData = reactive(blankForm())

const formRules = {
    name: [{ required: true, message: '请输入DM名称', trigger: 'blur' }],
    tagsInput: [{ required: true, message: '请输入标签（英文逗号分隔）', trigger: 'blur' }],
    intro: [{ required: true, message: '请输入简介', trigger: 'blur' }],
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

const handleEdit = (row: DmItem) => {
    dialogMode.value = 'edit'
    editingId.value = row.id
    Object.assign(formData, {
        name: row.name,
        tagsInput: row.tags.join(','),
        intro: row.intro,
        bgm: row.bgm,
        avatar: row.avatar,
        carousel: row.carousel.map((url, i) => ({
            url,
            name: `carousel-${row.id}-${i}`,
            uid: `carousel-${row.id}-${i}`
        })),
        status: row.status
    })
    dialogVisible.value = true
}

// 上传处理（mock: 用 object URL 或 picsum 占位）
const handleAvatarChange = (file: any) => {
    if (file.raw) {
        try {
            formData.avatar = URL.createObjectURL(file.raw)
        } catch (e) {
            formData.avatar = `https://i.pravatar.cc/100?u=${Date.now()}`
        }
    } else if (file.url) {
        formData.avatar = file.url
    }
}

const handleBgmChange = (file: any) => {
    if (file.raw) {
        try {
            formData.bgm = URL.createObjectURL(file.raw)
        } catch (e) {
            formData.bgm = file.name || ''
        }
    } else if (file.url) {
        formData.bgm = file.url
    }
}

const handleCarouselChange = (file: any, fileList: any[]) => {
    formData.carousel = fileList.map((f: any, idx: number) => {
        const uid = f.uid ?? idx
        let url = f.url
        if (!url && f.raw) {
            try {
                url = URL.createObjectURL(f.raw)
            } catch (e) {
                url = `https://picsum.photos/750/400?random=${uid}`
            }
        }
        if (!url) url = `https://picsum.photos/750/400?random=${uid}`
        return { name: f.name, uid, url }
    })
}

const handleCarouselRemove = (file: any) => {
    formData.carousel = formData.carousel.filter((f) => f.uid !== file.uid)
}

const submitForm = async () => {
    try {
        await formRef.value?.validate()
    } catch {
        return
    }

    // 业务规则：编辑时若改为下架，且本期已有打赏数据，则不可下架
    if (dialogMode.value === 'edit' && formData.status === 0) {
        const cur = dmList.value.find((d) => d.id === editingId.value)
        if (cur?.hasCurrentTips) {
            ElMessage.error('该 DM 本期已有打赏数据，不可下架')
            return
        }
    }

    submitLoading.value = true
    await new Promise((r) => setTimeout(r, 300))
    const tags = formData.tagsInput
        .split(/,|，/)
        .map((t) => t.trim())
        .filter(Boolean)
    const carouselUrls = formData.carousel
        .map((f) => f.url)
        .filter(Boolean)

    if (dialogMode.value === 'add') {
        const newId = dmList.value.length
            ? Math.max(...dmList.value.map((d) => d.id)) + 1
            : 1
        const now = new Date()
            .toISOString()
            .replace('T', ' ')
            .slice(0, 19)
        dmList.value.unshift({
            id: newId,
            name: formData.name,
            tags,
            intro: formData.intro,
            bgm: formData.bgm,
            avatar: formData.avatar,
            carousel: carouselUrls,
            status: formData.status,
            points: 0,
            hasCurrentTips: false,
            createTime: now
        })
        ElMessage.success('新建成功')
    } else {
        const idx = dmList.value.findIndex((d) => d.id === editingId.value)
        if (idx >= 0) {
            const cur = dmList.value[idx]
            dmList.value[idx] = {
                ...cur,
                name: formData.name,
                tags,
                intro: formData.intro,
                bgm: formData.bgm,
                avatar: formData.avatar,
                carousel: carouselUrls,
                status: formData.status
            }
        }
        ElMessage.success('编辑成功')
    }

    submitLoading.value = false
    dialogVisible.value = false
}

// 删除（软删除：从列表移除；后端实际为软删除，不影响历史榜单）
const handleDelete = (row: DmItem) => {
    ElMessageBox.confirm(
        `确定要删除 DM「${row.name}」吗？删除后不可恢复，且无法恢复往期榜单数据。`,
        '删除确认',
        {
            type: 'warning',
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            closeOnClickModal: false
        }
    )
        .then(() => {
            // 软删除：从列表过滤（实际后端为设置 deleted_at）
            dmList.value = dmList.value.filter((d) => d.id !== row.id)
            ElMessage.success('删除成功')
        })
        .catch(() => {})
}
</script>

<style lang="scss" scoped>
.dm-manage {
    .avatar-placeholder {
        width: 80px;
        height: 80px;
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
    .avatar-preview {
        border: 1px solid #ebeef5;
    }
    // 主页轮播图：宽幅 banner 形状（对应建议尺寸 750×400，比例 1.875:1）
    :deep(.el-upload--picture-card) {
        --el-upload-picture-card-size: 96px;
        width: 180px;
        height: 96px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .upload-add-text {
        margin-top: 4px;
        font-size: 12px;
        line-height: 1;
        color: #909399;
    }
    // 已上传的轮播图缩略图与组件尺寸一致，避免变形
    :deep(.el-upload-list--picture-card .el-upload-list__item) {
        width: 180px;
        height: 96px;
        --el-upload-picture-card-size: 96px;
    }
    :deep(.el-upload-list--picture-card .el-upload-list__item-thumbnail) {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    // 轮播图与提示文字之间保持间距
    :deep(.el-upload-list--picture-card) {
        margin-top: 0;
    }
}
</style>