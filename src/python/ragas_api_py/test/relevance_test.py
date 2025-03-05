# src/python/ragas_api_py/test/relevance_test.py
import os
import asyncio
from typing import List, Optional

# RAGAS 관련 임포트
from ragas.metrics import AnswerRelevancy
from ragas.llms import LangchainLLMWrapper
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from ragas import SingleTurnSample

# OpenAI API 키 설정 (실제 사용 시 본인의 API 키로 변경)
os.environ["OPENAI_API_KEY"] = "your_openai_api_key_here"

async def evaluate_answer_relevancy(
    user_input: str,
    response: str,
    retrieved_contexts: Optional[List[str]] = None
) -> float:
    """
    RAGAS의 answer_relevancy 메트릭을 사용하여 응답을 평가합니다.
    
    Args:
        user_input: 사용자 질문
        response: 생성된 응답
        retrieved_contexts: 검색된 컨텍스트 목록 (선택 사항)
        
    Returns:
        answer_relevancy 점수 (0-1 사이의 값)
    """
    # LLM 및 임베딩 모델 초기화
    llm = ChatOpenAI(temperature=0, model="gpt-3.5-turbo")
    llm_wrapper = LangchainLLMWrapper(llm)
    embeddings = OpenAIEmbeddings()
    
    # answer_relevancy 메트릭 초기화
    answer_relevancy_metric = AnswerRelevancy(llm=llm_wrapper, embeddings=embeddings)
    
    # 컨텍스트가 없는 경우 빈 리스트로 설정
    contexts = retrieved_contexts if retrieved_contexts else []
    
    # RAGAS 샘플 생성
    sample = SingleTurnSample(
        user_input=user_input,
        response=response,
        retrieved_contexts=contexts
    )
    
    # answer_relevancy 평가 수행
    try:
        score = await answer_relevancy_metric.single_turn_ascore(sample)
        return float(score)
    except Exception as e:
        print(f"Error evaluating answer_relevancy: {e}")
        return -1

# 예시 테스트 코드
async def test_examples():
    # 테스트 예시들
    examples = [
        {
            "name": "관련성 높은 응답",
            "user_input": "When was the first Super Bowl?",
            "response": "The first Super Bowl was held on January 15, 1967, at the Los Angeles Memorial Coliseum in Los Angeles, California."
        },
        {
            "name": "관련성 중간 응답",
            "user_input": "What is the capital of France?",
            "response": "France is a country in Western Europe with many historic cities. Its capital is Paris."
        },
        {
            "name": "관련성 낮은 응답",
            "user_input": "What is the capital of France?",
            "response": "France is a country in Western Europe known for its art, culture, and cuisine."
        },
        {
            "name": "완전히 관련 없는 응답",
            "user_input": "What is the capital of France?",
            "response": "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France."
        }
    ]
    
    print("===== Answer Relevancy 메트릭 테스트 =====")
    print("이 메트릭은 질문과 응답 간의 관련성을 평가합니다.\n")
    
    for example in examples:
        print(f"예시: {example['name']}")
        print(f"질문: {example['user_input']}")
        print(f"응답: {example['response']}")
        
        score = await evaluate_answer_relevancy(
            user_input=example['user_input'],
            response=example['response']
        )
        
        print(f"Answer Relevancy 점수: {score:.4f}")
        
        # 점수 해석
        if score >= 0.8:
            interpretation = "매우 높음 (질문에 직접적으로 관련된 응답)"
        elif score >= 0.6:
            interpretation = "높음 (질문과 관련된 응답)"
        elif score >= 0.4:
            interpretation = "중간 (질문과 부분적으로 관련된 응답)"
        elif score >= 0.2:
            interpretation = "낮음 (질문과 간접적으로 관련된 응답)"
        else:
            interpretation = "매우 낮음 (질문과 관련 없는 응답)"
            
        print(f"해석: {interpretation}")
        print("-" * 50)

# 직접 실행 시 테스트 예시 실행
if __name__ == "__main__":
    asyncio.run(test_examples())
