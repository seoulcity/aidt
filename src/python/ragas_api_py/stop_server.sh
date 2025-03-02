#!/bin/bash

# PID 파일이 있는지 확인
if [ -f "ragas_server.pid" ]; then
    PID=$(cat ragas_server.pid)
    echo "Stopping RAGAS API server with PID: $PID"
    
    # 프로세스 종료
    kill $PID
    
    # PID 파일 삭제
    rm ragas_server.pid
    
    echo "Server stopped successfully."
else
    # PID 파일이 없는 경우 uvicorn 프로세스 찾아서 종료
    echo "PID file not found. Trying to find uvicorn process..."
    PID=$(pgrep -f "uvicorn server:app")
    
    if [ -n "$PID" ]; then
        echo "Found uvicorn process with PID: $PID"
        kill $PID
        echo "Server stopped successfully."
    else
        echo "No running RAGAS API server found."
    fi
fi 