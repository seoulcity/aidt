# src/python/ragas_api_py/test/simple_evaluation_test.py
import os
import asyncio
from typing import List, Dict, Any
from datasets import Dataset

# RAGAS 관련 임포트
from ragas import evaluate

# OpenAI API 키 설정 (실제 사용 시 본인의 API 키로 변경)
os.environ["OPENAI_API_KEY"] = "your_openai_api_key_here"

async def run_simple_evaluation() -> Dict[str, float]:
    """
    RAGAS의 evaluate 함수를 사용하여 간단하게 평가를 수행합니다.
    
    Returns:
        평가 결과 (context_precision, faithfulness, answer_relevancy 점수)
    """
    # 테스트 데이터 생성
    question = "강의료 기준을 알려줘"
    
    answer = """2023년과 2024년 중등 인사실무 매뉴얼을 바탕으로 강사 수당 지급 기준은 다음과 같습니다.

- 일반 강사: 대학 전임강사 이상, 대(중소)기업•국영기업•공사의 임원(이사급 이상), 판•검사, 변호사, 변리사, 의사, 공인 회계사, 기술사 등 자격(면허)증 소지자, 정부 출연 연구기관 연구원, 문화.예술 등 특별분야의 전문강사, 4급 이상의 공무원, 24호봉 이상 교육공무원, 박사학위학업를 소지한 5급 공무성적관리는 학교원, 해당분야 전문가로별로 학업성적관리위원회 특별 및 일반 2-를 의무적으로 설치・3급, 보조강사,운영하여 관리합니다. 
 다수인강사 이외의 강사
학업성적관리위원는 기본 160, 초과 90회는 학교 학업성적관리의 수당을 받습니다.
규정 제・개정, 교사
- 특별 강사: 해당별 평가 계획, 행동특성분야의 권위자로 원장 및 종합의견의 평가이 인정하는 자는 기본 300 항목 및 방법, 학업성적 평가 및 관리의, 초과 200의 수당을 객관성・공정성・ 받습니다. 교육운영상 기관투명성과 신뢰도 제고 방안장이 특히 인정하는 경우, 등을 심의합니다. 또한 시간당 50만원 이내에서 학교생활기록부의 기재 내용 지급 가능합니다.

 및 기재 방법, 자료- 대학 시간강사, 대의 정정 등에 관한 사항(중소)기업•국과 학교생활기록부의 학영기업•공사의 직원적(전입, 편입,으로 1급에 해당하지 유예, 면제 등)과 않는 자, 5급 공무 관련된 사항, 원격수업원, 16/~23호 중 평가에 관한 사항 등봉의 교육공무원,을 다룹니다.
 박사학위를 소지한 6
학업성적관리위원급 이하 공무원, 외국회는 학기별 1회인(원어민)강사 이상 정기 개최하며, 학기는 기본 90, 초과 60별 '학업성적관리의 수당을 받습니다.
규정' 연수를 실시합니다
- 전•현직. 또한 학업성적관리위원 장•차관, 전•회의 심의사항은 회의록 작성 및 내부결재를 통해 관리현직 국회의원, 전됩니다."""
    
    # 검색된 컨텍스트 (실제 사용 시 관련 문서에서 검색된 내용으로 대체)
    contexts = [
        """2023년 중등 인사실무 매뉴얼에 따르면 강사 수당 지급 기준은 다음과 같습니다:
        - 일반 강사: 대학 전임강사 이상, 대기업 임원, 판검사, 변호사 등 전문직은 기본 160,000원, 초과 90,000원
        - 특별 강사: 해당 분야 권위자는 기본 300,000원, 초과 200,000원, 특별 인정 시 시간당 50만원 이내
        - 일반 강사 외: 대학 시간강사, 기업 직원 등은 기본 90,000원, 초과 60,000원""",
        
        """학교 학업성적관리위원회는 학교별로 의무적으로 설치·운영해야 합니다. 주요 역할은 학업성적관리 규정 제·개정, 
        평가 계획, 평가 항목 및 방법, 성적 평가 및 관리의 객관성·공정성·투명성과 신뢰도 제고 방안, 
        학교생활기록부 기재 내용 및 방법, 자료의 정정 등에 관한 사항을 심의합니다.""",
        
        """2024년 중등 인사실무 매뉴얼에 따르면 강사료 지급 기준은 전년과 동일하며, 
        학업성적관리위원회는 학기별 1회 이상 정기 개최하고, 학기별 '학업성적관리규정' 연수를 실시해야 합니다. 
        위원회 심의사항은 회의록 작성 및 내부결재를 통해 관리됩니다."""
    ]
    
    # 정답 (ground truth) - 실제 사용 시 정확한 정답으로 대체
    ground_truth = """강사 수당 지급 기준은 다음과 같습니다:
    - 일반 강사(대학 전임강사 이상, 전문직 등): 기본 160,000원, 초과 90,000원
    - 특별 강사(해당 분야 권위자): 기본 300,000원, 초과 200,000원
    - 일반 강사 외(대학 시간강사 등): 기본 90,000원, 초과 60,000원"""
    
    # 데이터셋 생성
    data = {
        "question": [question],
        "answer": [answer],
        "contexts": [contexts],
        "ground_truth": [ground_truth]
    }
    
    dataset = Dataset.from_dict(data)
    
    # RAGAS 평가 실행
    result = evaluate(dataset)
    
    # 결과를 딕셔너리로 변환
    metrics = {}
    for metric_name in result:
        # 각 메트릭의 첫 번째 값을 가져옴 (단일 샘플이므로)
        if len(result[metric_name]) > 0:
            metrics[metric_name] = float(result[metric_name][0])
        else:
            metrics[metric_name] = 0.0
    
    # 결과 출력
    print(result)
    
    return metrics

async def test_with_your_example():
    """
    사용자가 제공한 예시로 테스트를 실행합니다.
    """
    result = await run_simple_evaluation()
    print("평가 결과:")
    print(f"Context Precision: {result['context_precision']:.4f}")
    print(f"Faithfulness: {result['faithfulness']:.4f}")
    print(f"Answer Relevancy: {result['answer_relevancy']:.4f}")
    if 'context_recall' in result:
        print(f"Context Recall: {result['context_recall']:.4f}")

if __name__ == "__main__":
    asyncio.run(test_with_your_example()) 