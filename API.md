# 检测报价管理系统 API 文档

**Base URL:** `http://154.196.2.119:8080/api`
**认证方式:** Bearer Token（登录后获取，放在请求头 `Authorization: Bearer <token>`）
**Token 有效期:** 7 天

---

## 通用说明

- 所有接口均为 **POST** 请求（用户管理除外）
- 请求体格式为 `Content-Type: application/json`
- 需要认证的接口会校验 Token，缺失或过期返回 `401`
- 需要管理员权限的接口，普通用户访问返回 `403`
- 所有列表接口支持分页，`page` 默认 1，`page_size` 默认 20（最大 20）

### 错误响应格式

```json
{
  "detail": "错误描述信息"
}
```

---

## 1. 认证 `/api/auth`

### 1.1 登录 `POST /api/auth/login`

**权限:** 公开

**请求:**
```json
{
  "username": "admin",
  "password": "20231102"
}
```

**响应 `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "display_name": "管理员",
    "role": "admin"
  }
}
```

**错误 `401`:**
```json
{
  "detail": "用户名或密码错误"
}
```

---

### 1.2 注册 `POST /api/auth/register`

**权限:** 管理员

**请求:**
```json
{
  "username": "newuser",
  "password": "123456",
  "display_name": "新用户",
  "role": "user"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名（唯一） |
| password | string | 是 | 密码 |
| display_name | string | 否 | 显示名称，默认为空 |
| role | string | 否 | 角色：`admin` / `user`，默认 `user` |

**响应 `200`:**
```json
{
  "id": 2,
  "username": "newuser",
  "message": "创建成功"
}
```

**错误 `400`:**
```json
{
  "detail": "用户名已存在"
}
```

---

### 1.3 获取当前用户 `GET /api/auth/me`

**权限:** 登录用户

**响应 `200`:**
```json
{
  "id": 1,
  "username": "admin",
  "display_name": "管理员",
  "role": "admin",
  "created_at": "2026-03-24 07:31:00"
}
```

---

### 1.4 修改密码 `POST /api/auth/change-password`

**权限:** 登录用户

**请求:**
```json
{
  "old_password": "20231102",
  "new_password": "newpass123"
}
```

**响应 `200`:**
```json
{
  "message": "密码修改成功"
}
```

**错误 `400`:**
```json
{
  "detail": "原密码错误"
}
```

---

## 2. 药品检测项目 `/api/drug-items`

### 2.1 列表（分组） `POST /api/drug-items/list`

**权限:** 登录用户

**请求:**
```json
{
  "search": "含量",
  "category": "中药饮片",
  "page": 1,
  "page_size": 20
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| search | string | 否 | 搜索关键词（模糊匹配名称、分类、标准） |
| category | string | 否 | 按分类精确筛选 |
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页样品组数，默认 20，最大 20 |

**响应 `200`:**
```json
{
  "total": 52,
  "total_items": 5413,
  "page": 1,
  "page_size": 20,
  "samples": [
    {
      "category": "中药饮片-丁香",
      "items": [
        {
          "id": 1,
          "category": "中药饮片-丁香",
          "name": "丁香鉴别",
          "standard": "《中国药典》2020年版",
          "method": "显微鉴别",
          "unit_price": 120.00,
          "cma": 1,
          "cnas": 0,
          "cycle_days": 5,
          "description": "",
          "is_active": true
        }
      ]
    }
  ]
}
```

| 字段 | 说明 |
|------|------|
| total | 样品组总数 |
| total_items | 检测项目总数 |
| samples[].category | 样品分类名称 |
| samples[].items[].id | 项目 ID |
| samples[].items[].cma | 1=有CMA资质，0=无 |
| samples[].items[].cnas | 1=有CNAS资质，0=无 |

---

### 2.2 获取所有分类 `POST /api/drug-items/categories`

**权限:** 登录用户

**请求:** 无

**响应 `200`:**
```json
[
  "中药饮片-丁香",
  "中药饮片-三七",
  "化学药品-丙氨酸",
  "药典产品-丁香",
  "药用辅料-乙醇"
]
```

返回所有去重排序后的分类名列表（`string[]`）。

---

### 2.3 新增项目 `POST /api/drug-items/create`

**权限:** 管理员

**请求:**
```json
{
  "category": "中药饮片-丁香",
  "name": "丁香含量测定",
  "standard": "《中国药典》2020年版",
  "method": "HPLC",
  "unit_price": 200.00,
  "cma": true,
  "cnas": false,
  "cycle_days": 7,
  "description": "丁香酚含量测定"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | 是 | 分类名 |
| name | string | 是 | 项目名称 |
| standard | string | 否 | 检测标准 |
| method | string | 否 | 检测方法 |
| unit_price | float | 是 | 单价（元） |
| cma | bool | 否 | 是否有CMA资质，默认 false |
| cnas | bool | 否 | 是否有CNAS资质，默认 false |
| cycle_days | int | 否 | 检测周期（天），默认 5 |
| description | string | 否 | 备注描述 |

**响应 `200`:**
```json
{
  "id": 5414,
  "category": "中药饮片-丁香",
  "name": "丁香含量测定",
  "standard": "《中国药典》2020年版",
  "method": "HPLC",
  "unit_price": 200.00,
  "cma": 1,
  "cnas": 0,
  "cycle_days": 7,
  "description": "丁香酚含量测定",
  "is_active": true
}
```

---

### 2.4 批量导入 `POST /api/drug-items/import`

**权限:** 管理员

**请求:**
```json
[
  {
    "category": "中药饮片-丁香",
    "name": "丁香水分",
    "unit_price": 80.00,
    "cycle_days": 3
  },
  {
    "category": "中药饮片-丁香",
    "name": "丁香灰分",
    "unit_price": 100.00,
    "cycle_days": 3
  }
]
```

请求体为 `DrugItemCreate[]` 数组，字段同 2.3。

**响应 `200`:**
```json
{
  "imported": 2
}
```

---

### 2.5 更新项目 `POST /api/drug-items/update`

**权限:** 管理员

**请求:**
```json
{
  "item_id": 1,
  "unit_price": 250.00,
  "cycle_days": 10
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| item_id | int | 项目 ID（必填） |
| 其他字段 | - | 同 2.3，仅传需要修改的字段 |

**响应 `200`:** 返回更新后的完整项目对象（同 2.3 响应格式）。

**错误 `404`:**
```json
{
  "detail": "项目不存在"
}
```

---

### 2.6 删除项目 `POST /api/drug-items/delete`

**权限:** 管理员

**请求:**
```json
{
  "item_id": 1
}
```

**响应 `200`:**
```json
{
  "message": "删除成功"
}
```

---

## 3. 药包材检测项目 `/api/packaging-items`

接口结构与药品检测项目完全一致，仅路由前缀不同。

### 3.1 列表（分组） `POST /api/packaging-items/list`

**权限:** 登录用户

**请求/响应:** 同 [2.1](#21-列表分组-post-apidrug-itemslist)，`items` 返回的是 `PackagingItem`。

---

### 3.2 获取分类（含大类） `POST /api/packaging-items/categories`

**权限:** 登录用户

**请求:** 无

**响应 `200`:**
```json
{
  "all": [
    "中硼硅玻璃安瓿 YBB00322005-2-2015",
    "低密度聚乙烯药用滴眼剂瓶 YBB00062002-2015",
    "注射用无菌粉末用氯化丁基橡胶塞 YBB00052005-2-2015"
  ],
  "majors": [
    "塑料类",
    "复合膜/袋类",
    "干燥剂类",
    "橡胶/垫片类",
    "注射器类",
    "玻璃类",
    "铝制品类",
    "陶瓷类"
  ],
  "by_major": {
    "玻璃类": [
      "中硼硅玻璃安瓿 YBB00322005-2-2015",
      "中硼硅玻璃管制注射剂瓶 YBB00292005-2-2015"
    ],
    "塑料类": [
      "低密度聚乙烯药用滴眼剂瓶 YBB00062002-2015",
      "聚丙烯药用滴眼剂瓶 YBB00192002-2015"
    ]
  }
}
```

| 字段 | 说明 |
|------|------|
| all | 所有分类名（去重排序） |
| majors | 大类名列表（按材质归类） |
| by_major | 大类 → 分类名列表的映射 |

**大类归类规则（按材质关键词匹配）：**

| 大类 | 匹配关键词 |
|------|-----------|
| 玻璃类 | 中硼硅玻璃、低硼硅玻璃、高硼硅玻璃、硼硅玻璃、钠钙玻璃 |
| 塑料类 | 聚乙烯、聚丙烯、聚氯乙烯、聚酯 |
| 橡胶/垫片类 | 橡胶、胶塞、垫片、活塞、护帽 |
| 铝制品类 | 铝箔、铝盖、铝质、铝塑、铝/ |
| 复合膜/袋类 | 复合膜、复合硬片、封口垫片、软膏管、输液用膜、聚酰胺 |
| 注射器类 | 注射器、注射针 |
| 干燥剂类 | 干燥剂 |
| 陶瓷类 | 陶瓷瓶 |

---

### 3.3 新增项目 `POST /api/packaging-items/create`

**权限:** 管理员

**请求/响应:** 同 [2.3](#23-新增项目-post-apidrug-itemscreate)。

---

### 3.4 批量导入 `POST /api/packaging-items/import`

**权限:** 管理员

**请求/响应:** 同 [2.4](#24-批量导入-post-apidrug-itemsimport)。

---

### 3.5 更新项目 `POST /api/packaging-items/update`

**权限:** 管理员

**请求/响应:** 同 [2.5](#25-更新项目-post-apidrug-itemsupdate)。

---

### 3.6 删除项目 `POST /api/packaging-items/delete`

**权限:** 管理员

**请求/响应:** 同 [2.6](#26-删除项目-post-apidrug-itemsdelete)。

---

## 4. 报价单 `/api/quotations`

### 4.1 列表 `POST /api/quotations/list`

**权限:** 登录用户（普通用户只能查看自己创建的）

**请求:**
```json
{
  "type": "drug",
  "status": "draft",
  "page": 1,
  "page_size": 20
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| type | string | 筛选类型：`drug` / `packaging`，空=全部 |
| status | string | 筛选状态：`draft` / `confirmed` / `sent`，空=全部 |
| page | int | 页码，默认 1 |
| page_size | int | 每页条数，默认 20，最大 20 |

**响应 `200`:**
```json
{
  "total": 12,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": 14,
      "quote_no": "QZ20260325015119",
      "title": "丁香检测报价",
      "customer_name": "北京医药有限公司",
      "contact_person": "张三",
      "sample_name": "中药饮片-丁香",
      "type": "drug",
      "total": 1500.00,
      "status": "draft",
      "items": [
        {
          "id": 1,
          "name": "丁香鉴别",
          "category": "中药饮片-丁香",
          "standard": "《中国药典》2020年版",
          "method": "显微鉴别",
          "unit_price": 120.00,
          "quantity": 1,
          "subtotal": 120.00,
          "cma": 1,
          "cnas": 0,
          "cycle_days": 5
        }
      ],
      "created_by": 1,
      "created_at": "2026-03-25 01:51:19"
    }
  ]
}
```

| 字段 | 说明 |
|------|------|
| items[].status | `draft`=草稿，`confirmed`=已确认，`sent`=已发送 |
| items[].items[] | 报价单中的检测项目明细 |

---

### 4.2 创建报价单 `POST /api/quotations/create`

**权限:** 登录用户

**请求:**
```json
{
  "quote_no": "QZ20260325015119",
  "title": "丁香检测报价",
  "customer_name": "北京医药有限公司",
  "contact_person": "张三",
  "sample_name": "中药饮片-丁香",
  "quotation_type": "drug",
  "total_amount": 1500.00,
  "items_json": [
    {
      "id": 1,
      "name": "丁香鉴别",
      "category": "中药饮片-丁香",
      "unit_price": 120.00,
      "quantity": 1,
      "subtotal": 120.00
    }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| quote_no | string | 否 | 报价单编号，不传自动生成 `QZ` + 时间戳 |
| title | string | 否 | 标题 |
| customer_name | string | 否 | 客户名称 |
| contact_person | string | 否 | 联系人 |
| sample_name | string | 否 | 样品名称 |
| quotation_type | string | 否 | 类型：`drug` / `packaging`，默认 `drug` |
| total_amount | float | 否 | 合计金额 |
| items_json | array | 否 | 检测项目明细列表 |

**响应 `200`:** 返回创建后的完整报价单对象（同 4.1 响应中的单条格式）。

---

### 4.3 获取详情 `POST /api/quotations/get`

**权限:** 登录用户

**请求:**
```json
{
  "item_id": 14
}
```

**响应 `200`:** 返回完整报价单对象。

**错误 `404`:**
```json
{
  "detail": "报价单不存在"
}
```

---

### 4.4 更新报价单 `POST /api/quotations/update`

**权限:** 登录用户

**请求:**
```json
{
  "item_id": 14,
  "customer_name": "上海医药集团",
  "total_amount": 2000.00,
  "status": "confirmed",
  "items_json": [
    {
      "id": 1,
      "name": "丁香鉴别",
      "unit_price": 120.00,
      "quantity": 2
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| item_id | int | 报价单 ID（必填） |
| status | string | 可改为 `draft` / `confirmed` / `sent` |
| 其他字段 | - | 仅传需要修改的字段 |

**响应 `200`:** 返回更新后的完整报价单对象。

---

### 4.5 删除报价单 `POST /api/quotations/delete`

**权限:** 登录用户

**请求:**
```json
{
  "item_id": 14
}
```

**响应 `200`:**
```json
{
  "message": "删除成功"
}
```

---

## 5. 统计 `/api/stats`

### 5.1 获取统计数据 `POST /api/stats`

**权限:** 公开（无需 Token）

**请求:** 无

**响应 `200`:**
```json
{
  "drug_items": 5413,
  "packaging_items": 82,
  "drug_samples": 52,
  "packaging_samples": 76,
  "drug_quotes": 8,
  "packaging_quotes": 4,
  "total_quotes": 12,
  "total_amount": 45600.00
}
```

| 字段 | 说明 |
|------|------|
| drug_items | 药品检测项目总数 |
| packaging_items | 药包材检测项目总数 |
| drug_samples | 药品样品分类数 |
| packaging_samples | 药包材样品分类数 |
| drug_quotes | 药品报价单数 |
| packaging_quotes | 药包材报价单数 |
| total_quotes | 报价单总数 |
| total_amount | 报价单总金额 |

---

## 6. 用户管理 `/api/users`

### 6.1 用户列表 `GET /api/users`

**权限:** 管理员

**响应 `200`:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "display_name": "管理员",
    "role": "admin",
    "is_active": true,
    "created_at": "2026-03-24 07:31:00"
  },
  {
    "id": 2,
    "username": "user1",
    "display_name": "用户1",
    "role": "user",
    "is_active": true,
    "created_at": "2026-03-24 08:00:00"
  }
]
```

---

### 6.2 更新用户 `PUT /api/users/{user_id}`

**权限:** 管理员

**请求:**
```json
{
  "display_name": "新名称",
  "role": "admin",
  "is_active": false
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| display_name | string | 显示名称 |
| role | string | 角色：`admin` / `user` |
| is_active | bool | 是否启用 |

**响应 `200`:**
```json
{
  "message": "更新成功"
}
```

---

### 6.3 删除用户 `DELETE /api/users/{user_id}`

**权限:** 管理员

**响应 `200`:**
```json
{
  "message": "删除成功"
}
```

**错误 `400`:**
```json
{
  "detail": "不能删除自己"
}
```

---

## 7. 健康检查

### 7.1 健康检查 `GET /health`

**权限:** 公开

**响应 `200`:**
```json
{
  "status": "ok"
}
```
