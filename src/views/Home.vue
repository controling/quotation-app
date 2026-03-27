<template>
  <div class="page-content">
    <!-- Welcome Banner -->
    <div class="welcome-banner">
      <div class="wb-deco1"></div>
      <div class="wb-deco2"></div>
      <div class="wb-date">{{ welcomeDate }}</div>
      <div class="wb-user">{{ userName }}</div>
      <div class="wb-sub">检测报价管理系统 · 一站式管理</div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card" style="background:linear-gradient(135deg,#eef1ff,#f5f7ff);border-color:#dde4ff" @click="router.push('/drug-items')">
        <div class="sc-icon" style="background:#dde4ff">
          <svg viewBox="0 0 24 24" fill="none" stroke="#4f6ef7" stroke-width="2" width="18" height="18"><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9l-6-6z"/><path d="M9 3v6h6"/></svg>
        </div>
        <div class="sc-val" style="color:var(--primary)">{{ stats.drug_items }}</div>
        <div class="sc-label">药品检测项目</div>
      </div>
      <div class="stat-card" style="background:linear-gradient(135deg,#d1fae5,#e6faf3);border-color:#bbf7d0" @click="router.push('/packaging-items')">
        <div class="sc-icon" style="background:#bbf7d0">
          <svg viewBox="0 0 24 24" fill="none" stroke="#06d6a0" stroke-width="2" width="18" height="18"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        </div>
        <div class="sc-val" style="color:var(--accent)">{{ stats.packaging_items }}</div>
        <div class="sc-label">药包材检测项目</div>
      </div>
      <div class="stat-card" style="background:linear-gradient(135deg,#fef3c7,#fef8ee);border-color:#fde68a" @click="router.push('/drug-quote')">
        <div class="sc-icon" style="background:#fde68a">
          <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
        </div>
        <div class="sc-val" style="color:var(--warning)">{{ stats.drug_quotes }}</div>
        <div class="sc-label">药品报价单</div>
      </div>
      <div class="stat-card" style="background:linear-gradient(135deg,#ede9fe,#f5f3ff);border-color:#ddd6fe" @click="router.push('/packaging-quote')">
        <div class="sc-icon" style="background:#ddd6fe">
          <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" width="18" height="18"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div class="sc-val" style="color:#8b5cf6">{{ stats.packaging_quotes }}</div>
        <div class="sc-label">药包材报价单</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="section-head"><h3>快捷操作</h3></div>
    <div class="quick-grid">
      <div class="quick-item" @click="router.push('/drug-items')">
        <div class="qi-icon" style="background:#eef1ff">
          <svg viewBox="0 0 24 24" fill="none" stroke="#4f6ef7" stroke-width="2" width="20" height="20"><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9l-6-6z"/><path d="M9 3v6h6"/></svg>
        </div>
        <span class="qi-label">药品报价</span>
      </div>
      <div class="quick-item" @click="router.push('/packaging-items')">
        <div class="qi-icon" style="background:#d1fae5">
          <svg viewBox="0 0 24 24" fill="none" stroke="#06d6a0" stroke-width="2" width="20" height="20"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        </div>
        <span class="qi-label">药包材</span>
      </div>
      <div class="quick-item" @click="router.push('/drug-quote')">
        <div class="qi-icon" style="background:#fef3c7">
          <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
        </div>
        <span class="qi-label">报价单</span>
      </div>
    </div>

    <!-- Auto Generate from Text -->
    <div class="section-head">
      <h3>智能生成报价单</h3>
    </div>
    <div class="m-card" style="margin-bottom:12px">
      <div style="padding:10px 14px">
        <textarea
          v-model="pasteText"
          placeholder="粘贴样品名称，一行一个或用逗号/分号/空格等分隔&#10;&#10;示例：&#10;  八角茴香&#10;  马松子&#10;  亚甲蓝&#10;  八角茴香, 马松子, 亚甲蓝&#10;&#10;输入样品名会自动匹配该样品下所有检测项目&#10;也可粘贴Excel数据"
          style="width:100%;height:240px;border:1px solid var(--border);border-radius:8px;padding:10px;font-size:13px;resize:vertical;box-sizing:border-box;line-height:1.6;font-family:inherit"
        ></textarea>
        <div style="display:flex;gap:8px;margin-top:8px;align-items:center">
          <button class="btn btn-ghost btn-sm" @click="pasteFromClipboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            读取剪贴板
          </button>
          <div style="flex:1"></div>
          <span style="font-size:12px;color:var(--text-3)">{{ matchedCount > 0 ? `已匹配 ${matchedCount} 项` : '' }}</span>
          <button class="btn btn-primary btn-sm" @click="onAutoGenerate('drug')" :disabled="!pasteText.trim()">药品报价</button>
          <button class="btn btn-sm" style="background:var(--accent);color:#fff;border:none" @click="onAutoGenerate('packaging')" :disabled="!pasteText.trim()">包材报价</button>
        </div>
      </div>
    </div>

    <!-- Recent Quotations -->
    <div class="section-head">
      <h3>药品报价单</h3>
      <span class="link" @click="router.push('/drug-quote')">新建</span>
    </div>
    <template v-if="drugQuotations.length > 0">
      <div
        class="order-card"
        v-for="q in drugQuotations.slice(0, 5)"
        :key="q.id"
        @click="router.push('/quote-preview/' + q.id)"
      >
        <div class="oc-top">
          <div>
            <div class="oc-id">{{ q.quote_no }}</div>
            <div class="oc-customer">{{ q.customer_name || '-' }}</div>
          </div>
          <span class="badge" :class="statusBadge(q.status)">{{ statusText(q.status) }}</span>
        </div>
        <div class="oc-items">{{ q.sample_name || '-' }}</div>
        <div class="oc-foot">
          <span style="font-size:12px;color:var(--text-3)">{{ q.created_at }}</span>
          <span class="oc-total">¥{{ Number(q.total || 0).toLocaleString() }}</span>
        </div>
      </div>
    </template>
    <div v-else class="empty-state">
      <h3>暂无药品报价单</h3>
      <p>点击上方"新建"开始</p>
    </div>

    <div class="section-head" style="margin-top:8px">
      <h3>药包材报价单</h3>
      <span class="link" @click="router.push('/packaging-quote')">新建</span>
    </div>
    <template v-if="pkgQuotations.length > 0">
      <div
        class="order-card"
        v-for="q in pkgQuotations.slice(0, 5)"
        :key="q.id"
        @click="router.push('/quote-preview/' + q.id)"
      >
        <div class="oc-top">
          <div>
            <div class="oc-id">{{ q.quote_no }}</div>
            <div class="oc-customer">{{ q.customer_name || '-' }}</div>
          </div>
          <span class="badge" :class="statusBadge(q.status)">{{ statusText(q.status) }}</span>
        </div>
        <div class="oc-items">{{ q.sample_name || '-' }}</div>
        <div class="oc-foot">
          <span style="font-size:12px;color:var(--text-3)">{{ q.created_at }}</span>
          <span class="oc-total">¥{{ Number(q.total || 0).toLocaleString() }}</span>
        </div>
      </div>
    </template>
    <div v-else class="empty-state">
      <h3>暂无药包材报价单</h3>
      <p>点击上方"新建"开始</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuotationsStore } from '../stores/quotations'
import { statsApi, drugItemsApi, packagingItemsApi, itemsApi } from '../api'
import { toast } from '../utils/toast'

const router = useRouter()
const quoteStore = useQuotationsStore()

const stats = ref({ drug_items: 0, packaging_items: 0, drug_quotes: 0, packaging_quotes: 0, total_quotes: 0, total_amount: 0 })

// Auto generate from text
const pasteText = ref('')
const matchedCount = ref(0)
const allDrugItems = ref([])
const allPkgItems = ref([])

// Preload items for matching
onMounted(async () => {
  try {
    const res = await statsApi.get()
    stats.value = res.data
  } catch {}
  quoteStore.loadQuotations()
  try {
    const { data } = await itemsApi.all('drug')
    allDrugItems.value = data.items || []
  } catch {}
  try {
    const { data } = await itemsApi.all('packaging')
    allPkgItems.value = data.items || []
  } catch {}
})

// Watch paste text to show match count
watch(pasteText, () => {
  if (!pasteText.value.trim()) { matchedCount.value = 0; return }
  const matched = matchItems(pasteText.value, 'drug')
  matchedCount.value = matched.length
})

function matchItems(text, type) {
  const items = type === 'drug' ? allDrugItems.value : allPkgItems.value
  // Split by any combination of: newline, comma, semicolon, pipe, tab, Chinese punctuation, space
  const tokens = text.split(/[\n,，;；|｜\t、\r]+/).map(l => l.trim()).filter(Boolean)
  const results = []
  for (const token of tokens) {
    // Try to detect "sample + item" format: last word is item name, rest is sample
    const words = token.split(/\s+/).filter(Boolean)
    // Strategy 1: treat entire token as a sample name, find ALL items for that sample
    const catMatched = items.filter(item => item.category.includes(token))
    if (catMatched.length > 0) {
      for (const m of catMatched) {
        if (!results.find(r => r.id === m.id)) results.push({ ...m })
      }
      continue
    }
    // Strategy 2: if multiple words, try each word as sample name or item name
    if (words.length > 1) {
      // First try: last word is item name, rest is sample
      const sampleKw = words.slice(0, -1).join('')
      const itemKw = words[words.length - 1]
      const matched = items.filter(item =>
        item.category.includes(sampleKw) && item.name.includes(itemKw)
      )
      if (matched.length > 0) {
        for (const m of matched) {
          if (!results.find(r => r.id === m.id)) results.push({ ...m })
        }
        continue
      }
      // Second try: any word matches sample or item
      for (const w of words) {
        const wMatched = items.filter(item =>
          item.category.includes(w) || item.name.includes(w)
        )
        for (const m of wMatched) {
          if (!results.find(r => r.id === m.id)) results.push({ ...m })
        }
      }
    }
  }
  return results
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    if (text) pasteText.value = text
    else toast('剪贴板为空')
  } catch {
    toast('无法读取剪贴板，请手动粘贴')
  }
}

async function onAutoGenerate(type) {
  const text = pasteText.value.trim()
  if (!text) { toast('请先输入或粘贴内容'); return }
  const matched = matchItems(text, type)
  if (matched.length === 0) { toast('未匹配到检测项目，请检查输入内容或切换报价类型'); return }

  const cart = matched.map(item => ({
    id: item.id, name: item.name, category: item.category,
    standard: item.standard, method: item.method,
    unit_price: item.unit_price, quantity: 1,
    cma: item.cma, cnas: item.cnas,
    cycle_days: item.cycle_days, description: item.description
  }))
  const cartSamples = [...new Set(cart.map(i => i.category))]
  const total = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const sampleName = cartSamples.join('、')

  try {
    const q = await quoteStore.createQuotationDirect({
      title: '智能报价单', customer_name: '智能报价单', contact_person: '',
      sample_name: sampleName, quotation_type: type,
      total_amount: total,
      items_json: cart.map(i => ({
        id: i.id, name: i.name, category: i.category,
        standard: i.standard, method: i.method,
        unit_price: i.unit_price, quantity: i.quantity,
        subtotal: i.unit_price * i.quantity,
        cma: i.cma, cnas: i.cnas,
        cycle_days: i.cycle_days, description: i.description
      }))
    })
    toast(`已匹配 ${matched.length} 项，报价单已生成`)
    pasteText.value = ''
    router.push('/quote-preview/' + q.id)
  } catch (e) {
    toast('生成失败: ' + (e.response?.data?.detail || e.message || ''))
  }
}

const drugQuotations = computed(() => quoteStore.quotations.filter(q => q.type === 'drug'))
const pkgQuotations = computed(() => quoteStore.quotations.filter(q => q.type === 'packaging'))

const userName = computed(() => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user.username || '管理员'
  } catch { return '管理员' }
})

const welcomeDate = computed(() => {
  const now = new Date()
  const h = now.getHours()
  const greeting = h < 12 ? '早上好' : h < 18 ? '下午好' : '晚上好'
  return `${greeting} · ${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
})

function statusText(s) {
  return { draft: '草稿', confirmed: '已确认', sent: '已发送' }[s] || s
}
function statusBadge(s) {
  return { draft: 'badge-gray', confirmed: 'badge-green', sent: 'badge-blue' }[s] || 'badge-gray'
}
</script>

<style scoped>
.welcome-banner {
  background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%);
  border-radius: var(--radius-lg);
  padding: 20px;
  color: #fff;
  position: relative;
  overflow: hidden;
  margin-bottom: 12px;
}
.wb-deco1 {
  position: absolute;
  right: -10px;
  top: -10px;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, .08);
  border-radius: 50%;
}
.wb-deco2 {
  position: absolute;
  right: 30px;
  bottom: -20px;
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, .05);
  border-radius: 50%;
}
.wb-date {
  font-size: 13px;
  opacity: .8;
}
.wb-user {
  font-size: 20px;
  font-weight: 800;
  margin-top: 2px;
}
.wb-sub {
  font-size: 12px;
  opacity: .7;
  margin-top: 4px;
}
</style>
