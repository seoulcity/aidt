#!/bin/bash

# 함수 정의: 재귀적으로 모든 파일을 cat 하는 함수
cat_recursive() {
    local file="$1"

    # 파일인 경우에만 실행
    if [ -f "$file" ]; then
        # 파일 내용을 출력하고 두 줄 띄우기
        cat "$file"
        echo -e "\n\n"
    # 디렉토리인 경우에는 재귀적으로 하위 파일에 대해 cat_recursive 함수 호출
    elif [ -d "$file" ]; then
        # 디렉토리 내의 모든 파일에 대해 반복
        for item in "$file"/*
        do
            # 재귀적으로 하위 파일에 대해 cat_recursive 함수 호출
            cat_recursive "$item"
        done
    fi
}

# 현재 디렉토리를 기준으로 routes/ 디렉토리 경로 설정
routes_dir="$(pwd)/src/routes/"

# routes/ 디렉토리 내의 모든 파일에 대해 cat_recursive 함수 호출
for item in "$routes_dir"*
do
    cat_recursive "$item"
done
