from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from urllib.parse import quote_plus

_pw = quote_plus("Quotation@2026")
DATABASE_URL = f"mysql+pymysql://root:{_pw}@localhost:3306/quotation_db"

engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
