#!/usr/bin/env python3
"""Import data from JSON files into MySQL and create default admin user."""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal, Base
import models
from passlib.hash import bcrypt

# Create all tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# 1. Create default admin user
admin = db.query(models.User).filter(models.User.username == "admin").first()
if not admin:
    admin = models.User(
        username="admin",
        display_name="管理员",
        password_hash=bcrypt.hash("20231102"),
        role=models.UserRole.admin,
        is_active=True,
    )
    db.add(admin)
    db.commit()
    print("✅ Admin user created (admin / 20231102)")
else:
    print("ℹ️ Admin user already exists")

# 2. Import drug items
drug_json_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "drug-items.json")
if os.path.exists(drug_json_path):
    with open(drug_json_path, "r", encoding="utf-8") as f:
        items = json.load(f)

    count = 0
    for item in items:
        existing = db.query(models.DrugItem).filter(models.DrugItem.id == item.get("id")).first()
        if existing:
            continue
        obj = models.DrugItem(
            id=item.get("id"),
            category=item.get("category", ""),
            name=item.get("name", ""),
            standard=item.get("standard", ""),
            method=item.get("method", ""),
            unit_price=item.get("unit_price", 0),
            cma=bool(item.get("cma", 0)),
            cnas=bool(item.get("cnas", 0)),
            cycle_days=item.get("cycle_days", 5),
            description=item.get("description", ""),
            is_active=True,
        )
        db.add(obj)
        count += 1

    db.commit()
    print(f"✅ Imported {count} drug items (total {len(items)})")
else:
    print("❌ drug-items.json not found")

# 3. Import packaging items
pkg_json_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "packaging-items.json")
if os.path.exists(pkg_json_path):
    with open(pkg_json_path, "r", encoding="utf-8") as f:
        items = json.load(f)

    count = 0
    for item in items:
        existing = db.query(models.PackagingItem).filter(models.PackagingItem.id == item.get("id")).first()
        if existing:
            continue
        obj = models.PackagingItem(
            id=item.get("id"),
            category=item.get("category", ""),
            name=item.get("name", ""),
            standard=item.get("standard", ""),
            method=item.get("method", ""),
            unit_price=item.get("unit_price", 0),
            cma=bool(item.get("cma", 0)),
            cnas=bool(item.get("cnas", 0)),
            cycle_days=item.get("cycle_days", 5),
            description=item.get("description", ""),
            is_active=True,
        )
        db.add(obj)
        count += 1

    db.commit()
    print(f"✅ Imported {count} packaging items (total {len(items)})")
else:
    print("❌ packaging-items.json not found")

# 4. Verify
drug_count = db.query(models.DrugItem).count()
pkg_count = db.query(models.PackagingItem).count()
user_count = db.query(models.User).count()
print(f"\n📊 Database summary: {drug_count} drug items, {pkg_count} packaging items, {user_count} users")

db.close()
