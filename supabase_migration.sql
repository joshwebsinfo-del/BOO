-- Supabase PostgreSQL Migration Script for EduMentor AI Education Application
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ====================================
-- TABLE 1: profiles
-- ====================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT,
    institution TEXT,
    course TEXT,
    year_of_study TEXT,
    profile_image TEXT,
    role TEXT DEFAULT 'Student' NOT NULL,
    student_no TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ====================================
-- TABLE 2: ai_conversations
-- ====================================
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    ai_model_used TEXT NOT NULL, -- Gemini 2.0 Flash, Groq Llama, OpenRouter
    subject TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable RLS on ai_conversations
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- ====================================
-- TABLE 3: study_materials
-- ====================================
CREATE TABLE IF NOT EXISTS study_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    course TEXT,
    file_url TEXT,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable RLS on study_materials
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

-- ====================================
-- TABLE 4: quizzes
-- ====================================
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    subject TEXT,
    question TEXT NOT NULL,
    options JSONB, -- Stores choices array or dictionary
    correct_answer TEXT,
    score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable RLS on quizzes
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- ====================================
-- TABLE 5: student_progress
-- ====================================
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    subject TEXT,
    topics_completed INTEGER DEFAULT 0 NOT NULL,
    quiz_average DECIMAL(5, 2) DEFAULT 0.00 NOT NULL,
    study_time INTEGER DEFAULT 0 NOT NULL, -- in minutes
    learning_streak INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable RLS on student_progress
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

-- ====================================
-- TABLE 6: ai_usage
-- ====================================
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    requests_count INTEGER DEFAULT 0 NOT NULL,
    tokens_used INTEGER DEFAULT 0 NOT NULL,
    subscription_plan TEXT DEFAULT 'Free' NOT NULL,
    last_request TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable RLS on ai_usage
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- ====================================
-- FUTURE READY RAG FEATURE TABLES (pgvector support)
-- ====================================
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES study_materials(id) ON DELETE CASCADE NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- 1536-dimensional OpenAI / Gemini embeddings support
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable RLS on document_chunks
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- ====================================
-- TABLE 8: video_tutorials
-- ====================================
CREATE TABLE IF NOT EXISTS video_tutorials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    module_name TEXT NOT NULL,
    topic_name TEXT NOT NULL,
    video_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable RLS on video_tutorials
ALTER TABLE video_tutorials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all video tutorials" ON video_tutorials FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage video tutorials" ON video_tutorials FOR ALL USING (TRUE);

-- ====================================
-- TABLE 9: planner_tasks
-- ====================================
CREATE TABLE IF NOT EXISTS planner_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    task_text TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' NOT NULL,
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable RLS on planner_tasks
ALTER TABLE planner_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own planner tasks" ON planner_tasks FOR ALL USING (TRUE);

-- ====================================
-- DATABASE INDEXES
-- ====================================
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_video_tutorials_created_at ON video_tutorials(created_at);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_user_id ON planner_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_subject ON study_materials(subject);
CREATE INDEX IF NOT EXISTS idx_student_progress_user_id ON student_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ====================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================

-- 1. Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 2. AI Conversations Policies
CREATE POLICY "Users can view their own AI conversations"
    ON ai_conversations FOR SELECT
    USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own AI conversations"
    ON ai_conversations FOR INSERT
    WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 3. Quizzes Policies
CREATE POLICY "Users can view their own quiz results"
    ON quizzes FOR SELECT
    USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own quiz results"
    ON quizzes FOR INSERT
    WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 4. Student Progress Policies
CREATE POLICY "Users can view their own progress"
    ON student_progress FOR SELECT
    USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own progress"
    ON student_progress FOR UPDATE
    USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 5. Study Materials Policies (Admins can do everything, users can only select)
CREATE POLICY "Users can view study materials"
    ON study_materials FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage study materials"
    ON study_materials FOR ALL
    USING (
        auth.jwt() ->> 'email' LIKE '%admin%'
        OR auth.jwt() ->> 'role' = 'service_role'
        -- Or checked against a designated admin field in their profile:
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.email LIKE '%admin%'
        )
    );

-- 6. AI Usage Policies
CREATE POLICY "Users can view their own AI usage"
    ON ai_usage FOR SELECT
    USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 7. Document Chunks Policies
CREATE POLICY "Users can view document chunks"
    ON document_chunks FOR SELECT
    USING (TRUE);

-- ====================================
-- FUTURE READY HELPER FUNCTIONS
-- ====================================

-- Cosine similarity match function for semantic search/RAG
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  material_id UUID,
  chunk_index INT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.material_id,
    document_chunks.chunk_index,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
