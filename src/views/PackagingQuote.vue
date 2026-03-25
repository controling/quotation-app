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
        <button class="btn btn-accent btn-block" @click="currentStep = 1" style="height:46px;font-size:15px">下一步：选择类别</button>
      </div>
    </div>

    <!-- Step 2: 选择类别 -->
    <div v-show="currentStep === 1">
      <div class="m-card">
        <div class="m-card-header">
          <h3>选择药包材类别</h3>
          <span style="font-size:12px;color:var(--text-3)">共 {{ (searchActive ? searchTotal : store.categories.length) }} 个类别</span>
        </div>
        <div class="m-search" style="padding:8px 14px">
          <div class="m-search-bar" style="height:38px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="搜索包材名称..." v-model="sampleSearch" @input="onSampleSearch" />
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
        <div class="pagination" v-if="totalPages > 1" style="padding:8px 14px">
          <van-pagination v-model="samplePage" :total-items="filteredCategories.length" :items-per-page="samplePageSize" :show-page-size="3" />
        </div>
      </div>
      <div class="step-action">
        <button class="btn btn-ghost btn-block" @click="currentStep = 0" style="height:40px;margin-bottom:8px">上一步</button>
        <button class="btn btn-accent btn-block" @click="currentStep = 2" :disabled="cart.length === 0" style="height:46px;font-size:15px">
          下一步：购物车 ({{ cart.length }})
        </button>
      </div>
    </div>

    <!-- Step 3: 购物车 -->
    <div v-show="currentStep === 2">
      <div v-if="cart.length > 0">
        <div class="section-head"><h3>检测购物车 ({{ cart.length }}项)</h3></div>
        <div v-for="sample in cartSamples" :key="sample" class="cart-group">
          <div class="cart-group-header">
            <span class="cart-sample-name" style="color:var(--accent)">{{ sample }}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" width="18" height="18" style="cursor:pointer;flex-shrink:0" @click="removeSampleFromCart(sample)">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </div>
          <div v-for="item in getCartItemsBySample(sample)" :key="item.id" class="cart-item">
            <div class="cart-item-info">
              <span class="cart-item-name">{{ item.name }}</span>
              <span class="cart-item-meta">{{ item.method || '-' }}</span>
            </div>
            <div class="cart-item-right">
              <van-stepper v-model="item.quantity" :min="1" :max="99" theme="round" button-size="20" />
              <span class="price" style="min-width:70px;text-align:right">¥{{ item.unit_price * item.quantity }}</span>
            </div>
          </div>
        </div>
        <div class="cart-total">
          <span style="font-size:15px">合计: <b class="price" style="font-size:20px">¥{{ cartTotal.toFixed(2) }}</b></span>
          <button class="btn btn-sm" style="background:var(--danger-light);color:var(--danger);border:none" @click="clearCart">清空</button>
        </div>
      </div>
      <div v-else class="empty-state">
        <h3>购物车为空</h3>
        <p>请返回选择类别添加检测项目</p>
      </div>
      <div class="step-action">
        <button class="btn btn-ghost btn-block" @click="currentStep = 1" style="height:40px;margin-bottom:8px">返回选择类别</button>
        <button class="btn btn-accent btn-block" @click="onGenerate" :disabled="cart.length === 0" style="height:46px;font-size:15px">生成报价单</button>
      </div>
    </div>

    <!-- 类别检测项目弹窗 -->
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
          <button class="btn btn-sm btn-ghost" @click="selectAll">全选</button>
          <button class="btn btn-sm btn-ghost" @click="deselectAll">取消全选</button>
          <button class="btn btn-sm btn-accent" @click="addSelectedToCart">加入购物车 ({{ selectedIds.size }})</button>
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
import { usePackagingItemsStore } from '../stores/packagingItems'
import { useQuotationsStore } from '../stores/quotations'
import { packagingItemsApi } from '../api'

const router = useRouter()
const store = usePackagingItemsStore()
const quoteStore = useQuotationsStore()

const steps = ['客户信息', '选择类别', '购物车']
const currentStep = ref(0)
const customerName = ref('')
const contactPerson = ref('')
const sampleSearch = ref('')
const samplePage = ref(1)
const samplePageSize = 20

const showSamplePopup = ref(false)
const selectedSample = ref('')
const selectedIds = ref(new Set())
const selectedIdsArr = computed({ get: () => Array.from(selectedIds.value), set: (v) => { selectedIds.value = new Set(v) } })
const cart = ref([])

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
const totalPages = computed(() => Math.ceil(filteredCategories.value.length / samplePageSize))
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
      const { data } = await packagingItemsApi.list({ search: q, page_size: 50, page: 1 })
      searchActive.value = true
      searchTotal.value = data.total
      searchResults.value = (data.samples || []).map(s => s.category)
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

function getCategoryItemCount(cat) { return store.items.filter(i => i.category === cat).length }

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
      const { data } = await packagingItemsApi.list({ search: q, page_size: 50, page: 1 })
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

function toggleItem(id) { if (selectedIds.value.has(id)) selectedIds.value.delete(id); else selectedIds.value.add(id); selectedIds.value = new Set(selectedIds.value) }
function selectAll() { selectedIds.value = new Set(selectedSampleItems.value.map(i => i.id)) }
function deselectAll() { selectedIds.value = new Set() }

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
function clearCart() { cart.value = [] }
const cartTotal = computed(() => cart.value.reduce((sum, i) => sum + i.unit_price * i.quantity, 0))
function goStep(i) { if (i <= currentStep.value) currentStep.value = i }

async function onGenerate() {
  if (!customerName.value) { toast('请填写客户名称'); return }
  const payload = {
    title: customerName.value, customer_name: customerName.value, contact_person: contactPerson.value,
    sample_name: cartSamples.value.join('、'), quotation_type: 'packaging', total_amount: cartTotal.value,
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
