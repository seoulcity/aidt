import sys
import pymupdf4llm
import json

def extract_pdf(pdf_path, output_path, extract_type='text'):
    try:
        if extract_type == 'text':
            md_text = pymupdf4llm.to_markdown(pdf_path)
        elif extract_type == 'tables':
            md_text = pymupdf4llm.to_markdown(
                doc=pdf_path,
                page_chunks=True
            )
        elif extract_type == 'images':
            md_text = pymupdf4llm.to_markdown(
                doc=pdf_path,
                pages=[0],
                page_chunks=True,
                write_images=True,
                image_path="images",
                image_format="png",
                dpi=300
            )
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(md_text)
            
        print(json.dumps({
            "success": True,
            "message": "PDF extraction completed successfully"
        }))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "message": str(e)
        }))

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({
            "success": False,
            "message": "Missing arguments. Usage: python pdf_extractor.py <pdf_path> <output_path> [extract_type]"
        }))
    else:
        pdf_path = sys.argv[1]
        output_path = sys.argv[2]
        extract_type = sys.argv[3] if len(sys.argv) > 3 else 'text'
        extract_pdf(pdf_path, output_path, extract_type) 