<template>
    <div class="scripture-config">
        <el-card class="!border-none" shadow="never">
            <h1 class="page-title">门店配置</h1>
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
            <el-tabs v-model="activeTab" class="config-tabs">
                <!-- 基本信息 -->
                <el-tab-pane label="基本信息" name="basic">
                    <el-form
                        ref="basicRef"
                        :model="formData"
                        :rules="basicRules"
                        label-width="100px"
                        class="config-form"
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
                        <el-form-item>
                            <el-button
                                type="primary"
                                :loading="basicLoading"
                                @click="saveBasic"
                            >
                                保存
                            </el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- 客服信息 -->
                <el-tab-pane label="客服信息" name="service">
                    <el-form
                        ref="serviceRef"
                        :model="formData"
                        :rules="serviceRules"
                        label-width="100px"
                        class="config-form"
                    >
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
                        <el-form-item>
                            <el-button
                                type="primary"
                                :loading="serviceLoading"
                                @click="saveService"
                            >
                                保存
                            </el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- 专车公告 -->
                <el-tab-pane label="专车公告" name="notice">
                    <el-form
                        ref="noticeRef"
                        :model="formData"
                        :rules="noticeRules"
                        label-width="100px"
                        class="config-form"
                    >
                        <el-form-item label="专车公告" prop="busNotice">
                            <el-input
                                v-model="formData.busNotice"
                                type="textarea"
                                :rows="6"
                                placeholder="编辑专车公告信息，前端弹窗展示"
                                maxlength="300"
                                show-word-limit
                            />
                        </el-form-item>
                        <el-form-item>
                            <el-button
                                type="primary"
                                :loading="noticeLoading"
                                @click="saveNotice"
                            >
                                保存
                            </el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- 选车规则配置 -->
                <el-tab-pane label="选车规则配置" name="rule">
                    <el-form
                        ref="ruleRef"
                        :model="formData"
                        :rules="ruleRules"
                        label-width="100px"
                        class="config-form"
                    >
                        <el-form-item label="选车规则" prop="rule">
                            <el-input
                                v-model="formData.rule"
                                type="textarea"
                                :rows="6"
                                placeholder="编辑选车规则信息"
                                maxlength="300"
                                show-word-limit
                            />
                        </el-form-item>
                        <el-form-item>
                            <el-button
                                type="primary"
                                :loading="ruleLoading"
                                @click="saveRule"
                            >
                                保存
                            </el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
            </el-tabs>
        </el-card>

        <el-card class="!border-none mt-4" shadow="never">
            <el-table :data="ruleRows" :show-header="true" class="rule-table">
                <el-table-column label="规则" prop="rule" width="180" />
                <el-table-column label="说明" prop="desc" />
            </el-table>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

// 当前 Tab
const activeTab = ref('basic')

// 规则说明
const ruleRows = [
    {
        rule: '地图经纬度',
        desc: '平台管理员配置第三方地图API，门店精确定位坐标经纬度'
    }
]

// 表单数据
const formData = reactive({
    name: '海森林沉浸式剧本体验馆',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    address: '建国路 88 号 SOHO 现代城 B 座 12 层',
    lng: '116.474',
    lat: '39.908',
    wxAccount: 'haisenlin_dm',
    wxQrcode: '',
    busNotice:
        '【专车服务】本店为距离 3 公里以上的玩家提供免费专车接送，请在开场前 1 小时于小程序预约。',
    rule:
        '【选车规则】每位玩家每周最多预约 2 个本；热门本需提前 24 小时锁定车位；退订请于开场前 4 小时操作。'
})

// 校验规则（按 Tab 拆分）
const basicRules = {
    name: [{ required: true, message: '请输入门店名称', trigger: 'blur' }],
    province: [{ required: true, message: '请填写省', trigger: 'blur' }],
    city: [{ required: true, message: '请填写市', trigger: 'blur' }],
    district: [{ required: true, message: '请填写区', trigger: 'blur' }],
    address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
    lng: [
        {
            validator: (_: any, v: string, cb: any) => {
                if (!v) return cb(new Error('请输入经度'))
                if (!/^-?\d+(\.\d+)?$/.test(v)) return cb(new Error('经度格式不正确'))
                cb()
            },
            trigger: 'blur'
        }
    ],
    lat: [
        {
            validator: (_: any, v: string, cb: any) => {
                if (!v) return cb(new Error('请输入纬度'))
                if (!/^-?\d+(\.\d+)?$/.test(v)) return cb(new Error('纬度格式不正确'))
                cb()
            },
            trigger: 'blur'
        }
    ]
}
const serviceRules = {
    wxAccount: [{ required: true, message: '请填写客服微信号', trigger: 'blur' }],
    wxQrcode: [{ required: true, message: '请上传微信二维码', trigger: 'change' }]
}
const noticeRules = {
    busNotice: [{ required: true, message: '请填写专车公告', trigger: 'blur' }]
}
const ruleRules = {
    rule: [{ required: true, message: '请填写选车规则', trigger: 'blur' }]
}

// 表单 refs
const basicRef = ref()
const serviceRef = ref()
const noticeRef = ref()
const ruleRef = ref()

// 各 Tab 保存 loading
const basicLoading = ref(false)
const serviceLoading = ref(false)
const noticeLoading = ref(false)
const ruleLoading = ref(false)

// 模拟持久化
const persist = (loading: { value: boolean }, msg: string) => {
    loading.value = true
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            loading.value = false
            ElMessage.success(msg)
            resolve()
        }, 250)
    })
}

const saveBasic = async () => {
    try {
        await basicRef.value?.validate()
    } catch {
        return
    }
    await persist(basicLoading, '基本信息已保存')
}
const saveService = async () => {
    try {
        await serviceRef.value?.validate()
    } catch {
        return
    }
    await persist(serviceLoading, '客服信息已保存')
}
const saveNotice = async () => {
    try {
        await noticeRef.value?.validate()
    } catch {
        return
    }
    await persist(noticeLoading, '专车公告已保存')
}
const saveRule = async () => {
    try {
        await ruleRef.value?.validate()
    } catch {
        return
    }
    await persist(ruleLoading, '选车规则已保存')
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
</script>

<style lang="scss" scoped>
.scripture-config {
    .page-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
    }
    .config-tabs {
        :deep(.el-tabs__header) {
            margin-bottom: 24px;
        }
    }
    .config-form {
        max-width: 640px;
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
