import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '首页', tab: 'home' }
  },
  {
    path: '/drug-items',
    name: 'DrugItems',
    component: () => import('../views/DrugItems.vue'),
    meta: { title: '药品报价表', tab: 'drug' }
  },
  {
    path: '/packaging-items',
    name: 'PackagingItems',
    component: () => import('../views/PackagingItems.vue'),
    meta: { title: '药包材报价表', tab: 'packaging' }
  },
  {
    path: '/drug-quote',
    name: 'DrugQuote',
    component: () => import('../views/DrugQuote.vue'),
    meta: { title: '药品报价单', tab: 'quote' }
  },
  {
    path: '/packaging-quote',
    name: 'PackagingQuote',
    component: () => import('../views/PackagingQuote.vue'),
    meta: { title: '药包材报价单', tab: 'packaging-quote' }
  },
  {
    path: '/quote-preview/:id',
    name: 'QuotePreview',
    component: () => import('../views/QuotePreview.vue'),
    meta: { title: '报价单预览' }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('../views/Orders.vue'),
    meta: { title: '报价单', tab: 'orders' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Auth guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (!to.meta.public && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
