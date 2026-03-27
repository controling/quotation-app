#!/bin/bash
# 药品检测报价单系统 - 手动备份脚本
# 用法: bash /root/quotation-app/backup.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p "$BACKUP_DIR"

echo "📦 开始备份 [$TIMESTAMP]"

# 1. MySQL 数据库
mysqldump -u root -p'Quotation@2026' quotation_db --single-transaction --routines --triggers \
  > "/tmp/_quote_db.sql" 2>/dev/null && echo "✅ 数据库" || { echo "❌ 数据库失败"; exit 1; }

# 2. 打包
tar czf "$BACKUP_DIR/quotation-app_${TIMESTAMP}.tar.gz" \
  -C /tmp _quote_db.sql \
  -C /root/quotation-app backend \
  -C /root/quotation-app src \
  -C /root/quotation-app package.json \
  -C /root/quotation-app vite.config.js \
  -C /root/quotation-app index.html \
  -C /www/server/panel/vhost/nginx 0.default.conf \
  2>/dev/null

rm -f /tmp/_quote_db.sql

SIZE=$(ls -lh "$BACKUP_DIR/quotation-app_${TIMESTAMP}.tar.gz" | awk '{print $5}')
echo "✅ 备份完成: $BACKUP_DIR/quotation-app_${TIMESTAMP}.tar.gz ($SIZE)"

# 清理 7 天前的旧备份
find "$BACKUP_DIR" -name "quotation-app_*.tar.gz" -mtime +7 -delete 2>/dev/null
echo "🧹 已清理 7 天前旧备份"
