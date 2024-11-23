-- 기존 테이블 삭제
DROP TABLE IF EXISTS assessments;
DROP TABLE IF EXISTS assessment_types;

-- assessment_types 테이블
CREATE TABLE assessment_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- assessments 테이블
CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT REFERENCES assessment_types(id),
    subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
    question_count INTEGER,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 기본 assessment types 데이터 추가
INSERT INTO assessment_types (id, name) VALUES
    ('regular', '정기평가'),
    ('diagnostic', '진단평가'),
    ('formative', '형성평가');

-- Public 접근 정책 설정
ALTER TABLE assessment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access" ON assessment_types FOR ALL USING (true);
CREATE POLICY "Enable all access" ON assessments FOR ALL USING (true); 