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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuotationsStore } from '../stores/quotations'
import { statsApi } from '../api'

const router = useRouter()
const quoteStore = useQuotationsStore()

const stats = ref({ drug_items: 0, packaging_items: 0, drug_quotes: 0, packaging_quotes: 0, total_quotes: 0, total_amount: 0 })

onMounted(async () => {
  try {
    const res = await statsApi.get()
    stats.value = res.data
  } catch {}
  quoteStore.loadQuotations()
})

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
