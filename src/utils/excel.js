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

  const overallDiscount = quotation.overall_discount ?? 1
  const sampleDiscounts = quotation.sample_discounts || {}

  // Check if any item-level discounts exist
  const hasItemDiscount = quotation.items.some(i => (i.discount ?? 1) < 1)
  // Check if any sample-level discounts exist
  const hasSampleDiscount = Object.values(sampleDiscounts).some(d => d < 1)
  // Check if total has discount
  const hasTotalDiscount = overallDiscount < 1
  // Whether to show discount columns (only when items have individual discounts)
  const showDiscCol = hasItemDiscount

  // Column definitions
  // No discount: 序号(1) | 品名(2) | 检测项目(3) | 检测方法(4) | 协议价(5) | 周期(6) | 资质(7) | 备注(8)
  // With discount: 序号(1) | 品名(2) | 检测项目(3) | 检测方法(4) | 协议价(5) | 折扣(6) | 小计(7) | 周期(8) | 资质(9) | 备注(10)
  const totalColCount = showDiscCol ? 10 : 8

  // Set column widths
  if (showDiscCol) {
    ws.getColumn(1).width = 10.63  // 序号
    ws.getColumn(2).width = 22.63  // 品名
    ws.getColumn(3).width = 28.0   // 检测项目
    ws.getColumn(4).width = 23.25  // 检测方法
    ws.getColumn(5).width = 15.63  // 协议价
    ws.getColumn(6).width = 10.0   // 折扣
    ws.getColumn(7).width = 15.63  // 小计
    ws.getColumn(8).width = 10.63  // 周期
    ws.getColumn(9).width = 16.5   // 资质
    ws.getColumn(10).width = 33.13 // 备注
  } else {
    ws.getColumn(1).width = 10.63  // 序号
    ws.getColumn(2).width = 22.63  // 品名
    ws.getColumn(3).width = 28.0   // 检测项目
    ws.getColumn(4).width = 23.25  // 检测方法
    ws.getColumn(5).width = 15.63  // 协议价
    ws.getColumn(6).width = 10.63  // 周期
    ws.getColumn(7).width = 16.5   // 资质
    ws.getColumn(8).width = 33.13  // 备注
  }

  const lastCol = String.fromCharCode(64 + totalColCount) // e.g. 'H' or 'J'

  // Row 1: Title (v2)
  ws.addRow(['委托检测报价表'])
  ws.getRow(1).height = 79
  ws.mergeCells(`A1:${lastCol}1`)
  const titleCell = ws.getCell('A1')
  titleCell.font = { name: '宋体', size: 28, bold: true }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

  // Row 2: Headers
  const headers = showDiscCol
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

  // Price / total column indices
  const priceCol = 5
  const discCol = showDiscCol ? 6 : -1
  const totalCol = showDiscCol ? 7 : -1
  const cycleCol = showDiscCol ? 8 : 6
  const qualCol = showDiscCol ? 9 : 7
  const noteCol = showDiscCol ? 10 : 8

  // Data rows
  let seqNo = 0
  let grandSubtotal = 0
  const sampleSubtotals = {} // track each sample's subtotal for summary

  for (const [sampleName, items] of Object.entries(grouped)) {
    const sampleStartRow = ws.rowCount + 1
    const sampleDisc = sampleDiscounts[sampleName] ?? 1

    // Calculate sample subtotal
    const itemsSubtotal = items.reduce((s, i) => {
      const disc = showDiscCol ? (i.discount ?? 1) : 1
      return s + (i.unit_price * (i.quantity || 1) * disc)
    }, 0)
    const sampleFinal = itemsSubtotal * (sampleDisc > 0 && sampleDisc <= 1 ? sampleDisc : 1)
    sampleSubtotals[sampleName] = sampleFinal
    grandSubtotal += sampleFinal

    items.forEach((item, idx) => {
      const qual = [item.cma ? 'CMA' : '', item.cnas ? 'CNAS' : ''].filter(Boolean).join(', ') || '-'
      const disc = item.discount ?? 1
      const lineTotal = item.unit_price * (item.quantity || 1) * disc

      if (showDiscCol) {
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
        if (c === 1 || c === cycleCol || c === qualCol) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }
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

    // Sample subtotal row - only show when there's discount
    if (showDiscCol && hasSampleDiscount && sampleDisc < 1) {
      const subLabel = `${sampleName} 小计 (${(sampleDisc * 10).toFixed(1)}折)`
      const row = [null, null, subLabel, null, null, null, sampleFinal]
      for (let c = 8; c <= totalColCount; c++) row.push(null)
      ws.addRow(row)
      ws.mergeCells(ws.rowCount, 2, ws.rowCount, 5)
      ws.getCell(ws.rowCount, 2).font = { name: '宋体', size: 10, bold: true, color: { argb: 'FF333333' } }
      ws.getCell(ws.rowCount, 2).alignment = { horizontal: 'right', vertical: 'middle' }
      ws.getCell(ws.rowCount, 7).font = { name: '宋体', size: 10, bold: true }
      ws.getCell(ws.rowCount, 7).numFmt = '#,##0.00'
      ws.getCell(ws.rowCount, 7).alignment = { horizontal: 'right', vertical: 'middle' }
      ws.getRow(ws.rowCount).height = 22
    }
  }

  // Total rows
  const labelCol = showDiscCol ? 7 : 5
  ws.addRow([])

  // Column for label text (right before the amount column)
  const lblCol = labelCol - 1

  // If overall discount, show pre-discount total
  if (hasTotalDiscount) {
    const rowData = new Array(totalColCount).fill(null)
    ws.addRow(rowData)
    const r = ws.getRow(ws.rowCount)
    r.height = 22
    ws.getCell(ws.rowCount, lblCol).value = '折扣前合计'
    ws.getCell(ws.rowCount, lblCol).font = { name: '宋体', size: 11 }
    ws.getCell(ws.rowCount, lblCol).alignment = { horizontal: 'right', vertical: 'middle' }
    ws.getCell(ws.rowCount, labelCol).value = grandSubtotal
    ws.getCell(ws.rowCount, labelCol).font = { name: '宋体', size: 11 }
    ws.getCell(ws.rowCount, labelCol).numFmt = '#,##0.00'
    ws.getCell(ws.rowCount, labelCol).alignment = { horizontal: 'right', vertical: 'middle' }
  }

  // Final total row - use column 1 for label, no merge
  const finalTotal = grandSubtotal * (hasTotalDiscount ? overallDiscount : 1)
  const totalLabel = hasTotalDiscount ? `合计金额（总折扣${(overallDiscount * 10).toFixed(1)}折）` : '合计金额'

  const rowData = new Array(totalColCount).fill(null)
  ws.addRow(rowData)
  const tr = ws.getRow(ws.rowCount)
  tr.height = 32

  ws.getCell(ws.rowCount, lblCol).value = totalLabel
  ws.getCell(ws.rowCount, lblCol).font = { name: '宋体', size: 14, bold: true }
  ws.getCell(ws.rowCount, lblCol).alignment = { horizontal: 'right', vertical: 'middle' }
  ws.getCell(ws.rowCount, labelCol).value = finalTotal
  ws.getCell(ws.rowCount, labelCol).font = { name: '宋体', size: 14, bold: true, color: { argb: 'FFD32F2F' } }
  ws.getCell(ws.rowCount, labelCol).numFmt = '¥#,##0.00'
  ws.getCell(ws.rowCount, labelCol).alignment = { horizontal: 'right', vertical: 'middle' }

  // Save
  console.log('[EXPORT] totalLabel =', totalLabel, 'overallDiscount =', overallDiscount)
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
