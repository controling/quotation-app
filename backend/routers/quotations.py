import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Quotation, QuotationType, QuotationStatus, now_beijing
from routers.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/quotations", tags=["quotations"])


class QuotationCreate(BaseModel):
    quote_no: str | None = None
    title: str = ""
    customer_name: str = ""
    contact_person: str = ""
    sample_name: str = ""
    quotation_type: str = "drug"
    total_amount: float = 0
    items_json: list = []
    overall_discount: float = 1
    sample_discounts: dict = {}


class QuotationUpdate(BaseModel):
    item_id: int = 0
    title: str | None = None
    customer_name: str | None = None
    contact_person: str | None = None
    sample_name: str | None = None
    total_amount: float | None = None
    status: str | None = None
    items_json: list | None = None
    overall_discount: float | None = None
    sample_discounts: dict | None = None


class ListParams(BaseModel):
    type: str = ""
    status: str = ""
    page: int = 1
    page_size: int = 20


def q_to_dict(q: Quotation):
    return {
        "id": q.id,
        "quote_no": q.quote_no,
        "title": q.title,
        "customer_name": q.customer_name,
        "contact_person": q.contact_person,
        "sample_name": q.sample_name,
        "type": q.quotation_type.value if q.quotation_type else "drug",
        "total": float(q.total_amount) if q.total_amount else 0,
        "status": q.status.value if q.status else "draft",
        "items": q.items_json or [],
        "overall_discount": float(q.overall_discount) if q.overall_discount else 1,
        "sample_discounts": q.sample_discounts or {},
        "created_by": q.created_by,
        "created_at": str(q.created_at) if q.created_at else "",
    }


def generate_quote_no():
    return f"QZ{now_beijing().strftime('%Y%m%d%H%M%S')}"


@router.post("/list")
def list_quotations(params: ListParams, db: Session = Depends(get_db), user=Depends(get_current_user)):
    q = db.query(Quotation)

    if params.type:
        q = q.filter(Quotation.quotation_type == QuotationType(params.type))
    if params.status:
        q = q.filter(Quotation.status == QuotationStatus(params.status))

    # Non-admin users see only their own
    if user.role.value != "admin":
        q = q.filter(Quotation.created_by == user.id)

    total = q.count()
    page_size = min(params.page_size, 20)
    items = q.order_by(Quotation.id.desc()).offset((params.page - 1) * page_size).limit(page_size).all()

    return {"total": total, "page": params.page, "page_size": page_size, "items": [q_to_dict(i) for i in items]}


@router.post("/create")
def create_quotation(data: QuotationCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    q = Quotation(
        quote_no=data.quote_no or generate_quote_no(),
        title=data.title,
        customer_name=data.customer_name,
        contact_person=data.contact_person,
        sample_name=data.sample_name,
        quotation_type=QuotationType(data.quotation_type),
        total_amount=data.total_amount,
        items_json=data.items_json,
        overall_discount=data.overall_discount,
        sample_discounts=data.sample_discounts,
        status=QuotationStatus.draft,
        created_by=user.id,
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q_to_dict(q)


class QuotationDelete(BaseModel):
    item_id: int = 0

@router.post("/get")
def get_quotation(data: QuotationDelete, db: Session = Depends(get_db), user=Depends(get_current_user)):
    q = db.query(Quotation).filter(Quotation.id == data.item_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="报价单不存在")
    return q_to_dict(q)


@router.post("/update")
def update_quotation(data: QuotationUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    q = db.query(Quotation).filter(Quotation.id == data.item_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="报价单不存在")

    update_data = data.model_dump(exclude_unset=True)
    if "status" in update_data:
        update_data["status"] = QuotationStatus(update_data["status"])
    for key, val in update_data.items():
        setattr(q, key, val)

    q.updated_at = now_beijing()
    db.commit()
    db.refresh(q)
    return q_to_dict(q)


@router.post("/delete")
def delete_quotation(data: QuotationDelete, db: Session = Depends(get_db), user=Depends(get_current_user)):
    q = db.query(Quotation).filter(Quotation.id == data.item_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="报价单不存在")
    db.delete(q)
    db.commit()
    return {"message": "删除成功"}
