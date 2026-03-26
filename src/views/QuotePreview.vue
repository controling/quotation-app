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
          <div v-for="sample in editSampleGroups" :key="sample.name" style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);margin-bottom:4px">
              <span style="font-weight:700;color:var(--primary);font-size:14px">{{ sample.name }}</span>
              <div style="display:flex;align-items:center;gap:8px">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" width="18" height="18" style="cursor:pointer" @click="openAddItemForSample(sample.name)">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" width="18" height="18" style="cursor:pointer" @click="removeEditSample(sample.name)">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </div>
            </div>
            <div v-for="item in sample.items" :key="item.id" class="cart-item">
              <div class="cart-item-info" style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:6px">
                  <span class="cart-item-name">{{ item.name }}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" width="14" height="14" style="cursor:pointer;flex-shrink:0;opacity:.6" @click="removeEditItem(item.id)">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </div>
                <div class="cart-item-meta">{{ item.method || '-' }} · {{ item.cycle_days || '-' }}天</div>
              </div>
              <div class="cart-item-right">
                <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">
                  <span style="font-size:11px;color:var(--text-3)">单价</span>
                  <input class="form-input" type="number" v-model.number="item.unit_price" style="width:70px;height:28px;font-size:13px;text-align:right;padding:0 6px" />
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <van-stepper v-model="item.quantity" :min="1" :max="99" theme="round" button-size="20" />
                  <span class="price" style="min-width:65px;text-align:right">¥{{ (item.unit_price * item.quantity).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="editForm.items.length === 0" style="text-align:center;padding:16px;color:var(--text-3);font-size:13px">暂无检测项目，请点击下方添加</div>
          <button class="btn btn-ghost btn-sm btn-block" style="margin-top:8px" @click="openAddItemForSample('')">+ 添加检测项目</button>
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

    <!-- Cart add item popup -->
    <van-popup v-model:show="showCartAddPopup" position="bottom" round :style="{ maxHeight: '85%' }">
      <div class="popup-wrap">
        <div class="popup-header">
          <div>
            <h3>添加检测项目</h3>
            <span class="popup-sub">共 {{ cartAddItems.length }} 项</span>
          </div>
          <div class="sheet-close" @click="showCartAddPopup = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
        </div>
        <div style="padding:0 14px 8px">
          <div class="m-search-bar" style="height:36px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="搜索样品名或检测项目..." v-model="cartAddSearch" @input="onCartAddSearch" />
          </div>
        </div>
        <div class="popup-actions">
          <button class="btn btn-sm btn-ghost" @click="selectedEditIds = new Set(cartAddItems.map(i => i.id))">全选</button>
          <button class="btn btn-sm btn-ghost" @click="selectedEditIds = new Set()">取消全选</button>
          <button class="btn btn-sm btn-primary" @click="addItemsToEdit">加入 ({{ selectedEditIds.size }})</button>
        </div>
        <div class="popup-items">
          <div v-for="group in cartAddSampleGroups" :key="group.name" style="border-bottom:1px solid var(--border);padding-bottom:4px;margin-bottom:4px">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 12px;cursor:pointer" @click="toggleSampleItems(group)">
              <div style="display:flex;align-items:center;gap:6px">
                <van-checkbox :model-value="isSampleFullySelected(group)" @update:model-value="v => toggleSampleItems(group, v)" @click.stop />
                <span style="font-weight:600;font-size:13px;color:var(--primary)">{{ group.name }}</span>
              </div>
              <span style="font-size:11px;color:var(--text-3)">{{ group.items.length }}项</span>
            </div>
            <van-checkbox-group v-model="selectedEditIdsArr">
              <div v-for="item in group.items" :key="item.id" style="display:flex;align-items:center;justify-content:space-between;padding:5px 12px 5px 32px;cursor:pointer" @click="toggleEditItem(item.id)">
                <div style="display:flex;align-items:center;gap:6px">
                  <van-checkbox :name="item.id" @click.stop />
                  <span style="font-size:13px">{{ item.name }}</span>
                  <span style="font-size:11px;color:var(--text-3)">{{ item.method || '-' }}</span>
                </div>
                <span class="price" style="font-size:13px">¥{{ item.unit_price }}</span>
              </div>
            </van-checkbox-group>
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
import { quotationsApi, itemsApi } from '../api'
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

// Edit mode
const showCartAddPopup = ref(false)
const cartAddSample = ref('')
const cartAddSearch = ref('')
const cartAddItems = ref([])
const selectedEditIds = ref(new Set())
const selectedEditIdsArr = computed({
  get: () => Array.from(selectedEditIds.value),
  set: (v) => { selectedEditIds.value = new Set(v) }
})
let cartAddTimer = null

const editSampleGroups = computed(() => {
  const map = {}
  editForm.value.items.forEach(item => {
    const cat = item.category || '未分类'
    if (!map[cat]) map[cat] = { name: cat, items: [] }
    map[cat].items.push(item)
  })
  return Object.values(map)
})

function removeEditItem(id) {
  editForm.value.items = editForm.value.items.filter(i => i.id !== id)
}
function removeEditSample(name) {
  editForm.value.items = editForm.value.items.filter(i => i.category !== name)
}

function openAddItemForSample(sample) {
  cartAddSample.value = sample
  selectedEditIds.value = new Set()
  cartAddSearch.value = ''
  cartAddItems.value = []
  showCartAddPopup.value = true
  loadCartAddItems()
}
async function loadCartAddItems() {
  try {
    const itemType = quotation.value?.type === 'packaging' ? 'packaging' : 'drug'
    const { data } = await itemsApi.all(itemType)
    const existingIds = new Set(editForm.value.items.map(i => i.id))
    let items = (data.items || []).filter(i => !existingIds.has(i.id))
    if (cartAddSearch.value) {
      const q = cartAddSearch.value.toLowerCase()
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    }
    cartAddItems.value = items
  } catch {}
}
function onCartAddSearch() {
  clearTimeout(cartAddTimer)
  cartAddTimer = setTimeout(() => loadCartAddItems(), 300)
}

const cartAddSampleGroups = computed(() => {
  const map = {}
  cartAddItems.value.forEach(item => {
    const cat = item.category || '未分类'
    if (!map[cat]) map[cat] = { name: cat, items: [] }
    map[cat].items.push(item)
  })
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name, 'zh'))
})

function isSampleFullySelected(group) {
  return group.items.every(i => selectedEditIds.value.has(i.id))
}

function toggleSampleItems(group, forceVal) {
  const allSelected = isSampleFullySelected(group)
  const shouldSelect = forceVal !== undefined ? forceVal : !allSelected
  for (const item of group.items) {
    if (shouldSelect) selectedEditIds.value.add(item.id)
    else selectedEditIds.value.delete(item.id)
  }
  selectedEditIds.value = new Set(selectedEditIds.value)
}
function addItemsToEdit() {
  const targetSample = cartAddSample.value
  const items = cartAddItems.value.filter(i => selectedEditIds.value.has(i.id))
  let added = 0
  for (const item of items) {
    if (!editForm.value.items.find(c => c.id === item.id)) {
      editForm.value.items.push({ id: item.id, name: item.name, category: targetSample || item.category, standard: item.standard, method: item.method, unit_price: item.unit_price, quantity: 1, cma: item.cma, cnas: item.cnas, cycle_days: item.cycle_days, description: item.description })
      added++
    }
  }
  showCartAddPopup.value = false
  if (added) toast(`已添加 ${added} 项`)
}
function toggleEditItem(id) {
  if (selectedEditIds.value.has(id)) selectedEditIds.value.delete(id)
  else selectedEditIds.value.add(id)
  selectedEditIds.value = new Set(selectedEditIds.value)
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

function startEdit() {
  editForm.value = {
    customer_name: quotation.value.customer_name || '',
    contact_person: quotation.value.contact_person || '',
    items: quotation.value.items.map(i => ({ ...i }))
  }
  showCartAddPopup.value = false
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
