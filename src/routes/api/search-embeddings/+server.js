// src/routes/api/search-embeddings/+server.js
import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';
import { EMB_V2_API_KEY, EMB_V2_API_URL, EMB_REQUEST_ID, EMB_APIGW_KEY } from '$env/static/private';

// 코사인 유사도 계산 함수
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (normA * normB);
}

// 쿼리 텍스트의 임베딩 생성
async function generateEmbedding(text) {
    const response = await fetch(EMB_V2_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-NCP-CLOVASTUDIO-API-KEY': EMB_V2_API_KEY,
            'X-NCP-APIGW-API-KEY': EMB_APIGW_KEY,
            'X-NCP-CLOVASTUDIO-REQUEST-ID': EMB_REQUEST_ID
        },
        body: JSON.stringify({ text })
    });

    if (!response.ok) {
        throw new Error('임베딩 생성 실패');
    }

    const data = await response.json();
    return data.result.embedding;
}

export async function POST({ request }) {
    try {
        const { query } = await request.json();
        console.log('\n=== 임베딩 검색 시작 ===');
        console.log('1. 검색 쿼리:', query);
        
        // 임베딩 디렉토리 경로 확인
        const embedingsDir = path.join(process.cwd(), 'static', 'embeddings');
        console.log('2. 임베딩 디렉토리 절대 경로:', embedingsDir);
        
        // 현재 작업 디렉토리 확인
        console.log('3. 현재 작업 디렉토리:', process.cwd());
        
        // 디렉토리 존재 여부 확인
        let directoryExists = false;
        try {
            const dirStats = await fs.stat(embedingsDir);
            directoryExists = true;
            console.log('4. 임베딩 디렉토리 정보:', {
                isDirectory: dirStats.isDirectory(),
                permissions: dirStats.mode,
                size: dirStats.size,
                created: dirStats.birthtime,
                modified: dirStats.mtime
            });
        } catch (error) {
            console.log('4. 임베딩 디렉토리 접근 실패:', error.message);
            try {
                await fs.mkdir(embedingsDir, { recursive: true });
                console.log('5. 임베딩 디렉토리 생성됨');
                directoryExists = true;
            } catch (mkdirError) {
                console.error('5. 디렉토리 생성 실패:', mkdirError.message);
                return json({ results: [], error: '디렉토리 생성 실패' });
            }
        }

        // 디렉토리 내용물 확인
        const files = await fs.readdir(embedingsDir);
        console.log('6. 디렉토리 내 파일 목록:', files);
        
        // 파일 정보 수집
        const fileInfoList = [];
        for (const file of files) {
            const filePath = path.join(embedingsDir, file);
            try {
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const fileData = JSON.parse(fileContent);
                fileInfoList.push({
                    name: file,
                    textbook: fileData.textbook,
                    unit: fileData.unit,
                    topic: fileData.topic,
                    hasEmbedding: !!fileData.embedding,
                    embeddingLength: fileData.embedding?.length
                });
            } catch (error) {
                console.error(`   ${file} 읽기 실패:`, error.message);
                fileInfoList.push({
                    name: file,
                    error: error.message
                });
            }
        }

        if (files.length === 0) {
            console.log('7. 임베딩 파일이 없음');
            return json({ 
                results: [],
                fileInfo: {
                    totalFiles: 0,
                    files: []
                }
            });
        }

        // 파일 상세 정보 로깅
        console.log('8. 파일 상세 정보:');
        for (const file of files) {
            const filePath = path.join(embedingsDir, file);
            try {
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const fileData = JSON.parse(fileContent);
                console.log(`   ${file}:`, {
                    hasEmbedding: !!fileData.embedding,
                    embeddingLength: fileData.embedding?.length,
                    textbook: fileData.textbook,
                    unit: fileData.unit,
                    contextLength: fileData.context?.length
                });
            } catch (error) {
                console.error(`   ${file} 읽기 실패:`, error.message);
            }
        }

        // 쿼리 임베딩 생성
        console.log('9. 쿼리 임베딩 생성 시작');
        const queryEmbedding = await generateEmbedding(query);
        console.log('10. 쿼리 임베딩 생성 완료 (길이):', queryEmbedding.length);

        const similarities = [];
        console.log('11. 유사도 계산 시작');
        
        for (const filename of files) {
            try {
                const filePath = path.join(embedingsDir, filename);
                const content = await fs.readFile(filePath, 'utf-8');
                const data = JSON.parse(content);
                
                if (!data.embedding || !Array.isArray(data.embedding)) {
                    console.log(`    ${filename}: 임베딩 데이터 누락 또는 잘못된 형식`);
                    continue;
                }

                const similarity = cosineSimilarity(queryEmbedding, data.embedding);
                console.log(`    ${filename}: 유사도 = ${similarity.toFixed(4)}`);
                
                similarities.push({
                    filename,
                    similarity,
                    context: data.context,
                    textbook: data.textbook,
                    unit: data.unit,
                    topic: data.topic,
                    schoolLevel: data.schoolLevel,
                    grade: data.grade
                });
            } catch (error) {
                console.error(`    ${filename} 처리 중 오류:`, error.message);
            }
        }

        // 유사도 기준 상위 결과 반환
        const topResults = similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 3)
            .filter(result => result.similarity > 0.5);

        console.log('12. 최종 결과:', {
            totalFiles: files.length,
            processedFiles: similarities.length,
            topResults: topResults.length,
            results: topResults.map(r => ({
                similarity: r.similarity.toFixed(4),
                textbook: r.textbook,
                unit: r.unit
            }))
        });
        console.log('=== 임베딩 검색 종료 ===\n');

        // 결과 반환 시 모든 유사도 결과도 포함
        return json({ 
            results: topResults,
            fileInfo: {
                totalFiles: files.length,
                files: fileInfoList
            },
            similarities: similarities.map(s => ({
                filename: s.filename,
                textbook: s.textbook,
                unit: s.unit,
                similarity: s.similarity
            })).sort((a, b) => b.similarity - a.similarity) // 유사도 내림차순 정렬
        });

    } catch (error) {
        console.error('임베딩 검색 치명적 오류:', error);
        console.error('스택 트레이스:', error.stack);
        return json({ error: error.message }, { status: 500 });
    }
} 