// 剧本管理共享 mock 数据
// 说明：分类/车次/剧本 三表联动，统一从这里导出，避免页面之间相互 import 单文件
import { reactive } from 'vue'

export type Status = 0 | 1 // 0 下架/禁用   1 上架/启用

export interface CategoryItem {
    id: number
    name: string
    /** 父级分类 ID，null 表示一级分类 */
    parentId: number | null
    status: Status
    createTime: string
    /** 树形展示用：二级分类挂在一级分类下 */
    children?: CategoryItem[]
}

export interface ScheduleItem {
    id: number
    name: string
    /** 精确到分钟：YYYY-MM-DD HH:mm */
    startTime: string
    status: Status
    createTime: string
}

export interface ScriptItem {
    id: number
    name: string
    /** 关联的剧本分类 ID（仅限二级分类） */
    categoryId: number
    intro: string
    /** 关联的车次 ID 列表 */
    scheduleIds: number[]
    /** 封面图 URL */
    cover: string
    status: Status
    createTime: string
}

// ============ mock 数据 ============
const nowCreate = (offsetDays = 0) => {
    const d = new Date()
    d.setDate(d.getDate() - offsetDays)
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
        d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 分类：二级结构（parentId 为 null 表示一级）
const initCategories: CategoryItem[] = [
    // 一级
    { id: 1, name: '推理', parentId: null, status: 1, createTime: nowCreate(45) },
    { id: 2, name: '情感', parentId: null, status: 1, createTime: nowCreate(40) },
    { id: 3, name: '恐怖', parentId: null, status: 1, createTime: nowCreate(36) },
    { id: 4, name: '欢乐', parentId: null, status: 1, createTime: nowCreate(30) },
    { id: 5, name: '古风', parentId: null, status: 1, createTime: nowCreate(25) },
    // 二级（推理）
    { id: 11, name: '本格推理', parentId: 1, status: 1, createTime: nowCreate(44) },
    { id: 12, name: '变格推理', parentId: 1, status: 1, createTime: nowCreate(43) },
    { id: 13, name: '硬核推理', parentId: 1, status: 1, createTime: nowCreate(42) },
    // 二级（情感）
    { id: 21, name: '古风情感', parentId: 2, status: 1, createTime: nowCreate(39) },
    { id: 22, name: '现代情感', parentId: 2, status: 1, createTime: nowCreate(38) },
    // 二级（恐怖）
    { id: 31, name: '日式怪谈', parentId: 3, status: 1, createTime: nowCreate(35) },
    { id: 32, name: '美式惊悚', parentId: 3, status: 0, createTime: nowCreate(34) },
    // 二级（欢乐）
    { id: 41, name: '机制欢乐', parentId: 4, status: 1, createTime: nowCreate(29) },
    { id: 42, name: '撕逼欢乐', parentId: 4, status: 1, createTime: nowCreate(28) },
    // 二级（古风）
    { id: 51, name: '唐朝古风', parentId: 5, status: 1, createTime: nowCreate(24) },
    { id: 52, name: '宋朝古风', parentId: 5, status: 1, createTime: nowCreate(23) }
]

// 车次（精确到分钟，24h 制）
const initSchedules: ScheduleItem[] = [
    { id: 1, name: '周末晚场 A 段', startTime: '2026-07-25 19:30', status: 1, createTime: nowCreate(60) },
    { id: 2, name: '周末晚场 B 段', startTime: '2026-07-25 21:30', status: 1, createTime: nowCreate(60) },
    { id: 3, name: '周五黄金场', startTime: '2026-07-24 20:00', status: 1, createTime: nowCreate(58) },
    { id: 4, name: '工作日午后场', startTime: '2026-07-23 14:00', status: 1, createTime: nowCreate(55) },
    { id: 5, name: '七夕限定场', startTime: '2026-08-20 19:00', status: 1, createTime: nowCreate(50) },
    { id: 6, name: '暑期新本体验场', startTime: '2026-08-05 15:30', status: 1, createTime: nowCreate(48) },
    { id: 7, name: '深夜恐怖场', startTime: '2026-07-30 22:30', status: 0, createTime: nowCreate(40) },
    { id: 8, name: '中秋团圆场', startTime: '2026-09-15 18:00', status: 1, createTime: nowCreate(35) },
    { id: 9, name: '国庆七日连开场', startTime: '2026-10-01 10:00', status: 1, createTime: nowCreate(28) },
    { id: 10, name: '新手友好日场', startTime: '2026-07-22 13:00', status: 1, createTime: nowCreate(20) }
]

// 剧本（categoryId 仅指向二级分类）
const initScripts: ScriptItem[] = [
    {
        id: 1,
        name: '云落山庄杀人事件',
        categoryId: 11,
        intro: '封闭山庄、暴风雪之夜、7 名嫌疑人。经典硬核推理本，注重证据链与动机推演。',
        scheduleIds: [1, 2, 3],
        cover: 'https://picsum.photos/seed/jb1/750/400',
        status: 1,
        createTime: nowCreate(50)
    },
    {
        id: 2,
        name: '长安夜雨',
        categoryId: 21,
        intro: '盛唐背景下的一场悲欢离合，三对情侣命运交织，沉浸情感本。',
        scheduleIds: [5, 8],
        cover: 'https://picsum.photos/seed/jb2/750/400',
        status: 1,
        createTime: nowCreate(45)
    },
    {
        id: 3,
        name: '午夜巴士',
        categoryId: 31,
        intro: '一辆驶向未知的末班巴士，乘客各自背负秘密。恐怖沉浸向。',
        scheduleIds: [7],
        cover: 'https://picsum.photos/seed/jb3/750/400',
        status: 1,
        createTime: nowCreate(38)
    },
    {
        id: 4,
        name: '海岛大冒险',
        categoryId: 41,
        intro: '欢乐机制阵营本，撕逼与笑点齐飞，适合团建。',
        scheduleIds: [4, 6, 10],
        cover: 'https://picsum.photos/seed/jb4/750/400',
        status: 1,
        createTime: nowCreate(30)
    },
    {
        id: 5,
        name: '无声的证词',
        categoryId: 13,
        intro: '本格推理硬核本，6 人本，3.5 小时，注重严密推演。',
        scheduleIds: [1, 3],
        cover: 'https://picsum.photos/seed/jb5/750/400',
        status: 1,
        createTime: nowCreate(22)
    },
    {
        id: 6,
        name: '旧宅怪谈',
        categoryId: 31,
        intro: '日式怪谈，氛围恐怖，适合 3-5 人的短篇体验。',
        scheduleIds: [],
        cover: 'https://picsum.photos/seed/jb6/750/400',
        status: 0,
        createTime: nowCreate(15)
    },
    {
        id: 7,
        name: '那年夏天',
        categoryId: 22,
        intro: '青春情感本，回忆杀，3 男 3 女配置。',
        scheduleIds: [5, 10],
        cover: 'https://picsum.photos/seed/jb7/750/400',
        status: 1,
        createTime: nowCreate(10)
    },
    {
        id: 8,
        name: '深海回响',
        categoryId: 11,
        intro: '海上孤岛悬疑推理，7 人本，注重时间线梳理。',
        scheduleIds: [2, 9],
        cover: 'https://picsum.photos/seed/jb8/750/400',
        status: 1,
        createTime: nowCreate(5)
    }
]

export const categoryList = reactive<CategoryItem[]>(initCategories)
export const scheduleList = reactive<ScheduleItem[]>(initSchedules)
export const scriptList = reactive<ScriptItem[]>(initScripts)

/** 分类层级：1 一级 / 2 二级 */
export const getCategoryLevel = (c: CategoryItem): 1 | 2 =>
    c.parentId === null ? 1 : 2

/** 父级分类名称（无则返回 -） */
export const getParentName = (parentId: number | null): string => {
    if (parentId === null) return '-'
    return categoryList.find((c) => c.id === parentId)?.name || '-'
}

/** 仅一级分类（作为二级分类的父级候选） */
export const getLevel1Categories = (excludeId?: number) =>
    categoryList.filter(
        (c) => getCategoryLevel(c) === 1 && c.id !== excludeId
    )

/** 仅二级分类（剧本只能关联二级） */
export const getLevel2Categories = () =>
    categoryList.filter((c) => getCategoryLevel(c) === 2)

/** 根据分类名查 ID */
export const getCategoryIdByName = (name: string) =>
    categoryList.find((c) => c.name === name)?.id