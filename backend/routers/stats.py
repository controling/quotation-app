from fastapi import APIRouter
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from fastapi import Depends

from database import get_db
from models import DrugItem, PackagingItem, Quotation, QuotationType

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.post("")
def get_stats(db: Session = Depends(get_db)):
    drug_count = db.query(func.count(DrugItem.id)).scalar() or 0
    packaging_count = db.query(func.count(PackagingItem.id)).scalar() or 0
    drug_samples = db.query(func.count(distinct(DrugItem.category))).scalar() or 0
    packaging_samples = db.query(func.count(distinct(PackagingItem.category))).scalar() or 0
    drug_quotes = db.query(func.count(Quotation.id)).filter(Quotation.quotation_type == QuotationType.drug).scalar() or 0
    packaging_quotes = db.query(func.count(Quotation.id)).filter(Quotation.quotation_type == QuotationType.packaging).scalar() or 0
    total_quotes = drug_quotes + packaging_quotes
    total_amount = db.query(func.coalesce(func.sum(Quotation.total_amount), 0)).scalar() or 0

    return {
        "drug_items": drug_count,
        "packaging_items": packaging_count,
        "drug_samples": drug_samples,
        "packaging_samples": packaging_samples,
        "drug_quotes": drug_quotes,
        "packaging_quotes": packaging_quotes,
        "total_quotes": total_quotes,
        "total_amount": float(total_amount)
    }
