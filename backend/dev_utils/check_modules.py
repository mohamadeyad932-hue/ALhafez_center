import sys
import os

modules_to_test = [
    "fastapi",
    "uvicorn",
    "sqlalchemy",
    "psycopg2",
    "alembic",
    "jose",
    "passlib",
    "bcrypt",
    "multipart",
    "pydantic",
    "pydantic_settings",
    "openai",
    "dotenv",
    "starlette",
    "chromadb",
    "langchain",
    "langchain_openai",
    "langchain_google_genai",
    "langchain_chroma",
    "langchain_text_splitters",
    "langchain_community",
    "docx2txt",
    "pypdf",
    "openpyxl",
    "unstructured",
    "sentence_transformers",
    "requests",
    "aiofiles",
    "tiktoken"
]

missing = []
for module in modules_to_test:
    try:
        if module == "multipart":
            __import__("multipart")
        elif module == "dotenv":
            __import__("dotenv")
        elif module == "jose":
            __import__("jose")
        else:
            __import__(module)
        print(f"[OK] {module} is installed")
    except ImportError:
        print(f"[MISSING] {module} is NOT installed")
        missing.append(module)

if missing:
    print(f"\nTotal missing: {len(missing)}")
    print(f"Missing modules: {', '.join(missing)}")
else:
    print("\nAll modules are installed!")
