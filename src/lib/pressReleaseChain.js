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

각 항목이 "미정"인 경우는 해당 정보가 불충분하다는 의미입니다.
isComplete는 모든 필수 정보가 충분히 수집되었을 때만 true로 설정하세요.`;

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
    const { analysis, nextQuestion, isComplete } = parsedResponse;
    
    return `분석 결과:
- 주제/제목: ${analysis.title}
- 주요 내용(What): ${analysis.what}
- 시기(When): ${analysis.when}
- 장소(Where): ${analysis.where}
- 관련 조직/인물(Who): ${analysis.who}
- 목적/의의(Why): ${analysis.why}

다음 질문:
${nextQuestion}

판단: ${isComplete ? '1' : '0'}`;
}

function formatFallbackResponse(response) {
    const hasJudgment = response.includes('판단: 1');
    return response + (response.includes('판단:') ? '' : `\n\n판단: ${hasJudgment ? '1' : '0'}`);
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