import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import get_db
from models import PackagingItem
from routers.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/packaging-items", tags=["packaging-items"])


class PackagingItemCreate(BaseModel):
    category: str = ""
    name: str = ""
    standard: str = ""
    method: str = ""
    unit_price: float = 0
    cma: bool = False
    cnas: bool = False
    cycle_days: int = 5
    description: str = ""

class PackagingItemUpdate(BaseModel):
    unit_price: float | None = None
    category: str | None = None
    name: str | None = None
    standard: str | None = None
    method: str | None = None
    cma: bool | None = None
    cnas: bool | None = None
    cycle_days: int | None = None
    description: str | None = None
    is_active: bool | None = None

class ListParams(BaseModel):
    search: str = ""
    category: str = ""
    page: int = 1
    page_size: int = 20


def item_to_dict(item: PackagingItem):
    return {
        "id": item.id,
        "category": item.category,
        "name": item.name,
        "standard": item.standard,
        "method": item.method,
        "unit_price": float(item.unit_price),
        "cma": 1 if item.cma else 0,
        "cnas": 1 if item.cnas else 0,
        "cycle_days": item.cycle_days,
        "description": item.description,
        "is_active": item.is_active,
    }


@router.post("/list")
def list_items(params: ListParams, db: Session = Depends(get_db), user=Depends(get_current_user)):
    q = db.query(PackagingItem).filter(PackagingItem.is_active == True)

    if params.category:
        q = q.filter(PackagingItem.category == params.category)

    if params.search:
        like = f"%{params.search}%"
        q = q.filter(or_(PackagingItem.name.like(like), PackagingItem.category.like(like), PackagingItem.standard.like(like)))

    all_items = q.order_by(PackagingItem.category, PackagingItem.id).all()

    # Group by category (sample)
    groups = {}
    for item in all_items:
        cat = item.category or "未分类"
        if cat not in groups:
            groups[cat] = []
        groups[cat].append(item_to_dict(item))

    sorted_cats = sorted(groups.keys())
    total_samples = len(sorted_cats)

    page_size = min(params.page_size, 20)
    start = (params.page - 1) * page_size
    page_cats = sorted_cats[start:start + page_size]

    result = []
    for cat in page_cats:
        result.append({"category": cat, "items": groups[cat]})

    return {"total": total_samples, "total_items": len(all_items), "page": params.page, "page_size": page_size, "samples": result}


def _extract_major(category: str) -> str:
    """从药包材分类名中按材质归大类"""
    # 按材质关键词匹配大类（顺序有优先级）
    material_rules = [
        # 复合类优先（含多种材质的组合）
        ('共挤输液用膜', '复合膜/袋类'),
        ('输液用膜', '复合膜/袋类'),
        ('复合膜', '复合膜/袋类'),
        ('复合硬片', '复合膜/袋类'),
        ('封口垫片', '复合膜/袋类'),
        ('软膏管', '复合膜/袋类'),
        ('玻璃纸', '复合膜/袋类'),
        ('聚酰胺', '复合膜/袋类'),
        ('陶瓷瓶', '陶瓷类'),
        # 注射器类
        ('注射器', '注射器类'),
        ('注射针', '注射器类'),
        # 干燥剂
        ('干燥剂', '干燥剂类'),
        # 铝制品
        ('铝箔', '铝制品类'),
        ('铝盖', '铝制品类'),
        ('铝质', '铝制品类'),
        ('铝塑', '铝制品类'),
        ('铝/', '铝制品类'),
        # 橡胶/垫片
        ('橡胶', '橡胶/垫片类'),
        ('胶塞', '橡胶/垫片类'),
        ('垫片', '橡胶/垫片类'),
        ('活塞', '橡胶/垫片类'),
        ('护帽', '橡胶/垫片类'),
        # 玻璃
        ('中硼硅玻璃', '玻璃类'),
        ('低硼硅玻璃', '玻璃类'),
        ('高硼硅玻璃', '玻璃类'),
        ('硼硅玻璃', '玻璃类'),
        ('钠钙玻璃', '玻璃类'),
        ('玻璃', '玻璃类'),
        # 塑料
        ('聚氯乙烯', '塑料类'),
        ('聚酯', '塑料类'),
        ('聚丙烯', '塑料类'),
        ('聚乙烯', '塑料类'),
        ('塑料', '塑料类'),
    ]
    for keyword, major in material_rules:
        if keyword in category:
            return major
    return '其他'


@router.post("/categories")
def list_categories(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(PackagingItem.category).filter(PackagingItem.is_active == True).distinct().all()
    cats = sorted([r[0] for r in rows if r[0]])

    # 按大类分组
    major_map = {}
    for cat in cats:
        major = _extract_major(cat)
        if major not in major_map:
            major_map[major] = []
        major_map[major].append(cat)

    majors = sorted(major_map.keys())
    return {"all": cats, "majors": majors, "by_major": major_map}


@router.post("/create")
def create_item(data: PackagingItemCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    item = PackagingItem(category=data.category, name=data.name, standard=data.standard, method=data.method,
                         unit_price=data.unit_price, cma=data.cma, cnas=data.cnas, cycle_days=data.cycle_days,
                         description=data.description, is_active=True)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item_to_dict(item)


@router.post("/import")
def import_items(items: list[PackagingItemCreate], db: Session = Depends(get_db), admin=Depends(require_admin)):
    created = 0
    for data in items:
        item = PackagingItem(category=data.category, name=data.name, standard=data.standard, method=data.method,
                             unit_price=data.unit_price, cma=data.cma, cnas=data.cnas, cycle_days=data.cycle_days,
                             description=data.description, is_active=True)
        db.add(item)
        created += 1
    db.commit()
    return {"imported": created}


@router.post("/update")
def update_item(data: PackagingItemUpdate, item_id: int = 0, db: Session = Depends(get_db), admin=Depends(require_admin)):
    item = db.query(PackagingItem).filter(PackagingItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="项目不存在")
    update_data = data.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(item, key, val)
    db.commit()
    db.refresh(item)
    return item_to_dict(item)


@router.post("/delete")
def delete_item(item_id: int = 0, db: Session = Depends(get_db), admin=Depends(require_admin)):
    item = db.query(PackagingItem).filter(PackagingItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="项目不存在")
    db.delete(item)
    db.commit()
    return {"message": "删除成功"}
