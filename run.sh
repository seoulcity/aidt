#!/bin/bash

# run.sh

# 현재 디렉토리에서 npm run dev 실행
cd "$(dirname "$0")"  # 스크립트가 있는 디렉토리로 이동
pm2 start npm --name "english-app" -- run dev

# 주석 처리된 유용한 명령어들
# pm2 list  # 프로세스 목록
# pm2 logs  # 로그 확인
# pm2 monit  # 모니터링 대시보드
# pm2 restart english-app  # 재시작
# pm2 delete english-app  # 프로세스 삭제