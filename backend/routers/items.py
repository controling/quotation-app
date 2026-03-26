import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import get_db
from models import DrugItem, PackagingItem
from routers.auth import get_current_user

router = APIRouter(prefix="/api/items", tags=["items"])


class ItemsListParams(BaseModel):
    type: str = "drug"
    search: str = ""
    category: str = ""
    page: int = 1
    page_size: int = 20


def _item_to_dict(item, item_type: str):
    return {
        "id": item.id,
        "type": item_type,
        "category": item.category,
        "name": item.name,
        "standard": item.standard or "",
        "method": item.method or "",
        "unit_price": float(item.unit_price),
        "cma": 1 if item.cma else 0,
        "cnas": 1 if item.cnas else 0,
        "cycle_days": item.cycle_days or 5,
        "description": item.description or "",
    }


@router.post("/list")
def list_all_items(params: ItemsListParams, db: Session = Depends(get_db), user=Depends(get_current_user)):
    Model = DrugItem if params.type == "drug" else PackagingItem

    q = db.query(Model).filter(Model.is_active == True)

    if params.category:
        q = q.filter(Model.category == params.category)

    if params.search:
        like = f"%{params.search}%"
        q = q.filter(
            or_(
                Model.name.like(like),
                Model.category.like(like),
                Model.standard.like(like),
                Model.method.like(like),
            )
        )

    total = q.count()
    page_size = min(params.page_size, 100)
    items = q.order_by(Model.category, Model.id).offset((params.page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": params.page,
        "page_size": page_size,
        "items": [_item_to_dict(i, params.type) for i in items],
    }
