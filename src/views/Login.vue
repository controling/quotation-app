<template>
  <div class="login-page">
    <!-- Animated orbs -->
    <div class="login-orb orb1"></div>
    <div class="login-orb orb2"></div>

    <div class="login-inner">
      <!-- Brand -->
      <div class="login-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
        </div>
        <h1>检测报价系统</h1>
        <p>Drug Inspection Quotation</p>
      </div>

      <!-- Glass card -->
      <div class="login-card">
        <div class="lc-title">账号登录</div>

        <div class="lc-error" :class="{ show: errorMsg }">{{ errorMsg }}</div>

        <div class="l-form">
          <div class="lf-group">
            <label>用户名</label>
            <div class="lf-input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              <input
                type="text"
                v-model="username"
                placeholder="请输入用户名"
                autocomplete="username"
                @keydown.enter="doLogin"
              />
            </div>
          </div>

          <div class="lf-group">
            <label>密码</label>
            <div class="lf-input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input
                :type="showPwd ? 'text' : 'password'"
                v-model="password"
                placeholder="请输入密码"
                autocomplete="current-password"
                @keydown.enter="doLogin"
              />
              <div class="lf-pwd-btn" @click="showPwd = !showPwd">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
            </div>
          </div>

          <button class="btn-login" @click="doLogin" :disabled="loading">
            <span v-if="!loading">登录</span>
            <span v-else>登录中...</span>
            <svg v-if="!loading" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from '../utils/toast'
import { authApi } from '../api'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const showPwd = ref(false)
const errorMsg = ref('')

async function doLogin() {
  errorMsg.value = ''
  if (!username.value || !password.value) {
    errorMsg.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  try {
    const { data } = await authApi.login({ username: username.value, password: password.value })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    toast('登录成功')
    router.replace('/')
  } catch (err) {
    errorMsg.value = err.response?.data?.detail || '用户名或密码错误'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, #1a2b6a 0%, #0d1f5e 40%, #162070 100%);
  overflow: hidden;
}

/* Animated orbs */
.login-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: .3;
  animation: orbMove 10s ease-in-out infinite;
}
.orb1 {
  width: 280px;
  height: 280px;
  background: var(--primary);
  top: -60px;
  right: -60px;
}
.orb2 {
  width: 200px;
  height: 200px;
  background: var(--accent);
  bottom: -40px;
  left: -30px;
  animation-delay: -4s;
}
@keyframes orbMove {
  0%, 100% { transform: translate(0, 0) }
  50% { transform: translate(-15px, -20px) }
}

.login-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 28px;
  padding-top: var(--safe-top);
  position: relative;
  z-index: 1;
}

/* Brand */
.login-brand {
  margin-bottom: 36px;
}
.brand-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--primary), #818cf8);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  box-shadow: 0 8px 24px rgba(79, 110, 247, .4);
}
.brand-icon svg {
  width: 32px;
  height: 32px;
  fill: none;
  stroke: #fff;
  stroke-width: 1.8;
}
.login-brand h1 {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  letter-spacing: .3px;
}
.login-brand p {
  font-size: 12px;
  color: rgba(255, 255, 255, .45);
  margin-top: 4px;
}

/* Glass card */
.login-card {
  background: rgba(255, 255, 255, .07);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: var(--radius-lg);
  padding: 28px 24px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, .3);
}
.lc-title {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, .9);
  margin-bottom: 20px;
}

/* Error */
.lc-error {
  display: none;
  font-size: 13px;
  color: #fca5a5;
  background: rgba(239, 68, 68, .12);
  border: 1px solid rgba(239, 68, 68, .2);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  margin-bottom: 14px;
}
.lc-error.show { display: block; }

/* Form */
.lf-group { margin-bottom: 16px; }
.lf-group label {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, .6);
  margin-bottom: 6px;
  display: block;
}
.lf-input-wrap {
  position: relative;
}
.lf-input-wrap svg {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, .3);
  pointer-events: none;
}
.lf-input-wrap input {
  width: 100%;
  height: 48px;
  padding: 0 44px;
  background: rgba(255, 255, 255, .08);
  border: 1.5px solid rgba(255, 255, 255, .12);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 15px;
  transition: var(--trans);
  outline: none;
}
.lf-input-wrap input::placeholder { color: rgba(255, 255, 255, .28); }
.lf-input-wrap input:focus {
  border-color: var(--primary);
  background: rgba(79, 110, 247, .12);
  box-shadow: 0 0 0 3px rgba(79, 110, 247, .2);
}
.lf-pwd-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, .35);
  padding: 4px;
  cursor: pointer;
}

.login-tip {
  text-align: center;
  font-size: 11px;
  color: rgba(255, 255, 255, .3);
  margin-top: 16px;
}
</style>
