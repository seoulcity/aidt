-- ========================================
-- Supabase 금지어 관리 테이블 마이그레이션
-- ========================================

-- 기존 테이블 삭제 (있을 경우)
DROP TABLE IF EXISTS forbidden_examples CASCADE;
DROP TABLE IF EXISTS forbidden_keywords CASCADE;
DROP TABLE IF EXISTS forbidden_categories CASCADE;

-- 1. 금지어 카테고리 테이블
CREATE TABLE forbidden_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 금지어 키워드 테이블
CREATE TABLE forbidden_keywords (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES forbidden_categories(id) ON DELETE CASCADE,
    keyword VARCHAR(100) NOT NULL,
    severity VARCHAR(10) CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, keyword)
);

-- 3. 금지어 예시 테이블
CREATE TABLE forbidden_examples (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES forbidden_categories(id) ON DELETE CASCADE,
    example TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_forbidden_keywords_category_id ON forbidden_keywords(category_id);
CREATE INDEX idx_forbidden_keywords_keyword ON forbidden_keywords(keyword);
CREATE INDEX idx_forbidden_keywords_active ON forbidden_keywords(is_active);
CREATE INDEX idx_forbidden_examples_category_id ON forbidden_examples(category_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE forbidden_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forbidden_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE forbidden_examples ENABLE ROW LEVEL SECURITY;

-- 모든 접근 허용 정책 (개발용 - 필요에 따라 수정)
CREATE POLICY "Enable all access for forbidden_categories" ON forbidden_categories FOR ALL USING (true);
CREATE POLICY "Enable all access for forbidden_keywords" ON forbidden_keywords FOR ALL USING (true);
CREATE POLICY "Enable all access for forbidden_examples" ON forbidden_examples FOR ALL USING (true);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_forbidden_categories_updated_at 
    BEFORE UPDATE ON forbidden_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forbidden_keywords_updated_at 
    BEFORE UPDATE ON forbidden_keywords 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forbidden_examples_updated_at 
    BEFORE UPDATE ON forbidden_examples 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 초기 데이터 삽입
-- ========================================

-- 카테고리 삽입
INSERT INTO forbidden_categories (name, description) VALUES
    ('학습 무관', '학습과 무관한 잡담이나 질문'),
    ('개인정보', '개인정보 요청 또는 노출'),
    ('정치/종교', '정치적 또는 종교적 내용'),
    ('비윤리', '차별, 혐오, 폭력적 내용'),
    ('불법', '불법적인 행위나 내용');

-- 키워드 삽입
WITH category_data AS (
    SELECT id, name FROM forbidden_categories
)
INSERT INTO forbidden_keywords (category_id, keyword, severity) VALUES
    -- 학습 무관
    ((SELECT id FROM category_data WHERE name = '학습 무관'), '게임', 'medium'),
    ((SELECT id FROM category_data WHERE name = '학습 무관'), '연예인', 'medium'),
    ((SELECT id FROM category_data WHERE name = '학습 무관'), '드라마', 'medium'),
    ((SELECT id FROM category_data WHERE name = '학습 무관'), '영화', 'medium'),
    ((SELECT id FROM category_data WHERE name = '학습 무관'), '데이트', 'medium'),
    ((SELECT id FROM category_data WHERE name = '학습 무관'), '연애', 'medium'),
    
    -- 개인정보
    ((SELECT id FROM category_data WHERE name = '개인정보'), '전화번호', 'high'),
    ((SELECT id FROM category_data WHERE name = '개인정보'), '주소', 'high'),
    ((SELECT id FROM category_data WHERE name = '개인정보'), '이름', 'high'),
    ((SELECT id FROM category_data WHERE name = '개인정보'), '나이', 'medium'),
    ((SELECT id FROM category_data WHERE name = '개인정보'), '학교', 'medium'),
    ((SELECT id FROM category_data WHERE name = '개인정보'), '이메일', 'high'),
    
    -- 정치/종교
    ((SELECT id FROM category_data WHERE name = '정치/종교'), '정당', 'high'),
    ((SELECT id FROM category_data WHERE name = '정치/종교'), '대통령', 'high'),
    ((SELECT id FROM category_data WHERE name = '정치/종교'), '선거', 'high'),
    ((SELECT id FROM category_data WHERE name = '정치/종교'), '종교', 'high'),
    ((SELECT id FROM category_data WHERE name = '정치/종교'), '교회', 'medium'),
    ((SELECT id FROM category_data WHERE name = '정치/종교'), '절', 'medium'),
    ((SELECT id FROM category_data WHERE name = '정치/종교'), '기도', 'medium'),
    
    -- 비윤리
    ((SELECT id FROM category_data WHERE name = '비윤리'), '욕설', 'high'),
    ((SELECT id FROM category_data WHERE name = '비윤리'), '차별', 'high'),
    ((SELECT id FROM category_data WHERE name = '비윤리'), '폭력', 'high'),
    ((SELECT id FROM category_data WHERE name = '비윤리'), '성희롱', 'high'),
    ((SELECT id FROM category_data WHERE name = '비윤리'), '협박', 'high'),
    
    -- 불법
    ((SELECT id FROM category_data WHERE name = '불법'), '불법', 'high'),
    ((SELECT id FROM category_data WHERE name = '불법'), '마약', 'high'),
    ((SELECT id FROM category_data WHERE name = '불법'), '도박', 'high'),
    ((SELECT id FROM category_data WHERE name = '불법'), '복제', 'medium'),
    ((SELECT id FROM category_data WHERE name = '불법'), '해킹', 'high');

-- 예시 삽입
WITH category_data AS (
    SELECT id, name FROM forbidden_categories
)
INSERT INTO forbidden_examples (category_id, example) VALUES
    -- 학습 무관
    ((SELECT id FROM category_data WHERE name = '학습 무관'), '게임 추천해주세요'),
    ((SELECT id FROM category_data WHERE name = '학습 무관'), '연예인 이름 알려주세요'),
    
    -- 개인정보
    ((SELECT id FROM category_data WHERE name = '개인정보'), '너의 이름이 뭐야?'),
    ((SELECT id FROM category_data WHERE name = '개인정보'), '내 전화번호를 알려줄까?'),
    
    -- 정치/종교
    ((SELECT id FROM category_data WHERE name = '정치/종교'), '어떤 정당을 지지해?'),
    ((SELECT id FROM category_data WHERE name = '정치/종교'), '종교는 무엇인가요?'),
    
    -- 비윤리
    ((SELECT id FROM category_data WHERE name = '비윤리'), '싫어하는 친구를 어떻게 해야할까?'),
    ((SELECT id FROM category_data WHERE name = '비윤리'), '다른 반 친구들은 다 못났어'),
    
    -- 불법
    ((SELECT id FROM category_data WHERE name = '불법'), '시험지 유출하는 방법'),
    ((SELECT id FROM category_data WHERE name = '불법'), '친구 계정 해킹하는 법');

-- 데이터 확인
SELECT 
    fc.id, 
    fc.name as category_name,
    fc.description,
    COUNT(fk.id) as keyword_count,
    COUNT(fe.id) as example_count
FROM forbidden_categories fc
LEFT JOIN forbidden_keywords fk ON fc.id = fk.category_id
LEFT JOIN forbidden_examples fe ON fc.id = fe.category_id
GROUP BY fc.id, fc.name, fc.description
ORDER BY fc.id;
