<template>
    <div class="scripture-config">
        <el-card class="!border-none" shadow="never">
            <div class="flex items-center justify-between">
                <h1 class="page-title">门店配置</h1>
                <el-button type="primary" circle @click="handleEdit">
                    <template #icon><icon name="el-icon-Plus" :size="14" /></template>
                </el-button>
            </div>
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
            <h2 class="page-subtitle">页面布局</h2>
            <div class="desc-list">
                <div class="desc-item">
                    <span class="desc-label">基本信息：</span>
                    <span class="desc-text">门店名称、省市区、详细地址、搜索/地图【展示经纬度坐标】</span>
                </div>
                <div class="desc-item">
                    <span class="desc-label">客服信息：</span>
                    <span class="desc-text">填写门店客服微信号、微信二维码</span>
                </div>
                <div class="desc-item">
                    <span class="desc-label">专车公告：</span>
                    <span class="desc-text">富文本编辑专车公告信息，前端弹窗展示</span>
                </div>
                <div class="desc-item">
                    <span class="desc-label">选车规则：</span>
                    <span class="desc-text">富文本编辑选车规则信息</span>
                </div>
            </div>
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
            <el-table :data="ruleRows" :show-header="true" class="rule-table">
                <el-table-column label="规则" prop="rule" width="180" />
                <el-table-column label="说明" prop="desc" />
            </el-table>
        </el-card>

        <!-- 门店配置弹窗 -->
        <el-dialog
            v-model="dialogVisible"
            :title="dialogMode === 'add' ? '新建门店配置' : '编辑门店配置'"
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
                <el-form-item label="门店名称" prop="name">
                    <el-input
                        v-model.trim="formData.name"
                        placeholder="请输入门店名称"
                        maxlength="30"
                        show-word-limit
                    />
                </el-form-item>
                <el-form-item label="省市区" prop="region">
                    <div class="region-row">
                        <el-input
                            v-model.trim="formData.province"
                            placeholder="省"
                            class="!w-1/3"
                        />
                        <el-input
                            v-model.trim="formData.city"
                            placeholder="市"
                            class="!w-1/3"
                        />
                        <el-input
                            v-model.trim="formData.district"
                            placeholder="区"
                            class="!w-1/3"
                        />
                    </div>
                </el-form-item>
                <el-form-item label="详细地址" prop="address">
                    <el-input
                        v-model.trim="formData.address"
                        placeholder="请输入详细地址"
                        maxlength="60"
                        show-word-limit
                    />
                </el-form-item>
                <el-form-item label="地图经纬度" prop="lng">
                    <div class="region-row">
                        <el-input
                            v-model.trim="formData.lng"
                            placeholder="经度（如 116.404）"
                            class="!w-1/2"
                        />
                        <el-input
                            v-model.trim="formData.lat"
                            placeholder="纬度（如 39.915）"
                            class="!w-1/2"
                        />
                    </div>
                    <div class="text-xs text-tx-secondary mt-1">
                        平台管理员配置第三方地图 API 后回填门店经纬度坐标
                    </div>
                </el-form-item>
                <el-form-item label="客服微信号" prop="wxAccount">
                    <el-input
                        v-model.trim="formData.wxAccount"
                        placeholder="请填写门店客服微信号"
                        maxlength="30"
                    />
                </el-form-item>
                <el-form-item label="微信二维码" prop="wxQrcode">
                    <el-upload
                        :show-file-list="false"
                        :auto-upload="false"
                        accept="image/*"
                        :on-change="handleQrcodeChange"
                    >
                        <div v-if="formData.wxQrcode" class="qrcode-preview">
                            <img :src="formData.wxQrcode" alt="二维码" />
                            <div class="qrcode-mask">点击替换</div>
                        </div>
                        <div v-else class="qrcode-placeholder">
                            <icon name="shangchuanzhaopian" :size="20" />
                            <div class="mt-1 text-xs">点击上传</div>
                        </div>
                    </el-upload>
                    <div class="text-xs text-tx-secondary mt-1">
                        支持 jpg / png，建议尺寸 200×200
                    </div>
                </el-form-item>
                <el-form-item label="专车公告" prop="busNotice">
                    <el-input
                        v-model="formData.busNotice"
                        type="textarea"
                        :rows="3"
                        placeholder="可使用富文本编辑专车公告信息，前端弹窗展示"
                        maxlength="300"
                        show-word-limit
                    />
                </el-form-item>
                <el-form-item label="选车规则" prop="rule">
                    <el-input
                        v-model="formData.rule"
                        type="textarea"
                        :rows="3"
                        placeholder="可使用富文本编辑选车规则信息"
                        maxlength="300"
                        show-word-limit
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="submitLoading" @click="submitForm">
                    确认
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

// 规则说明（按图）
const ruleRows = [
    { rule: '地图经纬度', desc: '平台管理员配置第三方地图API，门店精确定位坐标经纬度' }
]

// 弹窗状态
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const submitLoading = ref(false)
const formRef = ref()

const blankForm = () => ({
    name: '',
    province: '',
    city: '',
    district: '',
    address: '',
    lng: '',
    lat: '',
    wxAccount: '',
    wxQrcode: '',
    busNotice: '',
    rule: ''
})
const formData = reactive(blankForm())

const formRules = {
    name: [{ required: true, message: '请输入门店名称', trigger: 'blur' }],
    province: [{ required: true, message: '请填写省', trigger: 'blur' }],
    city: [{ required: true, message: '请填写市', trigger: 'blur' }],
    district: [{ required: true, message: '请填写区', trigger: 'blur' }],
    address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
    lng: [
        {
            validator: (_: any, v: string, cb: any) => {
                if (!v) return cb()
                if (!/^-?\d+(\.\d+)?$/.test(v)) return cb(new Error('经度格式不正确'))
                cb()
            },
            trigger: 'blur'
        }
    ],
    lat: [
        {
            validator: (_: any, v: string, cb: any) => {
                if (!v) return cb()
                if (!/^-?\d+(\.\d+)?$/.test(v)) return cb(new Error('纬度格式不正确'))
                cb()
            },
            trigger: 'blur'
        }
    ],
    wxAccount: [{ required: true, message: '请填写客服微信号', trigger: 'blur' }],
    wxQrcode: [{ required: true, message: '请上传微信二维码', trigger: 'change' }],
    busNotice: [{ required: true, message: '请填写专车公告', trigger: 'blur' }],
    rule: [{ required: true, message: '请填写选车规则', trigger: 'blur' }]
}

const resetForm = () => {
    Object.assign(formData, blankForm())
    formRef.value?.clearValidate()
}

const handleEdit = () => {
    dialogMode.value = 'edit'
    dialogVisible.value = true
}

const handleQrcodeChange = (file: any) => {
    if (file.raw) {
        try {
            formData.wxQrcode = URL.createObjectURL(file.raw)
        } catch {
            formData.wxQrcode = `https://picsum.photos/seed/qr${Date.now()}/200/200`
        }
    } else if (file.url) {
        formData.wxQrcode = file.url
    }
}

const submitForm = async () => {
    try {
        await formRef.value?.validate()
    } catch {
        return
    }
    submitLoading.value = true
    await new Promise((r) => setTimeout(r, 250))
    // 持久化逻辑（mock：仅提示成功）
    ElMessage.success(dialogMode.value === 'add' ? '新建成功' : '保存成功')
    submitLoading.value = false
    dialogVisible.value = false
}
</script>

<style lang="scss" scoped>
.scripture-config {
    .page-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
    }
    .page-subtitle {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 16px;
    }
    .desc-list {
        .desc-item {
            display: flex;
            line-height: 1.9;
            color: var(--el-text-color-regular);
            font-size: 14px;
            .desc-label {
                font-weight: 600;
                color: var(--el-text-color-primary);
                flex-shrink: 0;
            }
            .desc-text {
                flex: 1;
            }
        }
    }
    .rule-table {
        :deep(th.el-table__cell) {
            background-color: var(--el-color-primary);
            color: #fff;
        }
        :deep(th.el-table__cell .cell) {
            color: #fff;
        }
    }
    .region-row {
        display: flex;
        gap: 8px;
        width: 100%;
    }
    .qrcode-placeholder {
        width: 100px;
        height: 100px;
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
    .qrcode-preview {
        position: relative;
        width: 100px;
        height: 100px;
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
        .qrcode-mask {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.45);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.2s;
        }
        &:hover .qrcode-mask {
            opacity: 1;
        }
    }
}
</style>
