import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { quotationsApi } from '../api'

function generateQuoteNo() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `QN-${y}${m}${d}-${rand}`
}

export const useQuotationsStore = defineStore('quotations', () => {
  const quotations = ref([])
  const quotationsLoaded = ref(false)

  // Cart state - keep in memory only
  const cartItems = ref([])
  const customerInfo = ref({
    customer_name: '',
    contact_person: '',
    sample_name: ''
  })

  const cartTotal = computed(() => {
    return cartItems.value.reduce((sum, item) => {
      return sum + (item.unit_price * item.quantity)
    }, 0)
  })

  const cartCount = computed(() => cartItems.value.length)

  // Load quotations from API
  async function loadQuotations(params = {}) {
    const { data } = await quotationsApi.list(params)
    quotations.value = data.items
    quotationsLoaded.value = true
    return data
  }

  // Cart operations
  function addToCart(item, quantity = 1) {
    const existing = cartItems.value.find(i => i.id === item.id)
    if (existing) {
      existing.quantity += quantity
    } else {
      cartItems.value.push({
        ...item,
        quantity,
        original_price: item.unit_price
      })
    }
  }

  function removeFromCart(itemId) {
    cartItems.value = cartItems.value.filter(i => i.id !== itemId)
  }

  function updateCartItemQuantity(itemId, quantity) {
    const item = cartItems.value.find(i => i.id === itemId)
    if (item) {
      item.quantity = Math.max(1, quantity)
    }
  }

  function updateCartItemPrice(itemId, price) {
    const item = cartItems.value.find(i => i.id === itemId)
    if (item) {
      item.unit_price = Math.max(0, price)
    }
  }

  function clearCart() {
    cartItems.value = []
    customerInfo.value = { customer_name: '', contact_person: '', sample_name: '' }
  }

  function setCustomerInfo(info) {
    customerInfo.value = { ...info }
  }

  // Quotation operations via API
  async function createQuotation(type = 'drug') {
    const quote_no = generateQuoteNo()
    const payload = {
      quote_no,
      title: customerInfo.value.customer_name || '报价单',
      customer_name: customerInfo.value.customer_name,
      contact_person: customerInfo.value.contact_person,
      sample_name: customerInfo.value.sample_name,
      quotation_type: type,
      total_amount: cartTotal.value,
      items_json: cartItems.value.map(item => ({
        id: item.id,
        name: item.name,
        standard: item.standard,
        method: item.method,
        unit_price: item.unit_price,
        quantity: item.quantity,
        subtotal: item.unit_price * item.quantity,
        cma: item.cma,
        cnas: item.cnas,
        cycle_days: item.cycle_days,
        description: item.description,
      })),
    }

    const { data } = await quotationsApi.create(payload)
    // Add to local list (map API response to local format)
    const quotation = {
      ...data,
      type: data.type,
      total: data.total,
      items: data.items,
      quote_no: data.quote_no,
      customer_name: data.customer_name,
      contact_person: data.contact_person,
      sample_name: data.sample_name,
      created_at: data.created_at,
      status: data.status,
    }
    quotations.value.unshift(quotation)
    clearCart()
    return quotation
  }

  // Create quotation from external payload (not from local cart)
  async function createQuotationDirect(payload) {
    const { data } = await quotationsApi.create(payload)
    const quotation = { ...data }
    quotations.value.unshift(quotation)
    return quotation
  }

  function getQuotation(id) {
    return quotations.value.find(q => q.id === Number(id))
  }

  async function getQuotationRemote(id) {
    const { data } = await quotationsApi.get({ item_id: id })
    return data
  }

  async function updateQuotationStatus(id, status) {
    await quotationsApi.update({ item_id: id, status })
    const q = quotations.value.find(q => q.id === Number(id))
    if (q) {
      q.status = status
    }
  }

  async function deleteQuotation(id) {
    await quotationsApi.delete({ item_id: id })
    quotations.value = quotations.value.filter(q => q.id !== Number(id))
  }

  const quotationCount = computed(() => quotations.value.length)
  const drugQuotations = computed(() => quotations.value.filter(q => q.type === 'drug'))
  const packagingQuotations = computed(() => quotations.value.filter(q => q.type === 'packaging'))

  return {
    quotations,
    cartItems,
    customerInfo,
    cartTotal,
    cartCount,
    quotationCount,
    drugQuotations,
    packagingQuotations,
    loadQuotations,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    updateCartItemPrice,
    clearCart,
    setCustomerInfo,
    createQuotation,
    createQuotationDirect,
    getQuotation,
    getQuotationRemote,
    updateQuotationStatus,
    deleteQuotation,
  }
})
