# src/python/ragas_api_py/test/faithfullness_test.py
import os
import asyncio
from typing import List

# RAGAS 관련 임포트
from ragas.metrics import Faithfulness
from ragas.llms import LangchainLLMWrapper
from langchain_openai import ChatOpenAI
from ragas import SingleTurnSample

# OpenAI API 키 설정 (실제 사용 시 본인의 API 키로 변경)
os.environ["OPENAI_API_KEY"] = "your_openai_api_key_here"

async def evaluate_faithfulness(
    user_input: str,
    response: str,
    retrieved_contexts: List[str]
) -> float:
    """
    RAGAS의 faithfulness 메트릭을 사용하여 응답을 평가합니다.
    
    Args:
        user_input: 사용자 질문
        response: 생성된 응답
        retrieved_contexts: 검색된 컨텍스트 목록 (필수)
        
    Returns:
        faithfulness 점수 (0-1 사이의 값)
    """
    # LLM 초기화
    llm = ChatOpenAI(temperature=0, model="gpt-3.5-turbo")
    llm_wrapper = LangchainLLMWrapper(llm)
    
    # faithfulness 메트릭 초기화
    faithfulness_metric = Faithfulness(llm=llm_wrapper)
    
    # RAGAS 샘플 생성
    sample = SingleTurnSample(
        user_input=user_input,
        response=response,
        retrieved_contexts=retrieved_contexts
    )
    
    # faithfulness 평가 수행
    try:
        score = await faithfulness_metric.single_turn_ascore(sample)
        return float(score)
    except Exception as e:
        print(f"Error evaluating faithfulness: {e}")
        return -1

# 예시 테스트 코드
async def test_examples():
    # 테스트 예시들
    examples = [
        {
            "name": "충실도 높은 응답",
            "user_input": "When was the first Super Bowl?",
            "response": "The first Super Bowl was held on January 15, 1967, at the Los Angeles Memorial Coliseum.",
            "contexts": [
                "The First AFL–NFL World Championship Game was an American football game played on January 15, 1967, at the Los Angeles Memorial Coliseum in Los Angeles, California.",
                "The game is now known as Super Bowl I, though the term 'Super Bowl' was not used until Super Bowl III."
            ]
        },
        {
            "name": "부분적으로 충실한 응답",
            "user_input": "What is the capital of France and when did the Eiffel Tower open?",
            "response": "The capital of France is Paris. The Eiffel Tower opened on March 31, 1889 and was built for the 1900 World's Fair.",
            "contexts": [
                "Paris is the capital and most populous city of France.",
                "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. It was constructed from 1887 to 1889 as the entrance to the 1889 World's Fair."
            ]
        },
        {
            "name": "충실도 낮은 응답 (사실과 다른 정보 포함)",
            "user_input": "Who wrote the novel 'Pride and Prejudice'?",
            "response": "The novel 'Pride and Prejudice' was written by Charlotte Brontë in 1847.",
            "contexts": [
                "Jane Austen's 'Pride and Prejudice' was published in 1813 and is one of the most popular novels in English literature.",
                "Charlotte Brontë wrote 'Jane Eyre' which was published in 1847."
            ]
        },
        {
            "name": "완전히 충실하지 않은 응답",
            "user_input": "What is the height of Mount Everest?",
            "response": "Mount Everest is the tallest mountain in the world with a height of 9,849 meters (32,808 feet).",
            "contexts": [
                "Mount Everest is Earth's highest mountain above sea level, located in the Mahalangur Himal sub-range of the Himalayas.",
                "The elevation of 8,848.86 metres (29,031.7 ft) was officially recognised by China and Nepal in 2020."
            ]
        }
    ]
    
    print("===== Faithfulness 메트릭 테스트 =====")
    print("이 메트릭은 응답이 제공된 컨텍스트에 얼마나 충실한지 평가합니다.\n")
    
    for example in examples:
        print(f"예시: {example['name']}")
        print(f"질문: {example['user_input']}")
        print(f"응답: {example['response']}")
        print("컨텍스트:")
        for i, ctx in enumerate(example['contexts'], 1):
            print(f"  {i}. {ctx}")
        
        score = await evaluate_faithfulness(
            user_input=example['user_input'],
            response=example['response'],
            retrieved_contexts=example['contexts']
        )
        
        print(f"Faithfulness 점수: {score:.4f}")
        
        # 점수 해석
        if score >= 0.8:
            interpretation = "매우 높음 (응답의 모든 주장이 컨텍스트에서 지원됨)"
        elif score >= 0.6:
            interpretation = "높음 (응답의 대부분 주장이 컨텍스트에서 지원됨)"
        elif score >= 0.4:
            interpretation = "중간 (응답의 일부 주장만 컨텍스트에서 지원됨)"
        elif score >= 0.2:
            interpretation = "낮음 (응답의 소수 주장만 컨텍스트에서 지원됨)"
        else:
            interpretation = "매우 낮음 (응답의 주장이 컨텍스트에서 지원되지 않음)"
            
        print(f"해석: {interpretation}")
        print("-" * 50)

# 직접 실행 시 테스트 예시 실행
if __name__ == "__main__":
    asyncio.run(test_examples())
