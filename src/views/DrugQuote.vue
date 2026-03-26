<template>
  <div class="page-content">
    <!-- Step indicator -->
    <div class="step-bar">
      <div v-for="(s, i) in steps" :key="i" class="step-item" :class="{ active: currentStep === i, done: currentStep > i }" @click="goStep(i)">
        <div class="step-num">{{ currentStep > i ? '✓' : i + 1 }}</div>
        <div class="step-label">{{ s }}</div>
      </div>
    </div>

    <!-- Step 1: 客户信息 -->
    <div v-show="currentStep === 0">
      <div class="m-card">
        <div class="m-card-header"><h3>客户信息</h3></div>
        <div class="m-card-body" style="padding:8px 16px">
          <div class="form-row full" style="margin-bottom:12px">
            <div class="form-group">
              <label>客户名称</label>
              <input class="form-input" v-model="customerName" placeholder="请输入客户名称" />
            </div>
          </div>
          <div class="form-row full">
            <div class="form-group">
              <label>联系人</label>
              <input class="form-input" v-model="contactPerson" placeholder="请输入联系人" />
            </div>
          </div>
        </div>
      </div>
      <div class="step-action">
        <button class="btn btn-primary btn-block" @click="currentStep = 1" style="height:46px;font-size:15px">下一步：选择样品</button>
      </div>
    </div>

    <!-- Step 2: 选择样品 -->
    <div v-show="currentStep === 1">
      <div class="m-card">
        <div class="m-card-header">
          <h3>选择样品</h3>
          <span style="font-size:12px;color:var(--text-3)">共 {{ searchActive ? searchTotal : allCategories.length }} 个样品</span>
        </div>
        <div class="m-search" style="padding:8px 14px">
          <div class="m-search-bar" style="height:38px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="搜索样品名称..." v-model="sampleSearch" @input="onSampleSearch" />
          </div>
        </div>
        <div class="sample-list" style="padding:0 14px 8px">
          <div
            v-for="cat in pagedCategories"
            :key="cat"
            class="order-card"
            style="margin-bottom:6px;cursor:pointer"
            @click="selectSample(cat)"
          >
            <div class="oc-top" style="padding:10px 14px">
              <div>
                <div class="oc-customer" style="font-size:14px">{{ cat }}</div>
                <div class="oc-id" style="margin-top:2px">{{ getCategoryItemCount(cat) }}项检测</div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="2" width="18" height="18"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </div>
        </div>
        <div class="pagination" v-if="totalSamplePages > 1" style="padding:8px 14px">
          <van-pagination v-model="samplePage" :total-items="filteredCategories.length" :items-per-page="samplePageSize" :show-page-size="3" />
        </div>
      </div>
      <div class="step-action">
        <button class="btn btn-ghost btn-block" @click="currentStep = 0" style="height:40px;margin-bottom:8px">上一步</button>
        <button class="btn btn-primary btn-block" @click="currentStep = 2" :disabled="cart.length === 0" style="height:46px;font-size:15px">
          下一步：购物车 ({{ cart.length }})
        </button>
      </div>
    </div>

    <!-- Step 3: 购物车 & 生成 -->
    <div v-show="currentStep === 2">
      <div v-if="cart.length > 0">
        <div class="m-card">
          <div class="m-card-header">
            <h3>检测购物车 ({{ cart.length }}项)</h3>
            <button class="btn btn-sm" style="background:var(--danger-light);color:var(--danger);border:none" @click="clearCart">清空</button>
          </div>
          <div class="m-card-body" style="padding:8px 14px">
            <div v-for="sample in cartSamples" :key="sample" style="margin-bottom:8px">
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);margin-bottom:4px">
                <span style="font-weight:700;color:var(--primary);font-size:14px">{{ sample }}</span>
                <div style="display:flex;align-items:center;gap:8px">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" width="18" height="18" style="cursor:pointer" @click="openAddItemForSample(sample)">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" width="18" height="18" style="cursor:pointer" @click="removeSampleFromCart(sample)">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </div>
              </div>
              <div v-for="item in getCartItemsBySample(sample)" :key="item.id" class="cart-item">
                <div class="cart-item-info" style="flex:1;min-width:0">
                  <div style="display:flex;align-items:center;gap:6px">
                    <span class="cart-item-name">{{ item.name }}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" width="14" height="14" style="cursor:pointer;flex-shrink:0;opacity:.6" @click="removeItemFromCart(item.id)">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </div>
                  <div class="cart-item-meta">{{ item.method || '-' }}</div>
                </div>
                <div class="cart-item-right">
                  <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">
                    <span style="font-size:11px;color:var(--text-3)">单价</span>
                    <input class="form-input" type="number" v-model.number="item.unit_price" style="width:70px;height:28px;font-size:13px;text-align:right;padding:0 6px" />
                  </div>
                  <div style="display:flex;align-items:center;justify-content:space-between">
                    <van-stepper v-model="item.quantity" :min="1" :max="99" theme="round" button-size="20" />
                    <span class="price" style="min-width:65px;text-align:right">¥{{ item.unit_price * item.quantity }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style="padding:0 14px 12px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;padding-top:12px">
            <span style="font-size:15px">合计: <b class="price" style="font-size:20px">¥{{ cartTotal.toFixed(2) }}</b></span>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm btn-block" style="margin-top:8px" @click="currentStep = 1">+ 添加样品</button>
      </div>
      <div v-else class="empty-state">
        <h3>购物车为空</h3>
        <p>请返回选择样品添加检测项目</p>
      </div>
      <div class="step-action">
        <button class="btn btn-ghost btn-block" @click="currentStep = 1" style="height:40px;margin-bottom:8px">返回选择样品</button>
        <button class="btn btn-primary btn-block" @click="onGenerate" :disabled="cart.length === 0" style="height:46px;font-size:15px">生成报价单</button>
      </div>
    </div>

    <!-- Sample items popup -->
    <van-popup v-model:show="showSamplePopup" position="bottom" round :style="{ maxHeight: '85%' }">
      <div class="popup-wrap" v-if="selectedSample">
        <div class="popup-header">
          <div>
            <h3>{{ selectedSample }}</h3>
            <span class="popup-sub">{{ selectedSampleItems.length }}项检测</span>
          </div>
          <div class="sheet-close" @click="showSamplePopup = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
        </div>
        <div class="popup-actions">
          <button class="btn btn-sm btn-ghost" @click="selectAllSampleItems">全选</button>
          <button class="btn btn-sm btn-ghost" @click="deselectAllSampleItems">取消全选</button>
          <button class="btn btn-sm btn-primary" @click="addSelectedToCart">加入购物车 ({{ selectedIds.size }})</button>
        </div>
        <div class="m-search" style="padding:0 14px 8px">
          <div class="m-search-bar" style="height:36px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="搜索检测项目..." v-model="popupSearch" @input="onPopupSearch" />
          </div>
        </div>
        <div class="popup-items">
          <van-checkbox-group v-model="selectedIdsArr">
            <van-cell v-for="item in displayedPopupItems" :key="item.id" clickable @click="toggleItem(item.id)">
              <template #title>
                <div style="display:flex;align-items:center;gap:8px">
                  <van-checkbox :name="item.id" @click.stop />
                  <div>
                    <div style="font-weight:500">{{ item.name }}</div>
                    <div style="font-size:12px;color:var(--text-3)">{{ item.method || '-' }} | {{ item.cycle_days }}天</div>
                  </div>
                </div>
              </template>
              <template #value>
                <span class="price">¥{{ item.unit_price }}</span>
              </template>
            </van-cell>
          </van-checkbox-group>
        </div>
      </div>
    </van-popup>

    <!-- Cart add item popup -->
    <van-popup v-model:show="showCartAddPopup" position="bottom" round :style="{ maxHeight: '85%' }">
      <div class="popup-wrap">
        <div class="popup-header">
          <div>
            <h3>添加检测项目</h3>
            <span class="popup-sub">共 {{ cartAddFilteredItems.length }} 项可添加</span>
          </div>
          <div class="sheet-close" @click="showCartAddPopup = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
        </div>
        <div style="padding:0 14px 8px">
          <div class="m-search-bar" style="height:36px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="搜索项目名称或样品..." v-model="cartAddSearch" />
          </div>
        </div>
        <div class="popup-actions">
          <button class="btn btn-sm btn-ghost" @click="selectedIds = new Set(cartAddFilteredItems.map(i => i.id))">全选</button>
          <button class="btn btn-sm btn-ghost" @click="selectedIds = new Set()">取消全选</button>
          <button class="btn btn-sm btn-primary" @click="addItemsToCartSample">加入 ({{ selectedIds.size }})</button>
        </div>
        <div class="popup-items">
          <van-checkbox-group v-model="selectedIdsArr">
            <van-cell v-for="item in cartAddFilteredItems" :key="item.id" clickable @click="toggleItem(item.id)">
              <template #title>
                <div style="display:flex;align-items:center;gap:8px">
                  <van-checkbox :name="item.id" @click.stop />
                  <div>
                    <div style="font-weight:500">{{ item.name }}</div>
                    <div style="font-size:12px;color:var(--text-3)">{{ item.category }} | {{ item.method || '-' }}</div>
                  </div>
                </div>
              </template>
              <template #value><span class="price">¥{{ item.unit_price }}</span></template>
            </van-cell>
          </van-checkbox-group>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from '../utils/toast'
import { useDrugItemsStore } from '../stores/drugItems'
import { useQuotationsStore } from '../stores/quotations'
import { drugItemsApi } from '../api'

const router = useRouter()
const store = useDrugItemsStore()
const quoteStore = useQuotationsStore()

const steps = ['客户信息', '选择样品', '购物车']
const currentStep = ref(0)

const customerName = ref('')
const contactPerson = ref('')
const sampleSearch = ref('')
const samplePage = ref(1)
const samplePageSize = 20

const showSamplePopup = ref(false)
const selectedSample = ref('')
const selectedIds = ref(new Set())
const selectedIdsArr = computed({
  get: () => Array.from(selectedIds.value),
  set: (v) => { selectedIds.value = new Set(v) }
})

const cart = ref([])
const showCartAddPopup = ref(false)
const cartAddSample = ref('')

// Server-side search state
const searchActive = ref(false)
const searchResults = ref([])
const searchTotal = ref(0)
let searchTimer = null

onMounted(() => { store.loadAll() })

const allCategories = computed(() => store.categories)
const filteredCategories = computed(() => {
  if (searchActive.value) return searchResults.value
  if (!sampleSearch.value) return allCategories.value
  return allCategories.value.filter(c => c.toLowerCase().includes(sampleSearch.value.toLowerCase()))
})
const totalSamplePages = computed(() => Math.ceil(filteredCategories.value.length / samplePageSize))
const pagedCategories = computed(() => {
  const start = (samplePage.value - 1) * samplePageSize
  return filteredCategories.value.slice(start, start + samplePageSize)
})

function onSampleSearch() {
  samplePage.value = 1
  clearTimeout(searchTimer)
  const q = sampleSearch.value.trim()
  if (!q) {
    searchActive.value = false
    searchResults.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    try {
      const { data } = await drugItemsApi.list({ search: q, page_size: 50, page: 1 })
      searchActive.value = true
      searchTotal.value = data.total
      searchResults.value = (data.samples || []).map(s => s.category)
      // Merge found items into store for popup display
      const existingIds = new Set(store.items.map(i => i.id))
      for (const sample of (data.samples || [])) {
        for (const item of sample.items) {
          if (!existingIds.has(item.id)) {
            store.items.push(item)
            existingIds.add(item.id)
          }
        }
      }
    } catch { searchActive.value = false }
  }, 300)
}

function getCategoryItemCount(cat) {
  if (searchActive.value) return store.items.filter(i => i.category === cat).length
  return store.items.filter(i => i.category === cat).length
}

// Popup search
const popupSearch = ref('')
const popupSearchResults = ref([])
let popupSearchTimer = null

function selectSample(cat) {
  selectedSample.value = cat
  selectedIds.value = new Set()
  popupSearch.value = ''
  popupSearchResults.value = []
  showSamplePopup.value = true
}

const selectedSampleItems = computed(() => {
  if (popupSearchResults.value.length > 0) return popupSearchResults.value
  return store.items.filter(i => i.category === selectedSample.value)
})
const displayedPopupItems = computed(() => selectedSampleItems.value)

function onPopupSearch() {
  clearTimeout(popupSearchTimer)
  const q = popupSearch.value.trim()
  if (!q) {
    popupSearchResults.value = []
    return
  }
  popupSearchTimer = setTimeout(async () => {
    try {
      const { data } = await drugItemsApi.list({ search: q, page_size: 50, page: 1 })
      const results = []
      const existingIds = new Set(store.items.map(i => i.id))
      for (const sample of (data.samples || [])) {
        for (const item of sample.items) {
          results.push(item)
          if (!existingIds.has(item.id)) {
            store.items.push(item)
            existingIds.add(item.id)
          }
        }
      }
      popupSearchResults.value = results
    } catch { popupSearchResults.value = [] }
  }, 300)
}

function toggleItem(id) {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id)
  else selectedIds.value.add(id)
  selectedIds.value = new Set(selectedIds.value)
}
function selectAllSampleItems() { selectedIds.value = new Set(selectedSampleItems.value.map(i => i.id)) }
function deselectAllSampleItems() { selectedIds.value = new Set() }

function addSelectedToCart() {
  const items = selectedSampleItems.value.filter(i => selectedIds.value.has(i.id))
  let added = 0
  for (const item of items) {
    if (!cart.value.find(c => c.id === item.id)) {
      cart.value.push({ id: item.id, name: item.name, category: item.category, standard: item.standard, method: item.method, unit_price: item.unit_price, quantity: 1, cma: item.cma, cnas: item.cnas, cycle_days: item.cycle_days, description: item.description })
      added++
    }
  }
  showSamplePopup.value = false
  toast(`已添加 ${added} 项到购物车`)
}

const cartSamples = computed(() => [...new Set(cart.value.map(i => i.category))])
function getCartItemsBySample(sample) { return cart.value.filter(i => i.category === sample) }
function removeSampleFromCart(sample) { cart.value = cart.value.filter(i => i.category !== sample) }
function removeItemFromCart(id) { cart.value = cart.value.filter(i => i.id !== id) }
function clearCart() { cart.value = [] }

function openAddItemForSample(sample) {
  cartAddSample.value = sample
  selectedIds.value = new Set()
  cartAddSearch.value = ''
  showCartAddPopup.value = true
}
const cartAddSearch = ref('')
const cartAddFilteredItems = computed(() => {
  const existingIds = new Set(cart.value.map(i => i.id))
  let items = store.items.filter(i => !existingIds.has(i.id))
  if (cartAddSearch.value) {
    const q = cartAddSearch.value.toLowerCase()
    items = items.filter(i => i.name.toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q))
  }
  return items.slice(0, 100)
})
function addItemsToCartSample() {
  const items = store.items.filter(i => selectedIds.value.has(i.id))
  let added = 0
  for (const item of items) {
    if (!cart.value.find(c => c.id === item.id)) {
      cart.value.push({ id: item.id, name: item.name, category: item.category, standard: item.standard, method: item.method, unit_price: item.unit_price, quantity: 1, cma: item.cma, cnas: item.cnas, cycle_days: item.cycle_days, description: item.description })
      added++
    }
  }
  showCartAddPopup.value = false
  if (added) toast(`已添加 ${added} 项`)
}
const cartTotal = computed(() => cart.value.reduce((sum, i) => sum + i.unit_price * i.quantity, 0))

function goStep(i) {
  if (i <= currentStep.value) currentStep.value = i
}

async function onGenerate() {
  if (!customerName.value) { toast('请填写客户名称'); return }
  if (cart.value.length === 0) { toast('购物车为空'); return }
  const payload = {
    title: customerName.value, customer_name: customerName.value, contact_person: contactPerson.value,
    sample_name: cartSamples.value.join('、'), quotation_type: 'drug', total_amount: cartTotal.value,
    items_json: cart.value.map(i => ({ id: i.id, name: i.name, category: i.category, standard: i.standard, method: i.method, unit_price: i.unit_price, quantity: i.quantity, subtotal: i.unit_price * i.quantity, cma: i.cma, cnas: i.cnas, cycle_days: i.cycle_days, description: i.description }))
  }
  try {
    const q = await quoteStore.createQuotationDirect(payload)
    toast('报价单已生成')
    router.push('/quote-preview/' + q.id)
  } catch (e) {
    toast('生成失败: ' + (e.response?.data?.detail || e.message || ''))
  }
}
</script>
