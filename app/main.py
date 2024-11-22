from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
) 