#!/usr/bin/env python3
"""
RAGAS API 테스트 스크립트
"""
import requests
import json
import sys

def test_api():
    """RAGAS API 서버 테스트"""
    base_url = "http://localhost:8001"
    
    # 1. 서버 상태 확인
    try:
        response = requests.get(f"{base_url}/")
        print(f"서버 상태: {response.status_code}")
        print(response.json())
        print("-" * 50)
    except requests.exceptions.ConnectionError:
        print("서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.")
        sys.exit(1)
    
    # 2. 메트릭 정보 확인
    try:
        response = requests.get(f"{base_url}/metrics/info")
        print("지원되는 메트릭 정보:")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        print("-" * 50)
    except Exception as e:
        print(f"메트릭 정보 확인 중 오류 발생: {e}")
    
    # 3. 평가 테스트
    try:
        test_data = {
            "user_input": "When was the first super bowl?",
            "response": "The first superbowl was held on Jan 15, 1967",
            "retrieved_contexts": [
                "The First AFL–NFL World Championship Game was an American football game played on January 15, 1967, at the Los Angeles Memorial Coliseum in Los Angeles."
            ],
            "metrics": ["answer_relevancy", "faithfulness"]
        }
        
        print("평가 요청 데이터:")
        print(json.dumps(test_data, indent=2))
        
        response = requests.post(
            f"{base_url}/evaluate",
            json=test_data
        )
        
        print(f"평가 응답 상태: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("평가 결과:")
            print(json.dumps(result, indent=2))
        else:
            print(f"오류 응답: {response.text}")
    except Exception as e:
        print(f"평가 테스트 중 오류 발생: {e}")

if __name__ == "__main__":
    test_api() 