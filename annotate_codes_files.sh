#!/bin/bash

# 프로젝트 루트 디렉토리 경로
project_root=$(pwd)

# 루트 디렉토리에 있는 파일들에 대해 주석 추가 또는 업데이트
for file in $(find "$project_root" -maxdepth 1 -type f \( -iname "*.js" -o -iname "*.svelte" -o -iname "*.html" -o -iname "*.css" \)); do
  file_path="${file#$project_root/}"  # 파일 경로에서 프로젝트 루트 경로 제거
  
  if [[ $file =~ \.(svelte|html)$ ]]; then
    # Svelte 및 HTML 파일의 경우
    if grep -q "<!--.*-->" "$file"; then
      # 기존 주석이 있는 경우 주석 업데이트
      sed -i "1s;<!-- .* -->;<!-- $file_path -->;" "$file"
    else
      # 기존 주석이 없는 경우 주석 추가
      sed -i "1s;^;<!-- $file_path -->\\n;" "$file"
    fi
  elif [[ $file =~ \.(js|JS)$ ]]; then
    # 자바스크립트 파일의 경우
    if grep -q "//.*" "$file"; then
      # 기존 주석이 있는 경우 주석 업데이트
      sed -i "1s;// .*;// $file_path;" "$file"
    else
      # 기존 주석이 없는 경우 주석 추가
      sed -i "1s;^;// $file_path\\n;" "$file"
    fi
  elif [[ $file =~ \.(css|CSS)$ ]]; then
    # CSS 파일의 경우
    if grep -q "/\*.*\*/" "$file"; then
      # 기존 주석이 있는 경우 주석 업데이트
      sed -i "1s;/\* .* \*/;/* $file_path */;" "$file"
    else
      # 기존 주석이 없는 경우 주석 추가
      sed -i "1s;^;/* $file_path */\\n;" "$file"
    fi
  fi
done

# src 디렉토리 경로
src_dir="$project_root/src"

# src 디렉토리 이하의 모든 소스코드 파일에 대해 주석 추가 또는 업데이트
for file in $(find "$src_dir" -type f \( -iname "*.js" -o -iname "*.svelte" -o -iname "*.html" -o -iname "*.css" \)); do
  file_path="src/${file#$src_dir/}"  # 파일 경로에 src/ 추가
  
  if [[ $file =~ \.(svelte|html)$ ]]; then
    # Svelte 및 HTML 파일의 경우
    if grep -q "<!--.*-->" "$file"; then
      # 기존 주석이 있는 경우 주석 업데이트
      sed -i "1s;<!-- .* -->;<!-- $file_path -->;" "$file"
    else
      # 기존 주석이 없는 경우 주석 추가
      sed -i "1s;^;<!-- $file_path -->\\n;" "$file"
    fi
  elif [[ $file =~ \.(js|JS)$ ]]; then
    # 자바스크립트 파일의 경우
    if grep -q "//.*" "$file"; then
      # 기존 주석이 있는 경우 주석 업데이트
      sed -i "1s;// .*;// $file_path;" "$file"
    else
      # 기존 주석이 없는 경우 주석 추가
      sed -i "1s;^;// $file_path\\n;" "$file"
    fi
  elif [[ $file =~ \.(css|CSS)$ ]]; then
    # CSS 파일의 경우
    if grep -q "/\*.*\*/" "$file"; then
      # 기존 주석이 있는 경우 주석 업데이트
      sed -i "1s;/\* .* \*/;/* $file_path */;" "$file"
    else
      # 기존 주석이 없는 경우 주석 추가
      sed -i "1s;^;/* $file_path */\\n;" "$file"
    fi
  fi
done