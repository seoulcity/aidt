#!/bin/bash

# 가상환경이 없다면 생성
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# 가상환경 활성화
source venv/bin/activate

# 필요한 패키지 설치
echo "Installing required packages..."
pip install -r requirements.txt

# 서버 실행 (timeout 설정 추가)
echo "Starting FastAPI server..."
uvicorn server:app --host 0.0.0.0 --port 8000 --reload --timeout-keep-alive 65 --log-level info