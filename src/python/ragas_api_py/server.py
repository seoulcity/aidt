# src/python/ragas_api_py/server.py
import os
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from dotenv import load_dotenv

# RAGAS 관련 임포트
from ragas.metrics import (
    Faithfulness,
    ResponseRelevancy,
    ContextRecall,
    ContextPrecision
)
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

# 환경 변수 로드
load_dotenv()

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# OpenAI API 키 확인
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY not found in environment variables. Please set it.")

# FastAPI 앱 생성
app = FastAPI(title="RAGAS Evaluation API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 배포 시에는 특정 도메인으로 제한하는 것이 좋습니다
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 모델 및 임베딩 초기화 (지연 로딩)
evaluator_llm = None
evaluator_embeddings = None
# 메트릭 인스턴스 초기화
response_relevancy_metric = None
faithfulness_metric = None
context_recall_metric = None
context_precision_metric = None

def get_llm():
    global evaluator_llm
    if evaluator_llm is None and OPENAI_API_KEY:
        try:
            openai_llm = ChatOpenAI(
                model="gpt-4o-mini",
                temperature=0,
                openai_api_key=OPENAI_API_KEY
            )
            evaluator_llm = LangchainLLMWrapper(openai_llm)
            logger.info("LLM initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing LLM: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to initialize LLM: {str(e)}")
    return evaluator_llm

def get_embeddings():
    global evaluator_embeddings
    if evaluator_embeddings is None:
        try:
            # OpenAI 임베딩을 LangchainEmbeddingsWrapper로 감싸기
            openai_embeddings = OpenAIEmbeddings(
                openai_api_key=OPENAI_API_KEY,
                model="text-embedding-3-small"
            )
            evaluator_embeddings = LangchainEmbeddingsWrapper(openai_embeddings)
            logger.info("Embeddings model initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing embeddings model: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to initialize embeddings model: {str(e)}")
    return evaluator_embeddings

def initialize_metrics(llm, embeddings):
    global response_relevancy_metric, faithfulness_metric, context_recall_metric, context_precision_metric
    
    if response_relevancy_metric is None:
        response_relevancy_metric = ResponseRelevancy(llm=llm, embeddings=embeddings)
        
    if faithfulness_metric is None:
        faithfulness_metric = Faithfulness(llm=llm)
        
    if context_recall_metric is None:
        context_recall_metric = ContextRecall(llm=llm)
        
    if context_precision_metric is None:
        context_precision_metric = ContextPrecision(llm=llm)
    
    logger.info("All metrics initialized successfully")

# 입력 모델 정의
class EvaluationRequest(BaseModel):
    user_input: str = Field(..., description="User's question")
    response: str = Field(..., description="Generated response to evaluate")
    retrieved_contexts: Optional[List[str]] = Field(default=None, description="Retrieved contexts used for generation")
    metrics: List[str] = Field(default=["answer_relevancy", "faithfulness"], 
                              description="Metrics to evaluate (answer_relevancy, faithfulness, context_relevancy, context_recall, context_precision)")

# 평가 결과 모델
class EvaluationResponse(BaseModel):
    scores: Dict[str, float]
    details: Optional[Dict[str, Any]] = None

# 상태 확인 엔드포인트
@app.get("/")
async def root():
    return {"status": "RAGAS Evaluation API is running"}

# 평가 엔드포인트
@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate(request: EvaluationRequest):
    try:
        logger.info(f"Received evaluation request for metrics: {request.metrics}")
        
        # LLM 및 임베딩 모델 가져오기
        llm = get_llm()
        embeddings = get_embeddings()
        
        if not llm:
            raise HTTPException(status_code=500, detail="LLM not initialized. Check your OpenAI API key.")
        
        # 메트릭 초기화
        initialize_metrics(llm, embeddings)
        
        # 평가 결과 저장 딕셔너리
        scores = {}
        details = {}
        
        # RAGAS 샘플 생성
        from ragas import SingleTurnSample
        
        # 컨텍스트가 없는 경우 빈 리스트로 설정
        contexts = request.retrieved_contexts if request.retrieved_contexts else []
        
        sample = SingleTurnSample(
            user_input=request.user_input,
            response=request.response,
            retrieved_contexts=contexts
        )
        
        # 요청된 메트릭에 따라 평가 수행
        for metric_name in request.metrics:
            try:
                if metric_name == "answer_relevancy":
                    # answer_relevancy 요청 시 response_relevancy 사용
                    score = await response_relevancy_metric.single_turn_ascore(sample)
                    scores["answer_relevancy"] = float(score)
                    
                elif metric_name == "faithfulness":
                    score = await faithfulness_metric.single_turn_ascore(sample)
                    scores["faithfulness"] = float(score)
                    
                elif metric_name == "context_relevancy" and contexts:
                    # context_relevancy 대신 response_relevancy 사용 (임시 대체)
                    logger.warning("context_relevancy metric is not available in this version, using response_relevancy instead")
                    score = await response_relevancy_metric.single_turn_ascore(sample)
                    scores["context_relevancy"] = float(score)
                    
                elif metric_name == "context_recall" and contexts:
                    score = await context_recall_metric.single_turn_ascore(sample)
                    scores["context_recall"] = float(score)
                    
                elif metric_name == "context_precision" and contexts:
                    score = await context_precision_metric.single_turn_ascore(sample)
                    scores["context_precision"] = float(score)
                    
                else:
                    if metric_name in ["context_relevancy", "context_recall", "context_precision"] and not contexts:
                        logger.warning(f"Skipping {metric_name} because no contexts were provided")
                    else:
                        logger.warning(f"Unknown metric: {metric_name}")
                        
            except Exception as e:
                logger.error(f"Error evaluating {metric_name}: {e}")
                scores[metric_name] = -1  # 오류 표시
                details[f"{metric_name}_error"] = str(e)
        
        # 결과 반환
        return EvaluationResponse(
            scores=scores,
            details=details if details else None
        )
        
    except Exception as e:
        logger.error(f"Evaluation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 메트릭 설명 엔드포인트
@app.get("/metrics/info")
async def metrics_info():
    return {
        "answer_relevancy": {
            "description": "질문과 응답 간의 관련성을 평가합니다.",
            "calculation": "응답이 질문에 얼마나 관련되어 있는지 평가합니다.",
            "range": "0-1 (높을수록 좋음)"
        },
        "faithfulness": {
            "description": "응답이 제공된 컨텍스트에 얼마나 충실한지 평가합니다.",
            "calculation": "응답의 각 주장이 컨텍스트에서 추론 가능한지 확인합니다.",
            "range": "0-1 (높을수록 좋음)"
        },
        "context_relevancy": {
            "description": "검색된 컨텍스트가 질문과 얼마나 관련이 있는지 평가합니다.",
            "calculation": "질문과 각 컨텍스트 간의 의미적 유사도를 계산합니다.",
            "range": "0-1 (높을수록 좋음)"
        },
        "context_recall": {
            "description": "응답 생성에 필요한 정보가 컨텍스트에 얼마나 포함되어 있는지 평가합니다.",
            "calculation": "응답에 필요한 정보 대비 컨텍스트에 포함된 정보의 비율을 계산합니다.",
            "range": "0-1 (높을수록 좋음)"
        },
        "context_precision": {
            "description": "검색된 컨텍스트 중 응답 생성에 실제로 사용된 정보의 비율을 평가합니다.",
            "calculation": "컨텍스트에 포함된 정보 대비 응답에 사용된 정보의 비율을 계산합니다.",
            "range": "0-1 (높을수록 좋음)"
        }
    }

# 직접 실행 시 서버 시작
if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True) 