-- ============================================================================
-- Sidekick Database Schema with pgvector for RAG
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Enable pgvector extension
create extension if not exists vector;

-- ============================================================================
-- DOCUMENTS TABLE (for RAG knowledge base)
-- ============================================================================
create table documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  content text,  -- For text/markdown documents
  file_url text,  -- For file uploads
  file_type text,  -- 'pdf', 'url', 'text', 'markdown'
  status text default 'processing' check (status in ('processing', 'ready', 'error')),
  error_message text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- DOCUMENT CHUNKS TABLE (for embeddings)
-- ============================================================================
create table document_chunks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents(id) on delete cascade not null,
  content text not null,
  embedding vector(1024),  -- Groq embedding dimension
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================================================
-- VECTOR SEARCH FUNCTION (for similarity search)
-- ============================================================================
create or replace function match_document_chunks(
  query_embedding vector(1024),
  match_threshold float,
  match_count int,
  user_uuid uuid
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float,
  document_title text
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity,
    d.title as document_title
  from document_chunks dc
  join documents d on d.id = dc.document_id
  where d.user_id = user_uuid
    and d.status = 'ready'
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
alter table documents enable row level security;
alter table document_chunks enable row level security;

-- Users can CRUD own documents
create policy "Users can CRUD own documents" on documents
  for all using (auth.uid() = user_id);

-- Users can CRUD own document chunks
create policy "Users can CRUD own chunks" on document_chunks
  for all using (
    exists (select 1 from documents where id = document_chunks.document_id and user_id = auth.uid())
  );

-- ============================================================================
-- TIMESTAMP TRIGGER
-- ============================================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to documents
create trigger update_documents_updated_at
  before update on documents
  for each row execute function update_updated_at();

-- ============================================================================
-- UPDATE EXISTING TABLES (if needed)
-- ============================================================================
-- Add user_id to conversations if not exists
alter table conversations add column if not exists user_id uuid references auth.users;

-- Add user_id to messages if not exists
alter table messages add column if not exists user_id uuid references auth.users;

-- Update conversations to set user_id from auth
create or replace function backfill_conversation_user()
returns void as $$
begin
  update conversations c
  set user_id = (
    select user_id from messages m where m.conversation_id = c.id limit 1
  )
  where c.user_id is null;
end;
$$ language plpgsql;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
create index if not exists idx_documents_user_id on documents(user_id);
create index if not exists idx_documents_status on documents(status);
create index if not exists idx_document_chunks_document_id on document_chunks(document_id);
create index if not exists idx_document_chunks_embedding on document_chunks 
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================
/*
-- Example document insert:
insert into documents (user_id, title, content, file_type, status)
values (
  'user-uuid-here',
  'Sales Playbook 2024',
  'Our sales process follows these steps:
1. Prospect identification
2. Initial outreach
3. Discovery call
4. Demo presentation
5. Proposal submission
6. Negotiation
7. Close',
  'text',
  'ready'
);
*/

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
/*
-- To remove everything:
drop table if exists document_chunks;
drop table if exists documents;
drop extension if exists vector;
drop function if exists match_document_chunks;
drop function if exists update_updated_at;
*/
