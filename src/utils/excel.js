import * as XLSX from 'xlsx'

/**
 * 解析 Excel 文件为项目数组
 */
export function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length < 2) { resolve([]); return }

        const headers = jsonData[0]
        const items = []
        const headerMap = {
          '分类': 'category', '类别': 'category', '样品名称': 'category',
          '项目名': 'name', '项目名称': 'name', '项目': 'name', '名称': 'name', '参数名称': 'name',
          '标准': 'standard', '方法': 'method', '检测方法': 'method',
          '单价': 'unit_price', '价格': 'unit_price', '协议价': 'unit_price', '协议价（元）': 'unit_price',
          'CMA': 'cma', 'CMA资质': 'cma', 'CNAS': 'cnas',
          '周期': 'cycle_days', '周期(天)': 'cycle_days', '检测周期': 'cycle_days', '检测周期（工作日）': 'cycle_days',
          '备注': 'description'
        }

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (!row || row.length === 0) continue
          const item = { id: Date.now() + i, category: '', name: '', standard: '', method: '', unit_price: 0, cma: 0, cnas: 0, cycle_days: 5, description: '' }
          headers.forEach((header, idx) => {
            const field = headerMap[header]
            if (field && row[idx] !== undefined) {
              if (field === 'unit_price' || field === 'cycle_days') {
                item[field] = Number(row[idx]) || 0
              } else if (field === 'cma' || field === 'cnas') {
                const val = row[idx]
                item[field] = val === 1 || val === '1' || val === '是' || val === 'Y' || (typeof val === 'string' && val.includes('CMA')) ? 1 : 0
              } else {
                item[field] = String(row[idx] || '')
              }
            }
          })
          if (item.name) items.push(item)
        }
        resolve(items)
      } catch (err) { reject(err) }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 导出报价单 - 委托检测报价表模板（与益生报价模板一致）
 */
export function exportQuotation(quotation) {
  const wb = XLSX.utils.book_new()

  // Group items by category (sample name)
  const grouped = {}
  quotation.items.forEach(item => {
    const sample = item.category || item.sample_name || '未知样品'
    if (!grouped[sample]) grouped[sample] = []
    grouped[sample].push(item)
  })

  // Build rows
  // Row 0 (index 0): Title
  // Row 1 (index 1): Headers
  // Row 2+ (index 2+): Data
  const headers = ['序号', '品名', '检测项目', '检测方法', '协议价（元）', '周期（工作日）', '资质', '备注']
  const data = []
  const merges = []

  // Title row
  const titleRow = ['委托检测报价表']
  data.push(titleRow)

  // Header row
  data.push(headers)

  // Data rows
  let seqNo = 0
  let dataStartRow = 2 // 0-indexed row where data starts

  for (const [sampleName, items] of Object.entries(grouped)) {
    const sampleStartRow = dataStartRow
    items.forEach((item, idx) => {
      const qual = [item.cma ? 'CMA' : '', item.cnas ? 'CNAS' : ''].filter(Boolean).join(', ') || '-'
      data.push([
        idx === 0 ? ++seqNo : null,
        idx === 0 ? sampleName : null,
        item.name,
        item.method || '',
        item.unit_price,
        item.cycle_days || '-',
        qual,
        item.description || ''
      ])
      dataStartRow++
    })
    // Merge 序号 and 品名 cells for multi-item samples
    if (items.length > 1) {
      // 序号 column (A)
      merges.push({ s: { r: sampleStartRow, c: 0 }, e: { r: sampleStartRow + items.length - 1, c: 0 } })
      // 品名列 (B)
      merges.push({ s: { r: sampleStartRow, c: 1 }, e: { r: sampleStartRow + items.length - 1, c: 1 } })
    }
  }

  // Title merge: A1:H1 (row 0, col 0 to col 7)
  merges.unshift({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } })

  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!merges'] = merges

  // Column widths matching template
  ws['!cols'] = [
    { wch: 10.63 },  // A 序号
    { wch: 22.63 },  // B 品名
    { wch: 28.0 },   // C 检测项目
    { wch: 23.25 },  // D 检测方法
    { wch: 15.63 },  // E 协议价
    { wch: 10.63 },  // F 周期
    { wch: 16.5 },   // G 资质
    { wch: 33.13 },  // H 备注
  ]

  // Row heights
  const totalRows = data.length
  ws['!rows'] = [{ hpt: 79 }] // Title row height
  for (let i = 1; i < totalRows; i++) {
    ws['!rows'][i] = { hpt: 31 }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Sheet2')
  XLSX.writeFile(wb, `${quotation.quote_no}.xlsx`)
}

/**
 * 导出项目列表
 */
export function exportItems(items, filename = '检测项目列表') {
  const wb = XLSX.utils.book_new()
  const headers = ['序号', '样品名称', '检测项目', '检测标准', '检测方法', '单价(元)', 'CMA', 'CNAS', '周期(天)', '备注']
  const data = items.map((item, i) => [
    i + 1, item.category, item.name, item.standard, item.method,
    item.unit_price, item.cma ? '是' : '否', item.cnas ? '是' : '否',
    item.cycle_days, item.description
  ])
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
  ws['!cols'] = [{ wch: 6 }, { wch: 20 }, { wch: 25 }, { wch: 35 }, { wch: 20 }, { wch: 10 }, { wch: 6 }, { wch: 6 }, { wch: 10 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, ws, '检测项目')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}
