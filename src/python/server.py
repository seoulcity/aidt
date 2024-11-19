# src/python/server.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
import os
from pathlib import Path
import shutil
import pymupdf4llm
import fitz
from typing import List

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 임시 파일 저장 디렉토리
TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)

@app.post("/api/pdf")
async def extract_pdf(
    file: UploadFile = File(...),
    extract_type: str = Form("text"),
    page_number: int = Form(1)
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
                    pages=[page_number - 1]
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
            
            print(f"Extraction successful for page {page_number}")
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

@app.post("/api/pdf/analyze")
async def analyze_pdf_page(
    file: UploadFile = File(...),
    page_number: int = Form(1)
):
    try:
        print(f"Analyzing PDF page: {file.filename}, page: {page_number}")
        temp_pdf = TEMP_DIR / f"input_{file.filename}"
        
        try:
            with temp_pdf.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            doc = fitz.open(str(temp_pdf))
            page = doc[page_number - 1]
            
            # 페이지 렌더링 (이미지 데이터 준비)
            pix = page.get_pixmap()
            
            # 페이지의 객체들을 타입별로 수집
            elements = []
            
            # 텍스트 블록 추출
            text_blocks = page.get_text("dict")["blocks"]
            for block in text_blocks:
                if block.get("type") == 0:  # 텍스트 블록
                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            elements.append({
                                "type": "text",
                                "bbox": span["bbox"],
                                "text": span["text"],
                                "font": span["font"],
                                "size": span["size"]
                            })
            
            # 이미지 추출 (페이지 렌더링 후)
            images = page.get_images(full=True)  # full=True로 변경
            for img_index, img in enumerate(images):
                xref = img[0]
                bbox = page.get_image_bbox(img)
                if bbox:
                    # 이미지 메타데이터 추가
                    image_info = {
                        "type": "image",
                        "bbox": list(bbox),
                        "xref": xref,
                        "width": img[2],  # 이미지 너비
                        "height": img[3],  # 이미지 높이
                        "colorspace": img[4],  # 컬러스페이스
                    }
                    elements.append(image_info)
            
            # 표 감지
            tables = page.find_tables()
            for table in tables:
                elements.append({
                    "type": "table",
                    "bbox": list(table.bbox),
                    "rows": len(table.cells),
                    "cols": len(table.cells[0]) if table.cells else 0
                })
            
            print(f"Analysis successful: found {len(elements)} elements")
            return {
                "success": True,
                "elements": elements,
                "page_dims": {
                    "width": page.rect.width,
                    "height": page.rect.height
                }
            }
            
        finally:
            if 'doc' in locals():
                doc.close()
            file.file.close()
            if temp_pdf.exists():
                temp_pdf.unlink()
                
    except Exception as e:
        print(f"Analysis error: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/pdf/extract-table")
async def extract_table(
    file: UploadFile = File(...),
    page_number: int = Form(1),
    bbox: str = Form(...)
):
    try:
        print(f"Extracting specific table from: {file.filename}, page: {page_number}")
        temp_pdf = TEMP_DIR / f"input_{file.filename}"
        
        try:
            with temp_pdf.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # bbox JSON 파싱
            table_bbox = json.loads(bbox)
            print("Received bbox:", table_bbox)
            
            doc = fitz.open(str(temp_pdf))
            page = doc[page_number - 1]
            
            # 특정 bbox 영역의 표만 추출
            tables = page.find_tables(
                clip=fitz.Rect(table_bbox[0], table_bbox[1], table_bbox[2], table_bbox[3])
            )
            
            if not tables:
                return {
                    "success": False,
                    "error": "No table found in selected area"
                }
            
            # 첫 번째 표만 처리
            table = tables[0]
            
            # 디버깅을 위한 상세 정보 출력
            print("\nTable Debug Info:")
            print("=================")
            print(f"Row count: {table.row_count}")
            print(f"Column count: {table.col_count}")
            
            # 표 데이터를 추출
            extracted_data = table.extract()
            print("Extracted table data:", extracted_data)
            
            # Markdown 형식으로 변환
            markdown = ""
            if extracted_data:
                # 헤더 행 추가 (첫 번째와 마지막 파이프 문자 보장)
                first_row = [str(cell) if cell is not None else "" for cell in extracted_data[0]]
                markdown += "|" + "|".join(first_row) + "|\n"
                markdown += "|" + "|".join(["---"] * len(first_row)) + "|\n"
                
                # 데이터 행 추가
                for row in extracted_data[1:]:
                    formatted_row = [str(cell) if cell is not None else "" for cell in row]
                    markdown += "|" + "|".join(formatted_row) + "|\n"
                
                print("\nGenerated Markdown Table:")
                print(markdown)
                
                return {
                    "success": True,
                    "content": markdown,
                    "page": page_number,
                    "table_data": extracted_data
                }
            
        finally:
            if 'doc' in locals():
                doc.close()
            file.file.close()
            if temp_pdf.exists():
                temp_pdf.unlink()
                
    except Exception as e:
        print(f"\nError occurred:")
        print("=================")
        print(f"Error type: {type(e)}")
        print(f"Error message: {str(e)}")
        import traceback
        traceback.print_exc()
        print("=================\n")
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        timeout_keep_alive=65,
        log_level="info"
    ) 