CREATE TABLE IF NOT EXISTS clario_responses (
    id SERIAL PRIMARY KEY,
    response_text TEXT NOT NULL,
    input_text TEXT NOT NULL,
    reference JSONB,
    recommended_questions TEXT[],
    images TEXT[],
    action VARCHAR(50),
    sub_action VARCHAR(50),
    token_count INTEGER,
    response_id VARCHAR(100) UNIQUE,
    latency FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    human_feedback INTEGER CHECK (human_feedback IN (0, 1)),
    human_feedback_note TEXT,
    ragas_feedback JSONB,
    eva_feedback JSONB,
    evaluated_at TIMESTAMP WITH TIME ZONE,
    query_category VARCHAR(100) DEFAULT '분류 없음',
    batch_id VARCHAR(100),
    is_batch BOOLEAN DEFAULT FALSE,
    order_id VARCHAR(100),
    error_message TEXT
);

-- 응답 ID에 대한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_clario_responses_response_id ON clario_responses(response_id);

-- JSONB 필드에 대한 GIN 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_clario_responses_reference ON clario_responses USING GIN (reference);

-- 생성 시간에 대한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_clario_responses_created_at ON clario_responses(created_at);

-- 평가 관련 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_clario_responses_human_feedback ON clario_responses(human_feedback);
CREATE INDEX IF NOT EXISTS idx_clario_responses_evaluated_at ON clario_responses(evaluated_at);

-- JSONB 필드에 대한 GIN 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_clario_responses_ragas_feedback ON clario_responses USING GIN (ragas_feedback);
CREATE INDEX IF NOT EXISTS idx_clario_responses_eva_feedback ON clario_responses USING GIN (eva_feedback);

-- 질의 분류에 대한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_clario_responses_query_category ON clario_responses(query_category);

-- 배치 ID에 대한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_clario_responses_batch_id ON clario_responses(batch_id);

-- 순서 ID에 대한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_clario_responses_order_id ON clario_responses(order_id);

-- 에러 메시지에 대한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_clario_responses_error_message ON clario_responses(error_message); 