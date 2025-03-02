# RAGAS API 서버 설정 및 사용 가이드

이 가이드는 RAGAS API 서버를 설정하고 사용하는 방법을 설명합니다.

## 1. 사전 요구사항

- Python 3.7 이상
- OpenAI API 키
- pip (Python 패키지 관리자)

## 2. 초기 설정

### 2.1 환경 설정

1. `.env.example` 파일을 `.env`로 복사합니다:
   ```bash
   cp .env.example .env
   ```

2. `.env` 파일을 편집하여 OpenAI API 키를 설정합니다:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### 2.2 실행 권한 설정

실행 스크립트에 실행 권한을 부여합니다:
```bash
chmod +x run_server.sh
chmod +x test_api.py
```

## 3. 서버 실행

서버를 실행하려면 다음 명령을 사용합니다:
```bash
./run_server.sh
```

이 스크립트는 다음 작업을 수행합니다:
1. 가상 환경 생성 (없는 경우)
2. 가상 환경 활성화
3. 필요한 패키지 설치
4. FastAPI 서버 실행 (포트 8001)

서버가 성공적으로 시작되면 다음과 같은 메시지가 표시됩니다:
```
INFO:     Started server process [xxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
```

## 4. API 테스트

서버가 올바르게 실행되고 있는지 확인하려면 테스트 스크립트를 실행합니다:
```bash
./test_api.py
```

이 스크립트는 다음을 테스트합니다:
1. 서버 상태 확인
2. 지원되는 메트릭 정보 가져오기
3. 샘플 데이터로 평가 수행

## 5. 프론트엔드 연동

프론트엔드 애플리케이션은 이미 `http://localhost:8001/evaluate` 엔드포인트를 호출하도록 설정되어 있습니다. 서버가 실행 중이면 프론트엔드에서 RAGAS 테스트 버튼을 클릭하여 평가를 수행할 수 있습니다.

## 6. API 엔드포인트 상세 정보

### 6.1 상태 확인

- **URL**: `/`
- **Method**: `GET`
- **Response**: 서버 상태 정보

### 6.2 평가 수행

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

### 6.3 메트릭 정보

- **URL**: `/metrics/info`
- **Method**: `GET`
- **Response**: 지원되는 메트릭에 대한 설명 정보

## 7. 지원되는 메트릭

1. **answer_relevancy**: 질문과 응답 간의 관련성을 평가합니다. 질문에 직접적으로 관련된 응답일수록 높은 점수를 받습니다.

2. **faithfulness**: 응답이 제공된 컨텍스트에 얼마나 충실한지 평가합니다. 응답의 모든 주장이 컨텍스트에서 지원되는 경우 높은 점수를 받습니다.

3. **context_relevancy**: 검색된 컨텍스트가 질문과 얼마나 관련이 있는지 평가합니다. 질문과 관련성이 높은 컨텍스트일수록 높은 점수를 받습니다.

4. **context_recall**: 응답 생성에 필요한 정보가 컨텍스트에 얼마나 포함되어 있는지 평가합니다. 응답에 필요한 모든 정보가 컨텍스트에 포함된 경우 높은 점수를 받습니다.

5. **context_precision**: 검색된 컨텍스트 중 응답 생성에 실제로 사용된 정보의 비율을 평가합니다. 컨텍스트의 대부분이 응답 생성에 사용된 경우 높은 점수를 받습니다.

## 8. 문제 해결

### 8.1 서버가 시작되지 않는 경우

- OpenAI API 키가 올바르게 설정되었는지 확인합니다.
- 필요한 패키지가 모두 설치되었는지 확인합니다.
- 포트 8001이 이미 사용 중인지 확인합니다.

### 8.2 평가 오류

- 요청 형식이 올바른지 확인합니다.
- OpenAI API 키가 유효한지 확인합니다.
- 컨텍스트 기반 메트릭의 경우 `retrieved_contexts`가 제공되었는지 확인합니다.

## 9. 추가 리소스

- [RAGAS 공식 문서](https://docs.ragas.io/)
- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [OpenAI API 문서](https://platform.openai.com/docs/api-reference) 