import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import re
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import get_db
from models import DrugItem
from routers.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/drug-items", tags=["drug-items"])


class DrugItemCreate(BaseModel):
    category: str = ""
    name: str = ""
    standard: str = ""
    method: str = ""
    unit_price: float = 0
    cma: bool = False
    cnas: bool = False
    cycle_days: int = 5
    description: str = ""

class DrugItemUpdate(BaseModel):
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


def item_to_dict(item: DrugItem):
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
    q = db.query(DrugItem).filter(DrugItem.is_active == True)

    if params.category:
        q = q.filter(DrugItem.category == params.category)

    if params.search:
        terms = [t.strip() for t in re.split(r'[,，;；、:：\\/\\|\s]+', params.search) if t.strip()]
        if terms:
            conds = []
            for term in terms:
                like = f"%{term}%"
                conds.append(or_(DrugItem.name.like(like), DrugItem.category.like(like), DrugItem.standard.like(like)))
            q = q.filter(or_(*conds))

    all_items = q.order_by(DrugItem.category, DrugItem.id).all()

    # Group by category (sample)
    groups = {}
    for item in all_items:
        cat = item.category or "未分类"
        if cat not in groups:
            groups[cat] = []
        groups[cat].append(item_to_dict(item))

    # Sort categories
    sorted_cats = sorted(groups.keys())
    total_samples = len(sorted_cats)

    # Paginate by sample
    page_size = min(params.page_size, 20)
    start = (params.page - 1) * page_size
    page_cats = sorted_cats[start:start + page_size]

    result = []
    for cat in page_cats:
        result.append({"category": cat, "items": groups[cat]})

    return {"total": total_samples, "total_items": len(all_items), "page": params.page, "page_size": page_size, "samples": result}


@router.post("/categories")
def list_categories(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(DrugItem.category).filter(DrugItem.is_active == True).distinct().all()
    cats = sorted([r[0] for r in rows if r[0]])
    return cats


@router.post("/create")
def create_item(data: DrugItemCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    item = DrugItem(category=data.category, name=data.name, standard=data.standard, method=data.method,
                    unit_price=data.unit_price, cma=data.cma, cnas=data.cnas, cycle_days=data.cycle_days,
                    description=data.description, is_active=True)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item_to_dict(item)


@router.post("/import")
def import_items(items: list[DrugItemCreate], db: Session = Depends(get_db), admin=Depends(require_admin)):
    created = 0
    for data in items:
        item = DrugItem(category=data.category, name=data.name, standard=data.standard, method=data.method,
                        unit_price=data.unit_price, cma=data.cma, cnas=data.cnas, cycle_days=data.cycle_days,
                        description=data.description, is_active=True)
        db.add(item)
        created += 1
    db.commit()
    return {"imported": created}


@router.post("/update")
def update_item(body: dict, db: Session = Depends(get_db), admin=Depends(require_admin)):
    item_id = body.pop("item_id", 0)
    item = db.query(DrugItem).filter(DrugItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="项目不存在")
    allowed = {"category","name","standard","method","unit_price","cma","cnas","cycle_days","description","is_active"}
    for key, val in body.items():
        if key in allowed:
            setattr(item, key, val)
    db.commit()
    db.refresh(item)
    return item_to_dict(item)


@router.post("/delete")
def delete_item(body: dict, db: Session = Depends(get_db), admin=Depends(require_admin)):
    item_id = body.get("item_id", 0)
    item = db.query(DrugItem).filter(DrugItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="项目不存在")
    db.delete(item)
    db.commit()
    return {"message": "删除成功"}
