/**
 * localStorage 封装
 */

export function getStorage(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch {
    return defaultValue
  }
}

export function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Storage save error:', e)
  }
}

export function removeStorage(key) {
  localStorage.removeItem(key)
}

export function clearStorage() {
  localStorage.clear()
}
