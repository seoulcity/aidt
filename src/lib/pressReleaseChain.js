// src/lib/pressReleaseChain.js
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import { chatCompletion } from './clovaStudioService';

const outputParser = StructuredOutputParser.fromZodSchema(
  z.object({
    analysis: z.object({
      title: z.string(),
      what: z.string(),
      when: z.string(),
      where: z.string(),
      who: z.string(),
      why: z.string(),
    }),
    nextQuestion: z.string(),
    isComplete: z.boolean().describe("모든 필수 정보가 충분히 수집되었는지 여부"),
    judgment: z.enum(['0', '1']).describe("정보 수집 완료 여부 (1: 완료, 0: 미완료)")
  })
);

const FINAL_PRESS_RELEASE_TEMPLATE = `지금까지 수집된 정보를 바탕으로 보도자료를 작성해주세요.

수집된 정보:
{collectedInfo}

다음 형식으로 보도자료를 작성해주세요:

[보도자료 제목]

[부제]

[주요 내용 - 5W1H를 포함한 본문]

[담당자 연락처 정보]

보도자료는 공식적이고 전문적인 톤으로 작성하되, 독자가 이해하기 쉽도록 명확하게 작성해주세요.`;

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

{format_instructions}

응답 작성 규칙:
1. 각 항목이 "미정" 또는 불충분한 경우 해당 정보가 부족하다는 의미입니다.
2. isComplete는 모든 필수 정보가 충분히 수집되었을 때만 true로 설정하세요.
3. judgment는 반드시 '0' 또는 '1'로만 설정하며, isComplete가 true일 때 '1', false일 때 '0'입니다.
4. nextQuestion은 부족한 정보를 얻기 위한 구체적인 질문을 작성하세요.`;

export async function validatePressReleaseInput(userInput, conversationHistory = '') {
    try {
        const prompt = ChatPromptTemplate.fromTemplate(INITIAL_VALIDATION_TEMPLATE);
        
        const formattedPrompt = await prompt.format({
            conversationHistory: conversationHistory,
            userInput: userInput,
            format_instructions: outputParser.getFormatInstructions()
        });

        const response = await chatCompletion(
            INITIAL_VALIDATION_TEMPLATE,
            formattedPrompt
        );

        let parsedResponse;
        try {
            parsedResponse = await outputParser.parse(response);
            parsedResponse.judgment = parsedResponse.isComplete ? '1' : '0';
        } catch (parseError) {
            console.error('Error parsing response:', parseError);
            return formatFallbackResponse(response);
        }

        return formatResponse(parsedResponse);
    } catch (error) {
        console.error('Error in validatePressReleaseInput:', error);
        throw error;
    }
}

function formatResponse(parsedResponse) {
    const { analysis, nextQuestion, isComplete, judgment } = parsedResponse;
    
    return `분석 결과:
- 주제/제목: ${analysis.title}
- 주요 내용(What): ${analysis.what}
- 시기(When): ${analysis.when}
- 장소(Where): ${analysis.where}
- 관련 조직/인물(Who): ${analysis.who}
- 목적/의의(Why): ${analysis.why}

다음 질문:
${nextQuestion}

판단: ${judgment}`;
}

function formatFallbackResponse(response) {
    let judgment = '0';
    if (response.includes('판단: 1')) {
        judgment = '1';
    } else if (!response.includes('판단:')) {
        const hasAllInfo = [
            '주제/제목:',
            '주요 내용(What):',
            '시기(When):',
            '장소(Where):',
            '관련 조직/인물(Who):',
            '목적/의의(Why):'
        ].every(info => response.includes(info) && !response.includes('미정'));
        judgment = hasAllInfo ? '1' : '0';
    }

    if (!response.includes('판단:')) {
        response += `\n\n판단: ${judgment}`;
    }

    return response;
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