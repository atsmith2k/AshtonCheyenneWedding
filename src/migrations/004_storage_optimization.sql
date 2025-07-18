-- Storage Optimization Migration
-- This migration optimizes storage buckets and policies for better organization and performance

-- ============================================================================
-- 1. STORAGE BUCKET POLICIES
-- ============================================================================

-- Create storage policies for wedding-photos bucket
-- Note: These policies need to be created through the Supabase dashboard or via the management API
-- as they cannot be created through SQL

-- Policy: Allow authenticated users to upload photos
-- INSERT policy for 'wedding-photos' bucket:
-- Name: "Allow authenticated uploads"
-- Expression: auth.role() = 'authenticated'

-- Policy: Allow public read access to approved photos
-- SELECT policy for 'wedding-photos' bucket:
-- Name: "Allow public read access"
-- Expression: true

-- Policy: Allow admin users to delete photos
-- DELETE policy for 'wedding-photos' bucket:
-- Name: "Allow admin delete"
-- Expression: EXISTS (
--   SELECT 1 FROM admin_users 
--   WHERE admin_users.email = auth.jwt() ->> 'email' 
--   AND admin_users.is_active = true
-- )

-- ============================================================================
-- 2. STORAGE BUCKET ORGANIZATION
-- ============================================================================

-- Create a function to organize photos by type and date
CREATE OR REPLACE FUNCTION organize_photo_path(
  upload_type TEXT DEFAULT 'guest',
  original_filename TEXT DEFAULT 'photo.jpg'
) RETURNS TEXT AS $$
DECLARE
  file_ext TEXT;
  date_path TEXT;
  filename TEXT;
BEGIN
  -- Extract file extension
  file_ext := LOWER(SUBSTRING(original_filename FROM '\.([^.]*)$'));
  
  -- Create date-based path (YYYY/MM)
  date_path := TO_CHAR(NOW(), 'YYYY/MM');
  
  -- Generate unique filename
  filename := EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || 
              SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8) || 
              COALESCE('.' || file_ext, '.jpg');
  
  -- Return organized path
  RETURN upload_type || '/' || date_path || '/' || filename;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. PHOTO PROCESSING FUNCTIONS
-- ============================================================================

-- Create a function to generate thumbnail path from original path
CREATE OR REPLACE FUNCTION generate_thumbnail_path(original_path TEXT)
RETURNS TEXT AS $$
DECLARE
  path_parts TEXT[];
  filename TEXT;
  file_ext TEXT;
  base_name TEXT;
BEGIN
  -- Split path by '/'
  path_parts := STRING_TO_ARRAY(original_path, '/');
  filename := path_parts[ARRAY_LENGTH(path_parts, 1)];
  
  -- Extract file extension and base name
  file_ext := SUBSTRING(filename FROM '\.([^.]*)$');
  base_name := SUBSTRING(filename FROM '^(.*)\.([^.]*)$');
  
  -- Replace filename with thumbnail version
  path_parts[ARRAY_LENGTH(path_parts, 1)] := base_name || '_thumb.' || file_ext;
  
  -- Reconstruct path
  RETURN ARRAY_TO_STRING(path_parts, '/');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. PHOTO METADATA EXTRACTION
-- ============================================================================

-- Create a function to extract and validate photo metadata
CREATE OR REPLACE FUNCTION validate_photo_metadata(
  file_size BIGINT,
  mime_type TEXT,
  width INTEGER DEFAULT NULL,
  height INTEGER DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}';
  max_file_size BIGINT := 10 * 1024 * 1024; -- 10MB
  allowed_types TEXT[] := ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
BEGIN
  -- Validate file size
  IF file_size > max_file_size THEN
    result := result || jsonb_build_object('error', 'File size exceeds 10MB limit');
    RETURN result;
  END IF;
  
  -- Validate MIME type
  IF NOT (mime_type = ANY(allowed_types)) THEN
    result := result || jsonb_build_object('error', 'Invalid file type. Only JPEG, PNG, WebP, and HEIC are allowed');
    RETURN result;
  END IF;
  
  -- Validate dimensions if provided
  IF width IS NOT NULL AND height IS NOT NULL THEN
    IF width < 100 OR height < 100 THEN
      result := result || jsonb_build_object('warning', 'Image dimensions are very small');
    END IF;
    
    IF width > 8000 OR height > 8000 THEN
      result := result || jsonb_build_object('warning', 'Image dimensions are very large');
    END IF;
  END IF;
  
  -- Return success
  result := result || jsonb_build_object(
    'valid', true,
    'file_size_mb', ROUND(file_size::NUMERIC / 1024 / 1024, 2),
    'mime_type', mime_type
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. STORAGE CLEANUP FUNCTIONS
-- ============================================================================

-- Create a function to mark photos as deleted (soft delete)
CREATE OR REPLACE FUNCTION soft_delete_photo(photo_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  photo_record RECORD;
BEGIN
  -- Get photo record
  SELECT * INTO photo_record FROM photos WHERE id = photo_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Mark as deleted
  UPDATE photos 
  SET is_deleted = true, 
      updated_at = NOW()
  WHERE id = photo_id;
  
  -- Log the deletion event
  INSERT INTO analytics_events (event_type, metadata)
  VALUES ('photo_soft_delete', jsonb_build_object(
    'photo_id', photo_id,
    'file_path', photo_record.file_path,
    'original_filename', photo_record.original_filename
  ));
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create a function to permanently delete old soft-deleted photos
CREATE OR REPLACE FUNCTION cleanup_deleted_photos(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  photo_record RECORD;
BEGIN
  -- Find photos that have been soft-deleted for more than specified days
  FOR photo_record IN 
    SELECT id, file_path, thumbnail_path 
    FROM photos 
    WHERE is_deleted = true 
    AND updated_at < NOW() - INTERVAL '1 day' * days_old
  LOOP
    -- Log the permanent deletion
    INSERT INTO analytics_events (event_type, metadata)
    VALUES ('photo_permanent_delete', jsonb_build_object(
      'photo_id', photo_record.id,
      'file_path', photo_record.file_path,
      'cleanup_after_days', days_old
    ));
    
    -- Delete the photo record
    DELETE FROM photos WHERE id = photo_record.id;
    
    deleted_count := deleted_count + 1;
  END LOOP;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. PHOTO ANALYTICS FUNCTIONS
-- ============================================================================

-- Create a function to get storage usage statistics
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_photos INTEGER;
  approved_photos INTEGER;
  pending_photos INTEGER;
  total_size_mb NUMERIC;
  avg_size_mb NUMERIC;
BEGIN
  -- Get photo counts
  SELECT COUNT(*) INTO total_photos FROM photos WHERE NOT is_deleted;
  SELECT COUNT(*) INTO approved_photos FROM photos WHERE approved = true AND NOT is_deleted;
  SELECT COUNT(*) INTO pending_photos FROM photos WHERE approved = false AND NOT is_deleted;
  
  -- Get size statistics
  SELECT 
    ROUND(COALESCE(SUM(file_size), 0)::NUMERIC / 1024 / 1024, 2),
    ROUND(COALESCE(AVG(file_size), 0)::NUMERIC / 1024 / 1024, 2)
  INTO total_size_mb, avg_size_mb
  FROM photos 
  WHERE NOT is_deleted AND file_size IS NOT NULL;
  
  -- Build result
  result := jsonb_build_object(
    'total_photos', total_photos,
    'approved_photos', approved_photos,
    'pending_photos', pending_photos,
    'total_size_mb', total_size_mb,
    'average_size_mb', avg_size_mb,
    'approval_rate', CASE 
      WHEN total_photos > 0 THEN ROUND((approved_photos::NUMERIC / total_photos) * 100, 1)
      ELSE 0 
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on storage functions
GRANT EXECUTE ON FUNCTION organize_photo_path(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_thumbnail_path(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_photo_metadata(BIGINT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_photo(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_deleted_photos(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_storage_stats() TO authenticated;

-- ============================================================================
-- 8. CREATE STORAGE MAINTENANCE VIEWS
-- ============================================================================

-- View for storage usage by month
CREATE OR REPLACE VIEW storage_usage_by_month AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as photos_uploaded,
  COUNT(*) FILTER (WHERE approved = true) as photos_approved,
  ROUND(COALESCE(SUM(file_size), 0)::NUMERIC / 1024 / 1024, 2) as total_size_mb
FROM photos 
WHERE NOT is_deleted
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- View for photos pending approval
CREATE OR REPLACE VIEW photos_pending_approval AS
SELECT 
  p.id,
  p.original_filename,
  p.caption,
  p.file_size,
  p.created_at,
  CASE 
    WHEN p.uploaded_by_guest_id IS NOT NULL THEN 
      g.first_name || ' ' || g.last_name
    ELSE 'Admin Upload'
  END as uploaded_by,
  p.file_path
FROM photos p
LEFT JOIN guests g ON p.uploaded_by_guest_id = g.id
WHERE p.approved = false 
  AND NOT p.is_deleted
ORDER BY p.created_at ASC;

-- Grant view permissions
GRANT SELECT ON storage_usage_by_month TO authenticated;
GRANT SELECT ON photos_pending_approval TO authenticated;

-- ============================================================================
-- 9. ADD COMMENTS
-- ============================================================================

COMMENT ON FUNCTION organize_photo_path IS 'Generates organized storage path for photos based on upload type and date';
COMMENT ON FUNCTION generate_thumbnail_path IS 'Generates thumbnail path from original photo path';
COMMENT ON FUNCTION validate_photo_metadata IS 'Validates photo file size, type, and dimensions';
COMMENT ON FUNCTION soft_delete_photo IS 'Marks a photo as deleted without removing the database record';
COMMENT ON FUNCTION cleanup_deleted_photos IS 'Permanently removes photos that have been soft-deleted for specified days';
COMMENT ON FUNCTION get_storage_stats IS 'Returns comprehensive storage usage statistics';

COMMENT ON VIEW storage_usage_by_month IS 'Monthly breakdown of photo uploads and storage usage';
COMMENT ON VIEW photos_pending_approval IS 'Photos waiting for admin approval with uploader information';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Storage optimization migration completed successfully!';
  RAISE NOTICE 'Created storage utility functions and views';
  RAISE NOTICE 'Remember to configure storage bucket policies in Supabase dashboard';
END $$;
