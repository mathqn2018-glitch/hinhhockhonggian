-- =========================================================================
-- EDU AR 3D STUDIO - CẤU TRÚC BẢNG & LƯU TRỮ SUPABASE CHO MÔ HÌNH VÀ BÀI HỌC
-- =========================================================================

-- 1. BẢNG MÔ HÌNH 3D (edu_models)
CREATE TABLE IF NOT EXISTS public.edu_models (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    vietnamese_title TEXT NOT NULL,
    category TEXT NOT NULL,
    category_label TEXT NOT NULL,
    description TEXT,
    educational_notes TEXT,
    grade_level TEXT,
    subject TEXT,
    is_ar_ready BOOLEAN DEFAULT true,
    file_url TEXT NOT NULL,
    file_size TEXT,
    thumbnail_color TEXT DEFAULT 'from-purple-600 to-indigo-700',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by TEXT DEFAULT 'Giáo viên',
    is_public BOOLEAN DEFAULT true,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Kích hoạt Row Level Security (RLS) cho edu_models
ALTER TABLE public.edu_models ENABLE ROW LEVEL SECURITY;

-- Chính sách 1: Học sinh và mọi người dùng đều được ĐỌC các mô hình công khai (Không cần đăng nhập)
DROP POLICY IF EXISTS "Học sinh được đọc mô hình công khai" ON public.edu_models;
CREATE POLICY "Học sinh được đọc mô hình công khai" 
ON public.edu_models 
FOR SELECT 
USING (is_public = true);

-- Chính sách 2: Chỉ giáo viên đã xác thực (Authenticated) mới được THÊM mô hình mới
DROP POLICY IF EXISTS "Giáo viên xác thực được thêm mô hình" ON public.edu_models;
CREATE POLICY "Giáo viên xác thực được thêm mô hình" 
ON public.edu_models 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Chính sách 3: Chỉ giáo viên đã xác thực mới được SỬA mô hình
DROP POLICY IF EXISTS "Giáo viên xác thực được sửa mô hình" ON public.edu_models;
CREATE POLICY "Giáo viên xác thực được sửa mô hình" 
ON public.edu_models 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Chính sách 4: Chỉ giáo viên đã xác thực mới được XÓA mô hình
DROP POLICY IF EXISTS "Giáo viên xác thực được xóa mô hình" ON public.edu_models;
CREATE POLICY "Giáo viên xác thực được xóa mô hình" 
ON public.edu_models 
FOR DELETE 
TO authenticated 
USING (true);


-- 2. BẢNG BÀI HỌC TƯƠNG TÁC (edu_lessons)
CREATE TABLE IF NOT EXISTS public.edu_lessons (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    model_id TEXT NOT NULL,
    model_title TEXT NOT NULL,
    objectives JSONB DEFAULT '[]'::jsonb,
    observation_tasks JSONB DEFAULT '[]'::jsonb,
    hands_on_challenge JSONB DEFAULT '{}'::jsonb,
    quiz JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by TEXT DEFAULT 'Giáo viên',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Kích hoạt Row Level Security (RLS) cho edu_lessons
ALTER TABLE public.edu_lessons ENABLE ROW LEVEL SECURITY;

-- Chính sách 1: Học sinh được ĐỌC bài học đã xuất bản (Không cần đăng nhập)
DROP POLICY IF EXISTS "Học sinh được đọc bài học đã xuất bản" ON public.edu_lessons;
CREATE POLICY "Học sinh được đọc bài học đã xuất bản" 
ON public.edu_lessons 
FOR SELECT 
USING (is_published = true);

-- Chính sách 2: Chỉ giáo viên đã xác thực được TẠO bài học
DROP POLICY IF EXISTS "Giáo viên xác thực được tạo bài học" ON public.edu_lessons;
CREATE POLICY "Giáo viên xác thực được tạo bài học" 
ON public.edu_lessons 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Chính sách 3: Chỉ giáo viên đã xác thực được SỬA bài học
DROP POLICY IF EXISTS "Giáo viên xác thực được sửa bài học" ON public.edu_lessons;
CREATE POLICY "Giáo viên xác thực được sửa bài học" 
ON public.edu_lessons 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Chính sách 4: Chỉ giáo viên đã xác thực được XÓA bài học
DROP POLICY IF EXISTS "Giáo viên xác thực được xóa bài học" ON public.edu_lessons;
CREATE POLICY "Giáo viên xác thực được xóa bài học" 
ON public.edu_lessons 
FOR DELETE 
TO authenticated 
USING (true);


-- 3. BẢNG ẢNH PANORAMA 360° & HOTSPOT HÌNH HỌC (edu_panoramas)
CREATE TABLE IF NOT EXISTS public.edu_panoramas (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'classroom',
    grade_level TEXT DEFAULT 'Toán 11 - Hình học không gian',
    image_url TEXT NOT NULL,
    hotspots JSONB DEFAULT '[]'::jsonb,
    author TEXT DEFAULT 'Giáo viên Toán 11',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Kích hoạt Row Level Security (RLS) cho edu_panoramas
ALTER TABLE public.edu_panoramas ENABLE ROW LEVEL SECURITY;

-- Chính sách 1: Mọi học sinh đều được ĐỌC ảnh 360 công khai (Không cần đăng nhập)
DROP POLICY IF EXISTS "Học sinh được đọc ảnh 360 công khai" ON public.edu_panoramas;
CREATE POLICY "Học sinh được đọc ảnh 360 công khai" 
ON public.edu_panoramas 
FOR SELECT 
USING (is_public = true);

-- Chính sách 2: Giáo viên xác thực được TẠO ảnh 360
DROP POLICY IF EXISTS "Giáo viên xác thực được tạo ảnh 360" ON public.edu_panoramas;
CREATE POLICY "Giáo viên xác thực được tạo ảnh 360" 
ON public.edu_panoramas 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Chính sách 3: Giáo viên xác thực được SỬA ảnh 360 và hotspot
DROP POLICY IF EXISTS "Giáo viên xác thực được sửa ảnh 360" ON public.edu_panoramas;
CREATE POLICY "Giáo viên xác thực được sửa ảnh 360" 
ON public.edu_panoramas 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Chính sách 4: Giáo viên xác thực được XÓA ảnh 360
DROP POLICY IF EXISTS "Giáo viên xác thực được xóa ảnh 360" ON public.edu_panoramas;
CREATE POLICY "Giáo viên xác thực được xóa ảnh 360" 
ON public.edu_panoramas 
FOR DELETE 
TO authenticated 
USING (true);


-- 4. HƯỚNG DẪN THIẾT LẬP SUPABASE STORAGE BUCKET (edu-models)
-- Bước 1: Trong Supabase Dashboard -> Storage -> Chọn "New bucket"
-- Bước 2: Tên bucket: edu-models
-- Bước 3: Gạt BẬT "Public bucket" (Bắt buộc để học sinh tải được tệp GLB trực tiếp mà không cần token)
-- Bước 4: Cấu hình Storage Policies cho bucket 'edu-models':
--   a) Cho phép ĐỌC tệp công khai (SELECT):
--      CREATE POLICY "Công khai đọc tệp 3D"
--      ON storage.objects FOR SELECT
--      USING (bucket_id = 'edu-models');
--   b) Chỉ cho phép người dùng xác thực TẢI LÊN (INSERT):
--      CREATE POLICY "Giáo viên xác thực tải tệp lên"
--      ON storage.objects FOR INSERT
--      TO authenticated
--      WITH CHECK (bucket_id = 'edu-models');
--   c) Cho phép XÓA tệp (DELETE):
--      CREATE POLICY "Giáo viên xác thực xóa tệp"
--      ON storage.objects FOR DELETE
--      TO authenticated
--      USING (bucket_id = 'edu-models');
