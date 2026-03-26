<template>
  <div class="page-content">
    <van-loading v-if="loading" vertical style="padding: 40px 0">加载中...</van-loading>

    <div v-else-if="!quotation">
      <div class="empty-state">
        <h3>报价单不存在</h3>
      </div>
      <button class="btn btn-primary btn-block" @click="$router.push('/')" style="height:46px;font-size:15px">返回首页</button>
    </div>

    <div v-else>
      <!-- Header -->
      <div class="quote-header">
        <h2>委托检测报价表</h2>
        <div class="quote-no">{{ quotation.quote_no }}</div>
      </div>

      <!-- Info (view mode) -->
      <div class="m-card" v-if="!editing">
        <div class="m-card-body" style="padding:4px 0">
          <div class="detail-row" style="padding:12px 16px">
            <span class="dr-label">客户名称</span>
            <span class="dr-value">{{ quotation.customer_name }}</span>
          </div>
          <div class="detail-row" style="padding:12px 16px">
            <span class="dr-label">联系人</span>
            <span class="dr-value">{{ quotation.contact_person || '-' }}</span>
          </div>
          <div class="detail-row" style="padding:12px 16px">
            <span class="dr-label">样品名称</span>
            <span class="dr-value">{{ quotation.sample_name || '-' }}</span>
          </div>
          <div class="detail-row" style="padding:12px 16px">
            <span class="dr-label">报价日期</span>
            <span class="dr-value">{{ quotation.created_at }}</span>
          </div>
          <div class="detail-row" style="padding:12px 16px">
            <span class="dr-label">类型</span>
            <span class="dr-value">{{ quotation.type === 'drug' ? '药品检测' : '药包材检测' }}</span>
          </div>
          <div class="detail-row" style="padding:12px 16px;border-bottom:none">
            <span class="dr-label">状态</span>
            <span class="badge" :class="statusBadge(quotation.status)">{{ statusText(quotation.status) }}</span>
          </div>
        </div>
      </div>

      <!-- Info (edit mode) -->
      <div class="m-card" v-if="editing">
        <div class="m-card-header"><h3>客户信息</h3></div>
        <div class="m-card-body" style="padding:8px 16px">
          <div class="form-row full" style="margin-bottom:12px">
            <div class="form-group">
              <label>客户名称</label>
              <input class="form-input" v-model="editForm.customer_name" placeholder="请输入客户名称" />
            </div>
          </div>
          <div class="form-row full">
            <div class="form-group">
              <label>联系人</label>
              <input class="form-input" v-model="editForm.contact_person" placeholder="请输入联系人" />
            </div>
          </div>
        </div>
      </div>

      <!-- Items - view mode -->
      <div class="m-card" v-if="!editing">
        <div class="m-card-header"><h3>检测项目明细</h3></div>
        <div class="m-card-body" style="padding:8px 14px">
          <div v-for="sample in groupedItems" :key="sample.name" class="view-sample-group" style="margin-bottom:10px">
            <div class="view-sample-name">{{ sample.name }}</div>
            <div v-for="(item, idx) in sample.items" :key="idx" class="view-item">
              <span class="view-item-name">{{ item.name }}</span>
              <span class="view-item-meta">{{ item.method || '-' }} | {{ item.cycle_days || '-' }}天</span>
              <span class="price">¥{{ item.unit_price }} × {{ item.quantity }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Items - edit mode -->
      <div class="m-card" v-if="editing">
        <div class="m-card-header">
          <h3>检测项目明细</h3>
          <span style="font-size:12px;color:var(--text-3)">{{ editForm.items.length }}项</span>
        </div>
        <div class="m-card-body" style="padding:8px 14px">
          <!-- Inline search -->
          <div class="m-search-bar" style="height:36px;margin-bottom:8px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="搜索添加检测项目..." v-model="editSearchText" @input="onEditSearch" @focus="showEditSearch = true" />
          </div>
          <!-- Search suggestions -->
          <div v-if="showEditSearch && editSearchResults.length > 0" class="edit-search-dropdown">
            <div v-for="item in editSearchResults" :key="item.id" class="edit-search-item" @click="addSingleItem(item)">
              <div>
                <span style="font-weight:500">{{ item.name }}</span>
                <span style="font-size:11px;color:var(--text-3);margin-left:6px">{{ item.category }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <span class="price" style="font-size:13px">¥{{ item.unit_price }}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" width="18" height="18"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
            </div>
          </div>
          <!-- Sample filter pills -->
          <div class="filter-pills" style="margin-bottom:8px" v-if="editSampleCats.length > 1">
            <div class="filter-pill" :class="{ active: editFilterCat === '' }" @click="editFilterCat = ''">全部</div>
            <div class="filter-pill" v-for="cat in editSampleCats" :key="cat" :class="{ active: editFilterCat === cat }" @click="editFilterCat = cat">{{ cat }}</div>
          </div>
          <!-- Item list -->
          <div v-for="(item, index) in editFilteredItems" :key="item.id || index" class="edit-item-row">
            <div class="edit-item-left">
              <div class="edit-item-name">{{ item.name }}</div>
              <div class="edit-item-meta">{{ item.method || '-' }} · {{ item.cycle_days || '-' }}天</div>
            </div>
            <div class="edit-item-center">
              <input class="form-input" type="number" v-model.number="item.unit_price" style="width:70px;height:32px;font-size:13px;text-align:right" />
              <span style="color:var(--text-3)">×</span>
              <input class="form-input" type="number" v-model.number="item.quantity" style="width:48px;height:32px;font-size:13px;text-align:center" />
            </div>
            <div class="edit-item-right">
              <span class="price" style="font-size:13px">¥{{ (item.unit_price * item.quantity).toFixed(2) }}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" width="16" height="16" style="cursor:pointer" @click="removeEditItem(item)">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
          </div>
          <div v-if="editFilteredItems.length === 0" style="text-align:center;padding:16px;color:var(--text-3);font-size:13px">
            {{ editFilterCat ? '该样品下暂无项目' : '暂无检测项目，请搜索添加' }}
          </div>
          <!-- Add more -->
          <button class="btn btn-ghost btn-sm btn-block" style="margin-top:8px" @click="showSamplePicker = true">从样品列表添加</button>
        </div>
      </div>

      <!-- Total -->
      <div class="m-card">
        <div class="m-card-body" style="display:flex;align-items:center;justify-content:space-between;padding:16px">
          <span style="font-size:15px;font-weight:600;color:var(--text-2)">合计金额</span>
          <span class="price" style="font-size:22px;font-weight:800">¥{{ Number(editing ? editTotal : quotation.total).toFixed(2) }}</span>
        </div>
      </div>

      <!-- Actions - view mode -->
      <div class="action-bar" v-if="!editing">
        <button class="btn btn-primary btn-block" @click="onExport" style="height:46px;font-size:15px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          导出 XLSX
        </button>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-warning btn-sm" style="flex:1" @click="startEdit" v-if="quotation.status === 'draft'">编辑报价单</button>
          <button class="btn btn-accent btn-sm" style="flex:1" @click="onConfirm" v-if="quotation.status === 'draft'">确认报价</button>
          <button class="btn btn-danger btn-sm" style="flex:1" @click="onDelete">删除报价单</button>
        </div>
      </div>

      <!-- Actions - edit mode -->
      <div class="action-bar" v-if="editing">
        <button class="btn btn-primary btn-block" @click="onSave" style="height:46px;font-size:15px">保存修改</button>
        <button class="btn btn-ghost btn-block" @click="cancelEdit" style="height:40px;margin-top:8px">取消</button>
      </div>
    </div>

    <!-- Sample picker popup -->
    <van-popup v-model:show="showSamplePicker" position="bottom" round :style="{ maxHeight: '80%' }">
      <div class="popup-wrap">
        <div class="popup-header">
          <h3>选择样品</h3>
          <div class="sheet-close" @click="showSamplePicker = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
        </div>
        <div style="padding:8px 16px">
          <div class="m-search-bar" style="height:38px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="搜索样品..." v-model="sampleSearchText" />
          </div>
        </div>
        <div class="popup-items">
          <div
            v-for="cat in filteredSampleList"
            :key="cat"
            class="order-card"
            style="margin:0 16px 6px;cursor:pointer"
            @click="showSampleItems(cat)"
          >
            <div class="oc-top" style="padding:10px 14px">
              <div>
                <div class="oc-customer" style="font-size:14px">{{ cat }}</div>
                <div class="oc-id" style="margin-top:2px">{{ getSampleItemCount(cat) }}项</div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="2" width="16" height="16"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- Sample items popup -->
    <van-popup v-model:show="showSampleItemsPopup" position="bottom" round :style="{ maxHeight: '80%' }">
      <div class="popup-wrap" v-if="currentSample">
        <div class="popup-header">
          <div><h3>{{ currentSample }}</h3><span class="popup-sub">{{ currentSampleItems.length }}项</span></div>
          <div class="sheet-close" @click="showSampleItemsPopup = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
        </div>
        <div class="popup-actions">
          <button class="btn btn-sm btn-primary" @click="addSampleItems">全部加入</button>
        </div>
        <div class="popup-items">
          <div
            v-for="item in currentSampleItems"
            :key="item.id"
            class="order-card"
            style="margin:0 16px 6px;cursor:pointer"
            @click="addSingleItem(item)"
          >
            <div class="oc-top" style="padding:10px 14px">
              <div>
                <div class="oc-customer" style="font-size:14px">{{ item.name }}</div>
                <div class="oc-id" style="margin-top:2px">{{ item.method || '-' }}</div>
              </div>
              <span class="price">¥{{ item.unit_price }}</span>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- Search popup -->
    <van-popup v-model:show="showSearch" position="bottom" round :style="{ maxHeight: '80%' }">
      <div class="popup-wrap">
        <div class="popup-header">
          <h3>搜索添加</h3>
          <div class="sheet-close" @click="showSearch = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
        </div>
        <div style="padding:8px 16px">
          <div class="m-search-bar" style="height:38px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="搜索项目名称..." v-model="searchText" />
          </div>
        </div>
        <div class="popup-items">
          <div
            v-for="item in searchResults"
            :key="item.id"
            class="order-card"
            style="margin:0 16px 6px;cursor:pointer"
            @click="addSingleItem(item)"
          >
            <div class="oc-top" style="padding:10px 14px">
              <div>
                <div class="oc-customer" style="font-size:14px">{{ item.name }}</div>
                <div class="oc-id" style="margin-top:2px">{{ item.category }} | ¥{{ item.unit_price }}</div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" width="20" height="20"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
          </div>
          <div v-if="searchText && searchResults.length === 0" class="empty-state" style="padding:24px">
            <p>未找到匹配项</p>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { toast } from '../utils/toast'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog } from 'vant'
import { useQuotationsStore } from '../stores/quotations'
import { useDrugItemsStore } from '../stores/drugItems'
import { usePackagingItemsStore } from '../stores/packagingItems'
import { quotationsApi } from '../api'
import { exportQuotation } from '../utils/excel'

const route = useRoute()
const router = useRouter()
const quoteStore = useQuotationsStore()
const drugStore = useDrugItemsStore()
const packagingStore = usePackagingItemsStore()

const loading = ref(true)
const quotation = ref(null)
const editing = ref(false)
const editForm = ref({ customer_name: '', contact_person: '', items: [] })

const showSearch = ref(false)
const searchText = ref('')
const showSamplePicker = ref(false)
const sampleSearchText = ref('')
const showSampleItemsPopup = ref(false)
const currentSample = ref('')

// Edit mode enhancements
const editSearchText = ref('')
const showEditSearch = ref(false)
const editSearchResults = ref([])
const editFilterCat = ref('')
let editSearchTimer = null

const editSampleCats = computed(() => [...new Set(editForm.value.items.map(i => i.category).filter(Boolean))])
const editFilteredItems = computed(() => {
  if (editFilterCat.value) return editForm.value.items.filter(i => i.category === editFilterCat.value)
  return editForm.value.items
})

function onEditSearch() {
  clearTimeout(editSearchTimer)
  const q = editSearchText.value.trim()
  if (!q) { editSearchResults.value = []; return }
  editSearchTimer = setTimeout(async () => {
    const store = itemStore.value
    editSearchResults.value = store.items.filter(i =>
      i.name.toLowerCase().includes(q.toLowerCase()) ||
      (i.category || '').toLowerCase().includes(q.toLowerCase())
    ).slice(0, 8)
  }, 200)
}

function removeEditItem(item) {
  const idx = editForm.value.items.findIndex(i => i.id === item.id)
  if (idx >= 0) editForm.value.items.splice(idx, 1)
}

onMounted(async () => {
  const id = Number(route.params.id)
  quotation.value = quoteStore.getQuotation(id)
  if (!quotation.value) {
    try { quotation.value = await quoteStore.getQuotationRemote(id) } catch (e) { quotation.value = null }
  }
  drugStore.loadAll()
  packagingStore.loadAll()
  loading.value = false
})

const groupedItems = computed(() => {
  if (!quotation.value) return []
  const map = {}
  quotation.value.items.forEach(item => {
    const cat = item.category || '未分类'
    if (!map[cat]) map[cat] = { name: cat, items: [] }
    map[cat].items.push(item)
  })
  return Object.values(map)
})

const editTotal = computed(() => editForm.value.items.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0))

const itemStore = computed(() => quotation.value?.type === 'packaging' ? packagingStore : drugStore)
const filteredSampleList = computed(() => {
  const cats = itemStore.value.categories
  if (!sampleSearchText.value) return cats
  return cats.filter(c => c.toLowerCase().includes(sampleSearchText.value.toLowerCase()))
})
function getSampleItemCount(cat) { return itemStore.value.items.filter(i => i.category === cat).length }

const currentSampleItems = computed(() => itemStore.value.items.filter(i => i.category === currentSample.value))

const searchResults = computed(() => {
  if (!searchText.value) return []
  const q = searchText.value.toLowerCase()
  return itemStore.value.items.filter(i => i.name.toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q)).slice(0, 30)
})

function showSampleItems(cat) {
  currentSample.value = cat
  showSamplePicker.value = false
  showSampleItemsPopup.value = true
}

function addSampleItems() {
  let added = 0
  currentSampleItems.value.forEach(item => {
    if (!editForm.value.items.find(i => i.id === item.id)) {
      editForm.value.items.push({ id: item.id, name: item.name, category: item.category, standard: item.standard, method: item.method, unit_price: item.unit_price, quantity: 1, cma: item.cma, cnas: item.cnas, cycle_days: item.cycle_days, description: item.description })
      added++
    }
  })
  showSampleItemsPopup.value = false
  toast(`已添加 ${added} 项`)
}

function addSingleItem(item) {
  const exists = editForm.value.items.find(i => i.id === item.id)
  if (exists) { exists.quantity += 1 }
  else {
    editForm.value.items.push({ id: item.id, name: item.name, category: item.category, standard: item.standard, method: item.method, unit_price: item.unit_price, quantity: 1, cma: item.cma, cnas: item.cnas, cycle_days: item.cycle_days, description: item.description })
  }
  showSearch.value = false
  showSampleItemsPopup.value = false
  showEditSearch.value = false
  editSearchText.value = ''
  editSearchResults.value = []
  toast(`已添加: ${item.name}`)
}

function removeItem(index) { editForm.value.items.splice(index, 1) }

function startEdit() {
  editForm.value = {
    customer_name: quotation.value.customer_name || '',
    contact_person: quotation.value.contact_person || '',
    items: quotation.value.items.map(i => ({ ...i }))
  }
  editFilterCat.value = ''
  editSearchText.value = ''
  showEditSearch.value = false
  editing.value = true
}
function cancelEdit() { editing.value = false }

async function onSave() {
  try {
    const sampleNames = [...new Set(editForm.value.items.map(i => i.category))].join('、')
    const payload = {
      customer_name: editForm.value.customer_name,
      contact_person: editForm.value.contact_person,
      sample_name: sampleNames,
      total_amount: editTotal.value,
      items_json: editForm.value.items.map(i => ({
        id: i.id, name: i.name, category: i.category, standard: i.standard,
        method: i.method, unit_price: i.unit_price, quantity: i.quantity,
        subtotal: i.unit_price * i.quantity, cma: i.cma, cnas: i.cnas,
        cycle_days: i.cycle_days, description: i.description
      }))
    }
    const { data } = await quotationsApi.update({ item_id: quotation.value.id, ...payload })
    quotation.value = { ...quotation.value, ...data, items: data.items }
    editing.value = false
    toast('保存成功')
  } catch (e) {
    toast('保存失败: ' + (e.response?.data?.detail || e.message || ''))
  }
}

function statusText(s) { return { draft: '草稿', confirmed: '已确认', sent: '已发送' }[s] || s }
function statusBadge(s) { return { draft: 'badge-gray', confirmed: 'badge-green', sent: 'badge-blue' }[s] || 'badge-gray' }

function onExport() {
  if (!quotation.value) return
  exportQuotation(quotation.value)
  toast('导出成功')
}

function onConfirm() {
  showConfirmDialog({ title: '确认报价', message: '确认后状态将变更为"已确认"' })
    .then(async () => {
      await quoteStore.updateQuotationStatus(quotation.value.id, 'confirmed')
      quotation.value.status = 'confirmed'
      toast('已确认')
    }).catch(() => {})
}

function onDelete() {
  showConfirmDialog({ title: '删除报价单', message: '确定要删除此报价单吗？删除后不可恢复。' })
    .then(async () => {
      try {
        await quoteStore.deleteQuotation(quotation.value.id)
        toast('已删除')
        router.push('/')
      } catch (e) {
        toast('删除失败: ' + (e.response?.data?.detail || e.message || ''))
      }
    }).catch(() => {})
}
</script>

<style scoped>
.edit-search-dropdown {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-bottom: 8px;
  max-height: 240px;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0,0,0,.1);
}
.edit-search-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
}
.edit-search-item:last-child { border-bottom: none; }
.edit-search-item:active { background: var(--bg); }

.edit-item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f7;
}
.edit-item-row:last-child { border-bottom: none; }
.edit-item-left { flex: 1; min-width: 0; }
.edit-item-name { font-weight: 500; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.edit-item-meta { font-size: 11px; color: var(--text-3); margin-top: 2px; }
.edit-item-center { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.edit-item-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; min-width: 70px; justify-content: flex-end; }

.filter-pills { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; }
.filter-pill {
  flex-shrink: 0;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: var(--bg);
  color: var(--text-2);
  cursor: pointer;
  border: 1px solid transparent;
  transition: all .15s;
}
.filter-pill.active {
  background: var(--primary-light, #eef1ff);
  color: var(--primary);
  border-color: var(--primary);
}
</style>
