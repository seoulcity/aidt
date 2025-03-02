# RAGAS Evaluation API

RAGAS(Retrieval Augmented Generation Assessment) 평가를 위한 API 서버입니다.

## 설치 및 실행

1. 환경 설정:
   ```bash
   # .env.example 파일을 .env로 복사하고 OpenAI API 키 설정
   cp .env.example .env
   # .env 파일을 편집하여 OPENAI_API_KEY 값을 설정
   ```

2. 서버 실행:
   ```bash
   # 실행 권한 부여
   chmod +x run_server.sh
   
   # 서버 실행
   ./run_server.sh
   ```

## API 엔드포인트

### 1. 상태 확인

- **URL**: `/`
- **Method**: `GET`
- **Response**: 서버 상태 정보

### 2. 평가 수행

- **URL**: `/evaluate`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "user_input": "사용자 질문",
    "response": "생성된 응답",
    "retrieved_contexts": ["컨텍스트1", "컨텍스트2", ...],
    "metrics": ["answer_relevancy", "faithfulness", ...]
  }
  ```
- **Response**:
  ```json
  {
    "scores": {
      "answer_relevancy": 0.92,
      "faithfulness": 0.85,
      ...
    },
    "details": { ... }
  }
  ```

### 3. 메트릭 정보

- **URL**: `/metrics/info`
- **Method**: `GET`
- **Response**: 지원되는 메트릭에 대한 설명 정보

## 지원되는 메트릭

1. **answer_relevancy**: 질문과 응답 간의 관련성을 평가
2. **faithfulness**: 응답이 제공된 컨텍스트에 얼마나 충실한지 평가
3. **context_relevancy**: 검색된 컨텍스트가 질문과 얼마나 관련이 있는지 평가
4. **context_recall**: 응답 생성에 필요한 정보가 컨텍스트에 얼마나 포함되어 있는지 평가
5. **context_precision**: 검색된 컨텍스트 중 응답 생성에 실제로 사용된 정보의 비율을 평가

## 사용 예시

```python
import requests

response = requests.post(
    "http://localhost:8001/evaluate",
    json={
        "user_input": "When was the first super bowl?",
        "response": "The first superbowl was held on Jan 15, 1967",
        "retrieved_contexts": [
            "The First AFL–NFL World Championship Game was an American football game played on January 15, 1967, at the Los Angeles Memorial Coliseum in Los Angeles."
        ],
        "metrics": ["answer_relevancy", "faithfulness"]
    }
)

print(response.json())
``` 