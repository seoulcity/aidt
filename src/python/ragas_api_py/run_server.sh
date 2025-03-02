#!/bin/bash

# 이미 실행 중인지 확인
if [ -f "ragas_server.pid" ]; then
    PID=$(cat ragas_server.pid)
    if ps -p $PID > /dev/null; then
        echo "RAGAS API server is already running with PID: $PID"
        echo "To stop the server, run: ./stop_server.sh"
        exit 1
    else
        # PID 파일은 있지만 프로세스가 없는 경우
        echo "Removing stale PID file..."
        rm ragas_server.pid
    fi
fi

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

# 서버 실행 (port 8001로 설정)
echo "Starting RAGAS API server on port 8001 in background..."
nohup uvicorn server:app --host 0.0.0.0 --port 8001 --reload --timeout-keep-alive 65 --log-level info > ragas_server.log 2>&1 &

# 프로세스 ID 저장 및 출력
PID=$!
echo $PID > ragas_server.pid
echo "Server started with PID: $PID"
echo "To stop the server, run: ./stop_server.sh"
echo "To view server logs, run: tail -f ragas_server.log" 