<template>
  <div class="item-table">
    <!-- Search -->
    <div class="m-search" style="padding:0 0 8px">
      <div class="m-search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="搜索样品名称、检测项目..." v-model="searchText" @input="onSearch" />
      </div>
    </div>

    <!-- Stats -->
    <div style="font-size:12px;color:var(--text-3);padding:0 0 8px">
      共 {{ allGroups.length }} 个样品, {{ totalItemCount }} 项检测
    </div>

    <!-- Grouped list -->
    <div v-for="group in allGroups" :key="group.sample" class="item-card">
      <div class="ic-head" style="cursor:pointer" @click="toggleGroup(group.sample)">
        <div class="ic-info">
          <div class="ic-name">{{ group.sample }}</div>
          <div class="ic-meta">
            <span class="badge badge-blue">{{ group.items.length }}项</span>
          </div>
        </div>
        <div class="ic-price">¥{{ group.totalPrice.toFixed(2) }}</div>
      </div>
      <div class="ic-body" v-if="expandedGroup === group.sample" style="flex-direction:column;gap:6px;padding:0 14px 12px">
        <div
          v-for="item in group.items"
          :key="item.id"
          style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f5f5f7;width:100%"
        >
          <div style="flex:1;min-width:0;cursor:pointer" @click="$emit('edit', item)">
            <div style="display:flex;align-items:center;gap:4px">
              <span style="font-size:14px;font-weight:500">{{ item.name }}</span>
              <span class="badge badge-green" v-if="item.cma" style="font-size:10px;padding:1px 5px">CMA</span>
              <span class="badge badge-blue" v-if="item.cnas" style="font-size:10px;padding:1px 5px">CNAS</span>
            </div>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">{{ item.method || '-' }} · {{ item.cycle_days }}天</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
            <span class="price">¥{{ item.unit_price }}</span>
            <button class="btn btn-sm btn-ghost" @click.stop="$emit('edit', item)">编辑</button>
            <button class="btn btn-sm" style="background:var(--danger-light);color:var(--danger);border:none" @click.stop="$emit('delete', item)">删</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="allGroups.length === 0 && store.loaded" class="empty-state">
      <h3>暂无数据</h3>
      <p>尝试调整筛选条件</p>
    </div>

    <!-- Load more -->
    <div style="text-align:center;padding:16px 0" v-if="hasMore">
      <button class="btn btn-ghost" :disabled="store.loading" @click="loadMore">
        {{ store.loading ? '加载中...' : '加载更多' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  categories: { type: Array, default: () => [] },
  store: { type: Object, required: true }
})

defineEmits(['export', 'edit', 'delete'])

const searchText = ref('')
const expandedGroup = ref('')
const loadedPages = ref(1)

const filteredItems = computed(() => {
  return props.store.search(searchText.value, '')
})

const allGroups = computed(() => {
  const map = {}
  filteredItems.value.forEach(item => {
    const sample = item.category || '未分类'
    if (!map[sample]) map[sample] = { sample, items: [], totalPrice: 0 }
    map[sample].items.push(item)
    map[sample].totalPrice += Number(item.unit_price) || 0
  })
  return Object.values(map).sort((a, b) => a.sample.localeCompare(b.sample, 'zh'))
})

const totalItemCount = computed(() => filteredItems.value.length)

const hasMore = computed(() => {
  return props.store.loaded && props.store.totalSamples > 0 && allGroups.value.length < props.store.totalSamples
})

async function loadMore() {
  loadedPages.value++
  await props.store.loadPage(loadedPages.value)
}

function toggleGroup(sample) {
  expandedGroup.value = expandedGroup.value === sample ? '' : sample
}

function onSearch() {
  expandedGroup.value = ''
}
</script>

<style scoped>
.item-table { padding-bottom: 20px; }
</style>
