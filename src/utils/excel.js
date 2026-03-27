import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'

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
 * 导出报价单 - 委托检测报价表模板
 */
export async function exportQuotation(quotation) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Sheet')

  // Group items by category (sample name)
  const grouped = {}
  quotation.items.forEach(item => {
    const sample = item.category || item.sample_name || '未知样品'
    if (!grouped[sample]) grouped[sample] = []
    grouped[sample].push(item)
  })

  // Check if any discounts exist
  const hasAnyDiscount = quotation.items.some(i => (i.discount ?? 1) < 1) ||
    Object.values(quotation.sample_discounts || {}).some(d => d < 1) ||
    (quotation.overall_discount ?? 1) < 1

  // Calculate column count based on whether discounts exist
  const hasDiscount = hasAnyDiscount
  const baseColCount = 7  // 序号, 品名, 项目, 方法, 协议价, 周期, 备注
  const extraColCount = hasDiscount ? 2 : 0  // 折扣, 小计
  const totalColCount = baseColCount + extraColCount

  // Set column widths (matching template)
  ws.getColumn(1).width = 10.63  // 序号
  ws.getColumn(2).width = 22.63  // 品名
  ws.getColumn(3).width = 28.0   // 检测项目
  ws.getColumn(4).width = 23.25  // 检测方法
  ws.getColumn(5).width = 15.63  // 协议价
  ws.getColumn(6).width = 10.63  // 周期
  if (hasDiscount) {
    ws.getColumn(7).width = 10.0   // 折扣
    ws.getColumn(8).width = 15.63  // 小计
    ws.getColumn(9).width = 10.63  // 周期
    ws.getColumn(10).width = 16.5  // 资质
    ws.getColumn(11).width = 33.13 // 备注
  } else {
    ws.getColumn(7).width = 16.5   // 资质
    ws.getColumn(8).width = 33.13  // 备注
  }

  // Row 1: Title
  ws.addRow(['委托检测报价表'])
  ws.getRow(1).height = 79
  const titleEndCol = hasDiscount ? 'K' : 'H'
  ws.mergeCells(`A1:${titleEndCol}1`)
  const titleCell = ws.getCell('A1')
  titleCell.font = { name: '宋体', size: 28, bold: true }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

  // Row 2: Headers
  const headers = hasDiscount
    ? ['序号', '品名', '检测项目', '检测方法', '协议价（元）', '折扣', '小计（元）', '周期（工作日）', '资质', '备注']
    : ['序号', '品名', '检测项目', '检测方法', '协议价（元）', '周期（工作日）', '资质', '备注']
  ws.addRow(headers)
  ws.getRow(2).height = 31
  for (let c = 1; c <= totalColCount; c++) {
    const cell = ws.getCell(2, c)
    cell.font = { name: '宋体', size: 11 }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } }
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } }
  }

  // Data rows
  const overallDiscount = quotation.overall_discount ?? 1
  const sampleDiscounts = quotation.sample_discounts || {}
  let seqNo = 0
  for (const [sampleName, items] of Object.entries(grouped)) {
    const sampleStartRow = ws.rowCount + 1
    const sampleDisc = sampleDiscounts[sampleName] ?? 1
    items.forEach((item, idx) => {
      const qual = [item.cma ? 'CMA' : '', item.cnas ? 'CNAS' : ''].filter(Boolean).join(', ') || '-'
      const disc = item.discount ?? 1
      const lineTotal = item.unit_price * (item.quantity || 1) * disc

      if (hasDiscount) {
        ws.addRow([
          idx === 0 ? ++seqNo : null,
          idx === 0 ? sampleName : null,
          item.name,
          item.method || '',
          item.unit_price,
          disc < 1 ? `${(disc * 10).toFixed(1)}折` : '-',
          lineTotal,
          item.cycle_days || '-',
          qual,
          item.description || ''
        ])
      } else {
        ws.addRow([
          idx === 0 ? ++seqNo : null,
          idx === 0 ? sampleName : null,
          item.name,
          item.method || '',
          item.unit_price,
          item.cycle_days || '-',
          qual,
          item.description || ''
        ])
      }

      const row = ws.getRow(ws.rowCount)
      row.height = 25
      for (let c = 1; c <= totalColCount; c++) {
        const cell = ws.getCell(ws.rowCount, c)
        cell.font = { name: '宋体', size: 11 }
        cell.alignment = { vertical: 'middle' }
        if (c === 1 || c === 6 || c === 7 || (hasDiscount && (c === 8 || c === 9))) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }
        const priceCol = hasDiscount ? 5 : 5
        const totalCol = hasDiscount ? 7 : -1
        if (c === priceCol) {
          cell.numFmt = '#,##0.00'
        }
        if (c === totalCol) {
          cell.numFmt = '#,##0.00'
          cell.alignment = { horizontal: 'right', vertical: 'middle' }
        }
      }
    })
    // Merge 序号 and 品名列 for multi-item samples
    if (items.length > 1) {
      ws.mergeCells(sampleStartRow, 1, sampleStartRow + items.length - 1, 1)
      ws.mergeCells(sampleStartRow, 2, sampleStartRow + items.length - 1, 2)
      ws.getCell(sampleStartRow, 1).alignment = { horizontal: 'center', vertical: 'middle' }
      ws.getCell(sampleStartRow, 2).alignment = { horizontal: 'center', vertical: 'middle' }
    }
    // Sample subtotal row (only if has discount)
    if (hasDiscount) {
      const itemsSubtotal = items.reduce((s, i) => s + (i.unit_price * (i.quantity || 1) * (i.discount ?? 1)), 0)
      const sampleFinal = itemsSubtotal * (sampleDisc > 0 && sampleDisc <= 1 ? sampleDisc : 1)
      const row = [null, null]
      row.push(sampleDisc < 1 ? `${sampleName} 小计 (${(sampleDisc * 10).toFixed(1)}折)` : `${sampleName} 小计`)
      row.push(null, null, null, null)  // cols 4-7 (method, price, discount, subtotal)
      row.push(sampleFinal)
      for (let c = 8; c <= totalColCount; c++) row.push(null)
      ws.addRow(row)

      const subRow = ws.getRow(ws.rowCount)
      subRow.height = 22
      ws.getCell(ws.rowCount, 3).font = { name: '宋体', size: 10, bold: true, color: { argb: 'FF333333' } }
      ws.getCell(ws.rowCount, 7).font = { name: '宋体', size: 10, bold: true }
      ws.getCell(ws.rowCount, 7).numFmt = '#,##0.00'
      ws.getCell(ws.rowCount, 7).alignment = { horizontal: 'right', vertical: 'middle' }
    }
  }

  // Total rows
  ws.addRow([])
  // Subtotal before overall discount
  let grandSubtotal = 0
  for (const [sampleName, items] of Object.entries(grouped)) {
    const sd = sampleDiscounts[sampleName] ?? 1
    const itemsSub = items.reduce((s, i) => s + (i.unit_price * (i.quantity || 1) * (i.discount ?? 1)), 0)
    grandSubtotal += itemsSub * (sd > 0 && sd <= 1 ? sd : 1)
  }

  const totalCol = hasDiscount ? 7 : 5  // 折扣列或最后一列（资历/备注前）

  if (overallDiscount < 1) {
    const row = [null, null, '折扣前合计']
    for (let c = 4; c <= totalCol; c++) row.push(null)
    for (let c = totalCol + 1; c <= totalColCount; c++) row.push(null)
    ws.addRow(row)
    ws.mergeCells(ws.rowCount, 1, ws.rowCount, totalCol - 1)
    ws.getCell(ws.rowCount, 1).alignment = { horizontal: 'right', vertical: 'middle' }
    ws.getCell(ws.rowCount, totalCol).value = grandSubtotal
    ws.getCell(ws.rowCount, totalCol).font = { name: '宋体', size: 11 }
    ws.getCell(ws.rowCount, totalCol).numFmt = '#,##0.00'
    ws.getCell(ws.rowCount, totalCol).alignment = { horizontal: 'right', vertical: 'middle' }
  }

  // Final total row
  const row = [null, null, overallDiscount < 1 ? `合计金额（总折扣${(overallDiscount * 10).toFixed(1)}折）` : '合计金额']
  for (let c = 4; c <= totalCol; c++) row.push(null)
  for (let c = totalCol + 1; c <= totalColCount; c++) row.push(null)
  ws.addRow(row)
  ws.mergeCells(ws.rowCount, 1, ws.rowCount, totalCol - 1)
  ws.getCell(ws.rowCount, 1).font = { name: '宋体', size: 14, bold: true }
  ws.getCell(ws.rowCount, 1).alignment = { horizontal: 'right', vertical: 'middle' }
  ws.getCell(ws.rowCount, totalCol).value = grandSubtotal * overallDiscount
  ws.getCell(ws.rowCount, totalCol).font = { name: '宋体', size: 14, bold: true, color: { argb: 'FFD32F2F' } }
  ws.getCell(ws.rowCount, totalCol).numFmt = '¥#,##0.00'
  ws.getCell(ws.rowCount, totalCol).alignment = { horizontal: 'right', vertical: 'middle' }
  ws.getRow(ws.rowCount).height = 32

  // Save
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${quotation.quote_no}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
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
