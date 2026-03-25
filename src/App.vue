<template>
  <div class="app-shell">
    <!-- Status Bar (only shown when logged in) -->
    <div class="app-header" v-if="!isLoginPage">
      <div class="app-header-inner">
        <div class="app-header-left">
          <div class="brand-icon-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
          </div>
          <span class="app-header-title">{{ pageTitle }}</span>
        </div>
        <div class="app-header-right">
          <div class="header-btn" @click="onLogout" title="退出">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Router View -->
    <router-view v-slot="{ Component, route }">
      <keep-alive include="DrugQuote,PackagingQuote">
        <component :is="Component" :key="route.path" />
      </keep-alive>
    </router-view>

    <!-- Custom Tab Bar -->
    <div class="tab-bar" v-if="!isLoginPage">
      <div
        v-for="tab in tabs"
        :key="tab.path"
        class="tab-item"
        :class="{ active: isActiveTab(tab.path) }"
        @click="goTab(tab.path)"
      >
        <span class="tab-indicator" v-if="isActiveTab(tab.path)"></span>
        <span class="ti-icon" v-html="tab.icon"></span>
        <span class="ti-label">{{ tab.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from './utils/toast'

const route = useRoute()
const router = useRouter()

const isLoginPage = computed(() => route.path === '/login')

const pageTitle = computed(() => {
  if (route.meta?.title) return route.meta.title
  return '检测报价管理系统'
})

const tabs = [
  {
    path: '/',
    label: '首页',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
  },
  {
    path: '/drug-items',
    label: '药品',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9l-6-6z"/><path d="M9 3v6h6"/></svg>'
  },
  {
    path: '/packaging-items',
    label: '包材',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>'
  },
  {
    path: '/orders',
    label: '报价单',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>'
  },
  {
    path: '/packaging-quote',
    label: '我的',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
  }
]

function isActiveTab(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function goTab(path) {
  router.replace(path)
}

function onLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  toast('已退出登录')
  router.replace('/login')
}
</script>

<style scoped>
.app-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

/* Header */
.app-header {
  height: var(--header-h);
  flex-shrink: 0;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}
.app-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 44px;
  padding-top: var(--safe-top);
}
.app-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.brand-icon-sm {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, var(--primary), #818cf8);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.brand-icon-sm svg {
  width: 15px;
  height: 15px;
}
.app-header-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-1);
}
.app-header-right {
  display: flex;
  gap: 8px;
  align-items: center;
}
.header-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-2);
  transition: var(--trans);
  cursor: pointer;
}
.header-btn:active {
  background: var(--bg);
}

/* Tab Bar */
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--tab-h);
  padding-bottom: var(--safe-bottom);
  background: rgba(255, 255, 255, .96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: flex-start;
  z-index: 200;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, .04);
}
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 0;
  cursor: pointer;
  transition: all var(--trans);
  color: var(--text-3);
  position: relative;
}
.tab-item:active {
  transform: scale(.95);
}
.tab-item.active {
  color: var(--primary);
}
.tab-indicator {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 3px;
  background: var(--primary);
  border-radius: 0 0 3px 3px;
}
.ti-icon {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
}
.ti-icon :deep(svg) {
  width: 22px;
  height: 22px;
}
.ti-label {
  font-size: 10px;
  font-weight: 600;
}
</style>
