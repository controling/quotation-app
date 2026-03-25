import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { drugItemsApi } from '../api'

export const useDrugItemsStore = defineStore('drugItems', () => {
  const items = ref([])
  const loaded = ref(false)
  const loading = ref(false)
  const totalSamples = ref(0)

  const categories = computed(() => {
    const cats = [...new Set(items.value.map(i => i.category))]
    return cats.sort()
  })

  const totalCount = computed(() => items.value.length)

  async function loadAll() {
    if (loaded.value || loading.value) return
    loading.value = true
    try {
      const { data } = await drugItemsApi.list({ page_size: 20, page: 1 })
      totalSamples.value = data.total
      items.value = []
      for (const sample of (data.samples || [])) {
        items.value.push(...sample.items)
      }
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function loadPage(page) {
    const { data } = await drugItemsApi.list({ page_size: 20, page })
    totalSamples.value = data.total
    // Append new items, skip duplicates
    const existingIds = new Set(items.value.map(i => i.id))
    for (const sample of (data.samples || [])) {
      for (const item of sample.items) {
        if (!existingIds.has(item.id)) {
          items.value.push(item)
          existingIds.add(item.id)
        }
      }
    }
    return data
  }

  function getById(id) {
    return items.value.find(i => i.id === id)
  }

  function search(query, category = '') {
    let result = items.value
    if (category) {
      result = result.filter(i => i.category === category)
    }
    if (query) {
      const q = query.toLowerCase()
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.standard || '').toLowerCase().includes(q)
      )
    }
    return result
  }

  return {
    items,
    categories,
    totalCount,
    totalSamples,
    loaded,
    loading,
    loadAll,
    loadPage,
    getById,
    search,
  }
})
