# src/python/server.py
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
import os
from pathlib import Path
import shutil
import pymupdf4llm

app = FastAPI()

# CORS 설정 수정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 origin 허용
    allow_credentials=False,  # credentials 비활성화
    allow_methods=["*"],
    allow_headers=["*"],
)

# 임시 파일 저장 디렉토리
TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)

@app.post("/extract")
async def extract_pdf(
    file: UploadFile = File(...),
    extract_type: str = "text",
    page_number: int = 1  # 페이지 번호 파라미터 추가
):
    try:
        print(f"Received file: {file.filename}, type: {extract_type}, page: {page_number}")
        
        # 임시 파일 저장
        temp_pdf = TEMP_DIR / f"input_{file.filename}"
        temp_output = TEMP_DIR / f"output_{file.filename}.md"
        
        try:
            with temp_pdf.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            print(f"File saved: {temp_pdf}")
        finally:
            file.file.close()
            
        # PDF 처리
        try:
            if extract_type == 'text':
                md_text = pymupdf4llm.to_markdown(
                    str(temp_pdf),
                    pages=[page_number - 1]  # 0-based index로 변환
                )
            elif extract_type == 'tables':
                md_text = pymupdf4llm.to_markdown(
                    doc=str(temp_pdf),
                    pages=[page_number - 1],
                    page_chunks=True
                )
            elif extract_type == 'images':
                md_text = pymupdf4llm.to_markdown(
                    doc=str(temp_pdf),
                    pages=[page_number - 1],
                    page_chunks=True,
                    write_images=True,
                    image_path=str(TEMP_DIR / "images"),
                    image_format="png",
                    dpi=300
                )
            
            print(f"Extraction successful, content length: {len(md_text)}")
            return {
                "success": True,
                "content": md_text,
                "page": page_number
            }
            
        except Exception as e:
            print(f"Extraction error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
            
    finally:
        # 임시 파일 정리
        if temp_pdf.exists():
            temp_pdf.unlink()
        if temp_output.exists():
            temp_output.unlink()

if __name__ == "__main__":
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        timeout_keep_alive=65,
        log_level="info"
    ) 