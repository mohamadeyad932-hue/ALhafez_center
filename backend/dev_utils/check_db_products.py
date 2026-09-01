import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")
db_url = os.getenv("DATABASE_URL")
print(f"Connecting to: {db_url}")

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT name, price FROM products LIMIT 5"))
        print("Products in DB:")
        for r in res:
            print(f"- {r[0]} ({r[1]})")
except Exception as e:
    print(f"DB Error: {e}")
