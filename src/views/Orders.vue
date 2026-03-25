<template>
  <div class="page-content">
    <!-- Segment control -->
    <div class="seg-control">
      <div class="seg-item" :class="{ active: orderType === 'drug' }" @click="orderType = 'drug'">药品报价单</div>
      <div class="seg-item" :class="{ active: orderType === 'packaging' }" @click="orderType = 'packaging'">药包材报价单</div>
    </div>

    <!-- Loading -->
    <van-loading v-if="loading" vertical style="padding: 40px 0">加载中...</van-loading>

    <!-- Order list -->
    <template v-else>
      <div v-if="orders.length === 0">
        <van-empty description="暂无报价单" :image-size="80">
          <van-button type="primary" size="small" @click="$router.push(orderType === 'drug' ? '/drug-quote' : '/packaging-quote')">
            新建报价单
          </van-button>
        </van-empty>
      </div>

      <div v-for="o in orders" :key="o.id" class="order-card" @click="$router.push('/quote-preview/' + o.id)">
        <div class="oc-top">
          <div>
            <div class="oc-id">{{ o.quote_no }}</div>
            <div class="oc-customer">{{ o.customer_name || '-' }}</div>
          </div>
          <span class="badge" :class="statusBadgeClass(o.status)">{{ statusText(o.status) }}</span>
        </div>
        <div class="oc-items">{{ o.sample_name || '-' }}</div>
        <div class="oc-foot">
          <span class="oc-meta">{{ o.created_at }} · {{ o.items?.length || 0 }}项</span>
          <span class="oc-total">¥{{ Number(o.total).toFixed(2) }}</span>
        </div>
      </div>

      <!-- Load more -->
      <div class="load-more" v-if="hasMore">
        <van-button plain size="small" @click="loadMore">加载更多</van-button>
      </div>
    </template>

    <!-- Floating Action Button -->
    <div class="fab" @click="$router.push(orderType === 'drug' ? '/drug-quote' : '/packaging-quote')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="22" height="22"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useQuotationsStore } from '../stores/quotations'

const store = useQuotationsStore()
const orderType = ref('drug')
const loading = ref(true)
const page = ref(1)
const hasMore = ref(false)

const orders = computed(() => {
  return store.quotations.filter(q => q.type === orderType.value)
})

async function loadOrders() {
  loading.value = true
  page.value = 1
  try {
    await store.loadQuotations({ type: orderType.value, page: 1, page_size: 20 })
    hasMore.value = store.quotations.filter(q => q.type === orderType.value).length >= 20
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

async function loadMore() {
  page.value++
  await store.loadQuotations({ type: orderType.value, page: page.value, page_size: 20 })
  hasMore.value = false
}

watch(orderType, () => loadOrders())
onMounted(() => loadOrders())

function statusText(s) { return { draft: '草稿', confirmed: '已确认', sent: '已发送' }[s] || s }
function statusBadgeClass(s) { return { draft: 'badge-gray', confirmed: 'badge-green', sent: 'badge-blue' }[s] || 'badge-gray' }
</script>

<style scoped>
.order-card {
  background: var(--surface, #fff);
  border-radius: var(--radius, 14px);
  border: 1px solid var(--border, #ebedf3);
  margin: 0 12px 10px;
  overflow: hidden;
  box-shadow: var(--shadow-sm, 0 1px 4px rgba(0,0,0,.06));
}
.order-card:active { transform: scale(.99); }

.oc-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px 14px;
}
.oc-id { font-size: 11px; color: var(--text-3, #8895b3); font-family: monospace; }
.oc-customer { font-size: 14px; font-weight: 700; margin-top: 3px; }

.oc-items {
  font-size: 12px;
  color: var(--text-3, #8895b3);
  margin-top: 4px;
  padding: 0 14px 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.oc-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-top: 1px solid var(--border, #ebedf3);
  background: #fafbfd;
}
.oc-meta { font-size: 12px; color: var(--text-3, #8895b3); }
.oc-total { font-size: 16px; font-weight: 800; color: var(--primary, #4f6ef7); }

.load-more { padding: 16px; display: flex; justify-content: center; }

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
.badge-green { background: #d1fae5; color: #065f46; }
.badge-blue { background: #dbeafe; color: #1e40af; }
.badge-gray { background: #f3f4f6; color: #374151; }

.fab {
  position: fixed;
  right: 20px;
  bottom: calc(var(--tab-h, 56px) + 20px);
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary, #4f6ef7), #6366f1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(79,110,247,.4);
  z-index: 100;
  cursor: pointer;
  transition: transform .15s, box-shadow .15s;
}
.fab:active {
  transform: scale(.92);
  box-shadow: 0 2px 8px rgba(79,110,247,.3);
}
</style>
