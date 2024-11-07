// src/lib/pressReleaseChain.js
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { chatCompletion } from './clovaStudioService';

const INITIAL_VALIDATION_TEMPLATE = `당신은 보도자료 작성을 위한 전문 에이전트입니다.
이전 대화 내용을 포함하여 사용자의 입력을 분석하고, 보도자료 작성에 필요한 핵심 정보 중 가장 중요하게 부족한 한 가지 정보를 확인해야 합니다.

필수 정보:
1. 보도자료의 주제/제목
2. 주요 내용 (What)
3. 시기 (When)
4. 장소 (Where)
5. 관련 조직/인물 (Who)
6. 목적/의의 (Why)

지금까지의 대화 내용:
{conversationHistory}

현재 사용자 입력: {userInput}

다음 형식으로 응답해주세요:

분석 결과:
[현재까지 수집된 정보를 다음과 같이 정리하여 표시]
- 주제/제목: [수집된 정보 또는 "미정"]
- 주요 내용(What): [수집된 정보 또는 "미정"]
- 시기(When): [수집된 정보 또는 "미정"]
- 장소(Where): [수집된 정보 또는 "미정"]
- 관련 조직/인물(Who): [수집된 정보 또는 "미정"]
- 목적/의의(Why): [수집된 정보 또는 "미정"]

다음 질문:
[위 항목 중 미정인 것 중에서 가장 중요한 한 가지를 얻기 위한 구체적인 질문]

판단: [모든 정보가 충분하면 1, 부족하면 0]`;

const FINAL_PRESS_RELEASE_TEMPLATE = `지금까지 수집된 정보를 바탕으로 보도자료를 작성해주세요.

수집된 정보:
{collectedInfo}

다음 형식으로 보도자료를 작성해주세요:

[보도자료 제목]

[부제]

[주요 내용 - 5W1H를 포함한 본문]

[담당자 연락처 정보]

보도자료는 공식적이고 전문적인 톤으로 작성하되, 독자가 이해하기 쉽도록 명확하게 작성해주세요.`;

export async function validatePressReleaseInput(userInput, conversationHistory = '') {
    try {
        // 대화 내용에서 사용자 입력만 추출하여 정리
        const userInputs = conversationHistory
            .split('\n')
            .filter(line => line.startsWith('사용자:'))
            .map(line => line.replace('사용자:', '').trim());
        
        // 현재 입력을 포함한 모든 사용자 입력을 하나의 문맥으로 결합
        const allUserInputs = [...userInputs, userInput].join('\n');
        
        const prompt = ChatPromptTemplate.fromTemplate(INITIAL_VALIDATION_TEMPLATE);
        
        // 프롬프트 포맷팅
        const formattedPrompt = await prompt.format({
            conversationHistory: conversationHistory,
            userInput: allUserInputs  // 누적된 사용자 입력을 전달
        });

        // chatCompletion 호출
        const response = await chatCompletion(
            INITIAL_VALIDATION_TEMPLATE,
            formattedPrompt
        );

        return response;
    } catch (error) {
        console.error('Error in validatePressReleaseInput:', error);
        throw error;
    }
}

export async function generatePressRelease(collectedInfo) {
    try {
        const prompt = ChatPromptTemplate.fromTemplate(FINAL_PRESS_RELEASE_TEMPLATE);
        
        const formattedPrompt = await prompt.format({
            collectedInfo: collectedInfo
        });

        const response = await chatCompletion(
            FINAL_PRESS_RELEASE_TEMPLATE,
            formattedPrompt
        );

        return response;
    } catch (error) {
        console.error('Error in generatePressRelease:', error);
        throw error;
    }
} 