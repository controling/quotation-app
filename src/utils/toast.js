// Simple toast that works reliably - no Vant dependency
let toastEl = null
let timer = null

function createToastEl() {
  if (!toastEl) {
    toastEl = document.createElement('div')
    toastEl.id = 'app-toast'
    toastEl.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.75); color: #fff; padding: 12px 24px;
      border-radius: 8px; font-size: 14px; z-index: 99999;
      max-width: 80%; text-align: center; word-break: break-all;
      pointer-events: none; opacity: 0; transition: opacity 0.2s;
      line-height: 1.5;
    `
    document.body.appendChild(toastEl)
  }
  return toastEl
}

export function toast(message, duration = 2000) {
  const opts = typeof message === 'string' ? { message, duration } : message
  const el = createToastEl()
  clearTimeout(timer)
  el.textContent = opts.message || ''
  el.style.opacity = '1'
  timer = setTimeout(() => {
    el.style.opacity = '0'
  }, opts.duration || duration)
}

export function toastSuccess(message) {
  toast('✓ ' + message)
}

export function toastFail(message) {
  toast('✗ ' + message)
}
