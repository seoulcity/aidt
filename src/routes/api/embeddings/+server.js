// src/routes/api/embeddings/+server.js
import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';
import { EMB_V2_API_KEY, EMB_V2_API_URL, EMB_REQUEST_ID, EMB_APIGW_KEY } from '$env/static/private';

async function getNextId() {
    try {
        const embedingsDir = path.join(process.cwd(), 'static', 'embeddings');
        
        // 디렉토리가 없으면 생성하고 1을 반환
        try {
            await fs.access(embedingsDir);
        } catch {
            await fs.mkdir(embedingsDir, { recursive: true });
            return 1;
        }

        // 기존 파일들 읽기
        const files = await fs.readdir(embedingsDir);
        
        // 파일이 없으면 1을 반환
        if (files.length === 0) return 1;

        // 각 파일에서 ID 추출 (파일명 형식: {id}_timestamp.json)
        const ids = files
            .map(filename => parseInt(filename.split('_')[0]))
            .filter(id => !isNaN(id));

        // 최대 ID + 1 반환
        return Math.max(...ids) + 1;
    } catch (error) {
        console.error('ID 생성 중 오류:', error);
        throw error;
    }
}

async function generateEmbedding(text) {
  try {
    console.log('임베딩 요청 URL:', EMB_V2_API_URL);
    console.log('임베딩 요청 텍스트:', text);
    
    const response = await fetch(EMB_V2_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EMB_V2_API_KEY}`,
        'X-NCP-CLOVASTUDIO-REQUEST-ID': `embeddings-${Date.now()}`
      },
      body: JSON.stringify({ text })
    });

    console.log('임베딩 응답 상태:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('임베딩 에러 응답:', errorText);
      throw new Error(`임베딩 생성 실패: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('임베딩 응답 데이터:', data);
    return data.result.embedding;
  } catch (error) {
    console.error('임베딩 생성 중 상세 오류:', error);
    console.error('에러 스택:', error.stack);
    throw error;
  }
}

// 임베딩 파일 목록 가져오기 함수 추가
async function getEmbeddings() {
    try {
        const embedingsDir = path.join(process.cwd(), 'static', 'embeddings');
        const files = await fs.readdir(embedingsDir);
        
        const embeddings = await Promise.all(
            files.map(async (filename) => {
                const filePath = path.join(embedingsDir, filename);
                const content = await fs.readFile(filePath, 'utf-8');
                const data = JSON.parse(content);
                return {
                    id: data.id,
                    filename,
                    textbook: data.textbook,
                    unit: data.unit,
                    topic: data.topic,
                    createdAt: data.createdAt,
                    // embedding 벡터는 제외하고 메타데이터만 반환
                    ...data,
                    embedding: undefined
                };
            })
        );

        return embeddings.sort((a, b) => b.id - a.id); // 최신순 정렬
    } catch (error) {
        console.error('임베딩 목록 조회 중 오류:', error);
        throw error;
    }
}

// GET 핸들러 수정
export async function GET() {
    try {
        const [nextId, embeddings] = await Promise.all([
            getNextId(),
            getEmbeddings()
        ]);
        return json({ nextId, embeddings });
    } catch (error) {
        return json({ error: error.message }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const data = await request.json();
        console.log('받은 데이터:', data);
        
        // ID가 없으면 자동 생성
        if (!data.id) {
            data.id = await getNextId();
        }
        
        console.log('임베딩 생성 시작...');
        const embedding = await generateEmbedding(data.context);
        console.log('임베딩 생성 완료');
        
        const embeddingData = {
            ...data,
            embedding
        };

        const filename = `${data.id}_${Date.now()}.json`;
        const filePath = path.join(process.cwd(), 'static', 'embeddings', filename);

        console.log('파일 저장 경로:', filePath);

        // embeddings 디렉토리가 없다면 생성
        await fs.mkdir(path.join(process.cwd(), 'static', 'embeddings'), { recursive: true });

        // 파일 저장
        await fs.writeFile(filePath, JSON.stringify(embeddingData, null, 2));

        return json({ success: true, filename });
    } catch (error) {
        console.error('상세 에러 정보:', error);
        console.error('에러 스택:', error.stack);
        return json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE 핸들러 추가
export async function DELETE({ url }) {
    try {
        const filename = url.searchParams.get('filename');
        if (!filename) {
            throw new Error('파일명이 필요합니다');
        }

        const filePath = path.join(process.cwd(), 'static', 'embeddings', filename);
        await fs.unlink(filePath);

        return json({ success: true });
    } catch (error) {
        console.error('삭제 중 오류:', error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT 핸들러 추가 (수정용)
export async function PUT({ request }) {
    try {
        const data = await request.json();
        const { filename, ...updateData } = data;
        
        const filePath = path.join(process.cwd(), 'static', 'embeddings', filename);
        
        // 기존 파일 읽기
        const content = await fs.readFile(filePath, 'utf-8');
        const existingData = JSON.parse(content);
        
        // 임베딩 데이터는 유지하고 나머지 정보만 업데이트
        const updatedData = {
            ...existingData,
            ...updateData,
            updatedAt: new Date().toISOString().split('T')[0]
        };

        // 파일 저장
        await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2));

        return json({ success: true });
    } catch (error) {
        console.error('수정 중 오류:', error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
} 