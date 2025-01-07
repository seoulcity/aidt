#!/bin/bash

# run.sh

# 스크립트가 있는 디렉토리로 이동
cd "$(dirname "$0")"

# FastAPI 서버 실행 (백그라운드)
cd src/python
pm2 start run_server.sh --name "fastapi-server"
cd ../..  # 원래 디렉토리로 복귀

# Next.js 앱 실행
pm2 start npm --name "english-app" -- run dev

# 주석 처리된 유용한 명령어들
# pm2 list  # 프로세스 목록
# pm2 logs  # 로그 확인
# pm2 monit  # 모니터링 대시보드
# pm2 restart english-app  # Next.js 앱 재시작
# pm2 restart fastapi-server  # FastAPI 서버 재시작
# pm2 delete english-app  # Next.js 앱 프로세스 삭제
# pm2 delete fastapi-server  # FastAPI 서버 프로세스 삭제
# pm2 delete all  # 모든 프로세스 삭제