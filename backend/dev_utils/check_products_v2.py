from backend.app.database import SessionLocal
from backend.app.models import Product

def check_products():
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        print(f"Total products: {len(products)}")
        for p in products:
            print(f"ID: {p.id}, Name: {p.name}, Category: {p.category}, Price: {p.price}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_products()
