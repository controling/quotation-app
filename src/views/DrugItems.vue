<template>
  <div class="page-content">
    <van-loading v-if="!store.loaded" vertical style="padding: 40px 0">加载中...</van-loading>
    <template v-else>
      <!-- Sticky Search -->
      <div class="m-search" style="top: -14px;">
        <div class="m-search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="搜索样品名称、检测项目..." v-model="searchText" @input="onSearch" />
        </div>
      </div>

      <!-- Filter Pills -->
      <div class="filter-pills">
        <div class="filter-pill" :class="{ active: activeCategory === '' }" @click="activeCategory = ''">全部</div>
        <div
          class="filter-pill"
          v-for="cat in apiCategories"
          :key="cat"
          :class="{ active: activeCategory === cat }"
          @click="activeCategory = cat"
        >{{ cat }}</div>
      </div>

      <!-- Actions -->
      <div class="action-header">
        <ImportExcel buttonText="从Excel导入" @imported="onImport" />
        <button class="btn btn-ghost btn-sm" @click="onExport">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          导出
        </button>
        <button class="btn btn-primary btn-sm" @click="openAddDialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新增样品
        </button>
      </div>

      <!-- Stats -->
      <div style="font-size:12px;color:var(--text-3);padding:0 0 8px">
        共 {{ filteredGroups.length }} / {{ totalSamples }} 个样品, {{ totalDrugItems }} 项检测
      </div>

      <!-- Item Cards -->
      <div v-for="group in filteredGroups" :key="group.sample" class="item-card">
        <div class="ic-head" style="cursor:pointer" @click="toggleGroup(group.sample)">
          <div class="ic-info">
            <div class="ic-name">{{ group.sample }}</div>
            <div class="ic-meta">
              <span class="badge badge-blue">{{ group.items.length }}项</span>
              <span class="price" style="margin-left:4px">¥{{ group.totalPrice.toFixed(2) }}</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
            <button class="btn btn-sm btn-ghost" style="padding:2px 6px" @click.stop="openEditSampleName(group)" title="编辑样品名称">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-sm btn-ghost" style="padding:2px 6px" @click.stop="openAddForSample(group.sample)" title="添加检测项目">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <button class="btn btn-sm" style="background:var(--danger-light);color:var(--danger);border:none;padding:2px 6px" @click.stop="onDeleteSample(group.sample)" title="删除整个样品">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="2" width="16" height="16" :style="{ transform: expandedGroup === group.sample ? 'rotate(90deg)' : '', transition: 'transform .2s' }"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>
        <div class="ic-body" v-if="expandedGroup === group.sample" style="flex-direction:column;gap:6px;padding:0 14px 12px">
          <div
            v-for="item in group.items"
            :key="item.id"
            style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f5f5f7;width:100%"
          >
            <div style="flex:1;min-width:0;cursor:pointer" @click="openEditDialog(item)">
              <div style="display:flex;align-items:center;gap:4px">
                <span style="font-size:14px;font-weight:500">{{ item.name }}</span>
                <span class="badge badge-green" v-if="item.cma" style="font-size:10px;padding:1px 5px">CMA</span>
                <span class="badge badge-blue" v-if="item.cnas" style="font-size:10px;padding:1px 5px">CNAS</span>
              </div>
              <div style="font-size:12px;color:var(--text-3);margin-top:2px">{{ item.method || '-' }} · {{ item.cycle_days }}天</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
              <span class="price">¥{{ item.unit_price }}</span>
              <button class="btn btn-sm btn-ghost" @click.stop="openEditDialog(item)">编辑</button>
              <button class="btn btn-sm" style="background:var(--danger-light);color:var(--danger);border:none" @click.stop="onDelete(item)">删</button>
            </div>
          </div>
          <!-- Add item to this sample -->
          <button class="btn btn-sm btn-ghost btn-block" style="margin-top:4px;border:1px dashed var(--border)" @click.stop="openAddForSample(group.sample)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            添加检测项目
          </button>
          <!-- Sample total -->
          <div style="display:flex;justify-content:flex-end;padding:6px 0;font-size:13px;color:var(--text-2)">
            样品小计: <b class="price" style="margin-left:6px">¥{{ group.totalPrice.toFixed(2) }}</b>
          </div>
        </div>
      </div>

      <div v-if="filteredGroups.length === 0" class="empty-state">
        <h3>暂无数据</h3>
        <p>尝试调整筛选条件或新增项目</p>
      </div>

      <!-- Loading / end indicator -->
      <div style="text-align:center;padding:16px 0" v-if="loadingMore">
        <van-loading size="18px">加载中...</van-loading>
      </div>
      <div style="text-align:center;padding:12px 0;font-size:12px;color:var(--text-3)" v-else-if="store.loaded && !hasMore && filteredGroups.length > 0">
        已加载全部数据
      </div>
    </template>

    <!-- Back to top -->
    <div class="fab fab-secondary" v-if="showBackTop" @click="scrollToTop">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><polyline points="18 15 12 9 6 15"/></svg>
    </div>

    <!-- Add/Edit Dialog -->
    <van-dialog v-model:show="showDialog" :title="editingItem ? '编辑检测项目' : '新增检测项目'" show-cancel-button @confirm="onSave" :before-close="beforeClose">
      <div style="padding: 12px 16px">
        <van-field v-model="formData.category" label="样品名称" placeholder="如：中药饮片-丁香" />
        <van-field v-model="formData.name" label="检测项目" placeholder="如：性状" />
        <van-field v-model="formData.standard" label="标准" placeholder="如：中国药典2020版" />
        <van-field v-model="formData.method" label="方法" placeholder="如：目视/显微法" />
        <van-field v-model="formData.unit_price" type="number" label="单价(元)" placeholder="0" />
        <van-field label="CMA">
          <template #input><van-switch v-model="formData.cma" size="20px" /></template>
        </van-field>
        <van-field label="CNAS">
          <template #input><van-switch v-model="formData.cnas" size="20px" /></template>
        </van-field>
        <van-field v-model="formData.cycle_days" type="number" label="周期(天)" placeholder="5" />
        <van-field v-model="formData.description" label="备注" placeholder="可选" />
      </div>
    </van-dialog>

    <!-- Edit Sample Name Dialog -->
    <van-dialog v-model:show="showSampleEditDialog" title="修改样品名称" show-cancel-button @confirm="onSaveSampleName">
      <div style="padding: 12px 16px">
        <van-field v-model="newSampleName" label="新名称" placeholder="请输入新的样品名称" />
        <div style="font-size:12px;color:var(--text-3);padding:0 16px">将同步更新该样品下 {{ editingSampleItems.length }} 项检测项目的分类</div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { toast } from '../utils/toast'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDrugItemsStore } from '../stores/drugItems'
import { drugItemsApi, statsApi, itemsApi } from '../api'
import { exportItems } from '../utils/excel'
import { showConfirmDialog } from 'vant'
import ImportExcel from '../components/ImportExcel.vue'

const store = useDrugItemsStore()
const showDialog = ref(false)
const editingItem = ref(null)
const searchText = ref('')
const activeCategory = ref('')
const expandedGroup = ref('')
const formData = ref(getEmptyForm())
const loadedPages = ref(1)
const totalDrugItems = ref(0)
const totalSamples = ref(0)
const loadingMore = ref(false)
const apiCategories = ref([])
const showBackTop = ref(false)
// Edit sample name state
const showSampleEditDialog = ref(false)
const editingSampleName = ref('')
const editingSampleItems = ref([])
const newSampleName = ref('')
// API search state
const searchActive = ref(false)
const searchGroups = ref([])
let searchTimer = null
let scrollContainer = null
let lastLoadedHeight = 0

function getEmptyForm() {
  return { category: '', name: '', standard: '', method: '', unit_price: 0, cma: false, cnas: false, cycle_days: 5, description: '' }
}

onMounted(async () => {
  store.loadAll()
  // Load categories from API - extract major category prefix
  try {
    const res = await drugItemsApi.categories()
    const cats = res.data || []
    const prefixes = new Set()
    cats.forEach(c => {
      const prefix = c.split('-')[0]
      if (prefix && prefix.trim()) prefixes.add(prefix.trim())
    })
    apiCategories.value = [...prefixes].sort()
  } catch {}
  // Load stats
  try {
    const res = await statsApi.get()
    totalDrugItems.value = res.data.drug_items
    totalSamples.value = res.data.drug_samples || res.data.drug_items
  } catch {}
  // Find the actual scrollable container
  scrollContainer = document.querySelector('.page-content')
  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', onScroll, { passive: true })
  } else {
    window.addEventListener('scroll', onScroll, { passive: true })
  }
})

onUnmounted(() => {
  if (scrollContainer) scrollContainer.removeEventListener('scroll', onScroll)
  else window.removeEventListener('scroll', onScroll)
})

function onScroll() {
  if (loadingMore.value) return
  const el = scrollContainer || document.documentElement
  const scrollTop = el.scrollTop
  const scrollHeight = el.scrollHeight
  const clientHeight = el.clientHeight
  const scrollBottom = scrollHeight - scrollTop - clientHeight
  showBackTop.value = scrollTop > 400
  // Only trigger load if scroll height has actually grown since last load
  if (scrollBottom < 300 && store.totalSamples > 0 && filteredGroups.value.length < store.totalSamples && scrollHeight !== lastLoadedHeight) {
    lastLoadedHeight = scrollHeight
    loadMore()
  }
}

function scrollToTop() {
  const el = scrollContainer || document.documentElement
  el.scrollTo({ top: 0, behavior: 'smooth' })
}

async function loadMore() {
  if (loadingMore.value) return
  loadingMore.value = true
  try {
    loadedPages.value++
    await store.loadPage(loadedPages.value)
  } finally {
    loadingMore.value = false
  }
}

const filteredGroups = computed(() => {
  if (searchActive.value) return searchGroups.value
  let result = store.items
  if (activeCategory.value) {
    const prefix = activeCategory.value + '-'
    result = result.filter(i => i.category && (i.category === activeCategory.value || i.category.startsWith(prefix)))
  }
  const map = {}
  result.forEach(item => {
    const sample = item.category || '未分类'
    if (!map[sample]) map[sample] = { sample, items: [], totalPrice: 0 }
    map[sample].items.push(item)
    map[sample].totalPrice += Number(item.unit_price) || 0
  })
  return Object.values(map).sort((a, b) => a.sample.localeCompare(b.sample, 'zh'))
})

const hasMore = computed(() => !searchActive.value && store.loaded && store.totalSamples > 0 && filteredGroups.value.length < store.totalSamples)

function toggleGroup(sample) {
  expandedGroup.value = expandedGroup.value === sample ? '' : sample
}
function onSearch() {
  expandedGroup.value = ''
  clearTimeout(searchTimer)
  const q = searchText.value.trim()
  if (!q) {
    searchActive.value = false
    searchGroups.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    try {
      const { data } = await drugItemsApi.list({ search: q, page: 1, page_size: 100 })
      const map = {}
      for (const sample of (data.samples || [])) {
        for (const item of sample.items) {
          if (!map[sample.category]) map[sample.category] = { sample: sample.category, items: [], totalPrice: 0 }
          map[sample.category].items.push(item)
          map[sample.category].totalPrice += Number(item.unit_price) || 0
          // Also merge into store for edit popup
          if (!store.items.find(i => i.id === item.id)) store.items.push(item)
        }
      }
      searchActive.value = true
      searchGroups.value = Object.values(map).sort((a, b) => a.sample.localeCompare(b.sample, 'zh'))
    } catch {}
  }, 300)
}

async function onExport() {
  const { data } = await itemsApi.all('drug')
  exportItems(data.items || [], '药品检测项目')
}

function openAddDialog() {
  editingItem.value = null
  formData.value = getEmptyForm()
  showDialog.value = true
}

function openAddForSample(sampleName) {
  editingItem.value = null
  formData.value = { ...getEmptyForm(), category: sampleName }
  showDialog.value = true
}

function openEditSampleName(group) {
  editingSampleName.value = group.sample
  editingSampleItems.value = group.items
  newSampleName.value = group.sample
  showSampleEditDialog.value = true
}

async function onSaveSampleName() {
  const oldName = editingSampleName.value
  const name = newSampleName.value.trim()
  if (!name || name === oldName) return
  try {
    const items = editingSampleItems.value
    for (const item of items) {
      await drugItemsApi.update({ item_id: item.id, category: name })
    }
    toast(`已将「${oldName}」更名为「${name}」`)
    store.loaded = false
    store.loadAll()
  } catch (e) {
    toast('重命名失败: ' + (e.response?.data?.detail || e.message || ''))
  }
}

function openEditDialog(item) {
  editingItem.value = item
  formData.value = {
    category: item.category, name: item.name, standard: item.standard || '',
    method: item.method || '', unit_price: item.unit_price,
    cma: !!item.cma, cnas: !!item.cnas, cycle_days: item.cycle_days || 5,
    description: item.description || ''
  }
  showDialog.value = true
}

async function onSave() {
  try {
    const payload = {
      ...formData.value,
      unit_price: Number(formData.value.unit_price) || 0,
      cycle_days: Number(formData.value.cycle_days) || 5
    }
    if (editingItem.value) {
      await drugItemsApi.update({ item_id: editingItem.value.id, ...payload })
      toast('更新成功')
    } else {
      await drugItemsApi.create(payload)
      toast('添加成功')
    }
    store.loaded = false
    store.loadAll()
  } catch (e) {
    toast('操作失败: ' + (e.response?.data?.detail || e.message || ''))
  }
}

function onDelete(item) {
  showConfirmDialog({ title: '删除项目', message: `确定删除「${item.category} — ${item.name}」吗？` })
    .then(async () => {
      try {
        await drugItemsApi.delete({ item_id: item.id })
        toast('已删除')
        store.loaded = false
        store.loadAll()
      } catch (e) {
        toast('删除失败: ' + (e.response?.data?.detail || e.message || ''))
      }
    }).catch(() => {})
}

function onDeleteSample(sampleName) {
  const items = store.items.filter(i => i.category === sampleName)
  showConfirmDialog({
    title: '删除样品',
    message: `确定删除样品「${sampleName}」及其 ${items.length} 项检测项目吗？`
  }).then(async () => {
    try {
      for (const item of items) {
        await drugItemsApi.delete({ item_id: item.id })
      }
      toast(`已删除样品「${sampleName}」`)
      store.loaded = false
      store.loadAll()
    } catch (e) {
      toast('删除失败: ' + (e.response?.data?.detail || e.message || ''))
    }
  }).catch(() => {})
}

async function onImport(items) {
  try {
    const payload = items.map(i => ({
      category: i.category || '', name: i.name || '', standard: i.standard || '',
      method: i.method || '', unit_price: Number(i.unit_price) || 0,
      cma: !!i.cma, cnas: !!i.cnas, cycle_days: Number(i.cycle_days) || 5,
      description: i.description || ''
    }))
    const { data } = await drugItemsApi.import(payload)
    toast(`成功导入 ${data.imported} 条数据`)
    store.loaded = false
    store.loadAll()
  } catch (e) {
    toast('导入失败: ' + (e.response?.data?.detail || e.message || ''))
  }
}

function beforeClose(action) {
  if (action === 'cancel') formData.value = getEmptyForm()
  return true
}
</script>
