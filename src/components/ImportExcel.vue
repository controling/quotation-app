<template>
  <div class="import-excel">
    <van-uploader
      :after-read="onFileRead"
      accept=".xlsx,.xls"
      :max-count="1"
      :preview-image="false"
    >
      <van-button type="primary" icon="upgrade" size="small">
        {{ buttonText }}
      </van-button>
    </van-uploader>

    <div v-if="importing" class="import-loading">
      <van-loading size="20px" vertical>正在导入...</van-loading>
    </div>

    <div v-if="result" class="import-result">
      <van-tag :type="result.success ? 'success' : 'danger'" size="large">
        {{ result.message }}
      </van-tag>
    </div>
  </div>
</template>

<script setup>
import { toast as showToast } from '../utils/toast'
import { ref } from 'vue'
import { parseExcel } from '../utils/excel'

const props = defineProps({
  buttonText: { type: String, default: '从Excel导入' }
})

const emit = defineEmits(['imported'])

const importing = ref(false)
const result = ref(null)

async function onFileRead(file) {
  importing.value = true
  result.value = null

  try {
    const items = await parseExcel(file.file)
    if (items.length === 0) {
      result.value = { success: false, message: '未解析到有效数据' }
      showToast({ message: '未解析到有效数据' })
    } else {
      result.value = { success: true, message: `成功导入 ${items.length} 条数据` }
      showToast({ message: `成功导入 ${items.length} 条数据` })
      emit('imported', items)
    }
  } catch (err) {
    console.error('Import error:', err)
    result.value = { success: false, message: '导入失败: ' + err.message }
    showToast({ message: '导入失败' })
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.import-excel {
  display: inline-block;
}

.import-loading {
  margin-top: 8px;
}

.import-result {
  margin-top: 8px;
}
</style>
