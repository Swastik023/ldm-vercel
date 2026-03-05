# Complete CMS Implementation Plan

## Overview

Building a production-ready Content Management System for LDM College with secure file uploads, role-based permissions, audit logging, and soft delete support.

---

## Phase 3: Gallery Module with File Uploads

### Directory Structure

```
/media/swastik/focus/ldm new updae 2.0/
├── public/
│   └── uploads/
│       └── gallery/
│           ├── originals/     # Full-size images
│           ├── thumbnails/    # 300x300 thumbnails
│           └── medium/         # 800x800 web-optimized
```

### File Upload Configuration

**Allowed Types:** JPG, JPEG, PNG, GIF, WEBP  
**Max Size:** 5MB  
**Processing:**
- Validate file type & size
- Generate unique filename (timestamp + random hash)
- Create thumbnail (300x300, crop to square)
- Create medium version (800x800, maintain aspect ratio)
- Store original
- Save metadata to database

### Database Updates

```sql
-- Add file_size and mime_type to gallery table
ALTER TABLE gallery 
ADD COLUMN file_size INT AFTER image_url,
ADD COLUMN mime_type VARCHAR(50) AFTER file_size,
ADD COLUMN original_filename VARCHAR(255) AFTER mime_type;
```

### API Endpoints

#### GET /api/gallery
**Public** - List active gallery items

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Campus Event 2026",
      "description": "Annual day celebration",
      "image_url": "/uploads/gallery/medium/img_1234567890_abc123.jpg",
      "thumbnail_url": "/uploads/gallery/thumbnails/img_1234567890_abc123.jpg",
      "category": "events",
      "uploaded_at": "2026-02-01T10:00:00Z"
    }
  ]
}
```

---

#### POST /api/admin/gallery
**Admin only** - Upload image with metadata

**Request:** `multipart/form-data`
```
image: [File]
title: "Event Photo"
description: "Description text"
category: "events"
```

**Validation:**
- Image: required, max 5MB, type: jpg/png/gif/webp
- Title: required, 3-200 chars
- Description: optional, max 1000 chars
- Category: optional, default "general"

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "id": 5,
    "image_url": "/uploads/gallery/medium/img_1234567890_abc123.jpg",
    "thumbnail_url": "/uploads/gallery/thumbnails/img_1234567890_abc123.jpg"
  }
}
```

---

#### PUT /api/admin/gallery/{id}
**Admin only** - Update metadata only (not image)

**Request:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "category": "events",
  "is_active": true,
  "display_order": 10
}
```

---

#### DELETE /api/admin/gallery/{id}
**Admin only** - Delete image and all files

**Process:**
1. Get image record from database
2. Delete original file
3. Delete thumbnail file
4. Delete medium file
5. Delete database record
6. Log deletion in audit log

---

### PHP File Upload Handler

```php
class ImageUploader {
    private $uploadDir = __DIR__ . '/../public/uploads/gallery/';
    private $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    private $maxSize = 5 * 1024 * 1024; // 5MB
    
    public function upload($file) {
        // Validate
        if (!$this->validate($file)) {
            throw new Exception('Invalid file');
        }
        
        // Generate unique filename
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'img_' . time() . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
        
        // Create directories if needed
        $this->ensureDirectories();
        
        // Save original
        move_uploaded_file(
            $file['tmp_name'],
            $this->uploadDir . 'originals/' . $filename
        );
        
        // Create thumbnail
        $this->createThumbnail($filename, 300, 300);
        
        // Create medium version
        $this->createMedium($filename, 800, 800);
        
        return [
            'filename' => $filename,
            'original' => '/uploads/gallery/originals/' . $filename,
            'medium' => '/uploads/gallery/medium/' . $filename,
            'thumbnail' => '/uploads/gallery/thumbnails/' . $filename,
            'size' => $file['size'],
            'mime_type' => $file['type']
        ];
    }
    
    private function createThumbnail($filename, $width, $height) {
        // Use GD library to create square thumbnail
        $source = $this->uploadDir . 'originals/' . $filename;
        $dest = $this->uploadDir . 'thumbnails/' . $filename;
        
        list($origWidth, $origHeight) = getimagesize($source);
        $sourceImage = $this->loadImage($source);
        
        // Crop to square
        $size = min($origWidth, $origHeight);
        $x = ($origWidth - $size) / 2;
        $y = ($origHeight - $size) / 2;
        
        $thumb = imagecreatetruecolor($width, $height);
        imagecopyresampled($thumb, $sourceImage, 0, 0, $x, $y, $width, $height, $size, $size);
        
        $this->saveImage($thumb, $dest);
        imagedestroy($thumb);
        imagedestroy($sourceImage);
    }
    
    private function createMedium($filename, $maxWidth, $maxHeight) {
        // Create web-optimized version maintaining aspect ratio
        $source = $this->uploadDir . 'originals/' . $filename;
        $dest = $this->uploadDir . 'medium/' . $filename;
        
        list($origWidth, $origHeight) = getimagesize($source);
        $sourceImage = $this->loadImage($source);
        
        // Calculate new dimensions
        $ratio = min($maxWidth / $origWidth, $maxHeight / $origHeight);
        $newWidth = round($origWidth * $ratio);
        $newHeight = round($origHeight * $ratio);
        
        $medium = imagecreatetruecolor($newWidth, $newHeight);
        imagecopyresampled($medium, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);
        
        $this->saveImage($medium, $dest);
        imagedestroy($medium);
        imagedestroy($sourceImage);
    }
}
```

---

## Phase 4: Role & Permission Management

### Database Schema

```sql
-- Add permissions column to gibbonRole
ALTER TABLE gibbonRole 
ADD COLUMN permissions JSON AFTER description;

-- Update admin role with full permissions
UPDATE gibbonRole 
SET permissions = JSON_ARRAY(
  'manage_users',
  'manage_content',
  'manage_gallery',
  'manage_notices',
  'view_audit_logs',
  'manage_settings'
)
WHERE category = 'Staff';
```

### Permission Middleware

```php
class PermissionMiddleware {
    public static function require($permission) {
        return function($request, $handler) use ($permission) {
            $user = $request->getAttribute('user');
            
            if (!$user || !self::hasPermission($user, $permission)) {
                $response = new Response();
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Insufficient permissions'
                ]));
                return $response->withStatus(403);
            }
            
            return $handler->handle($request);
        };
    }
    
    private static function hasPermission($user, $permission) {
        // Get user's role permissions from database
        $db = getDB();
        $stmt = $db->prepare("
            SELECT permissions 
            FROM gibbonRole 
            WHERE gibbonRoleID = :roleID
        ");
        $stmt->execute(['roleID' => $user->role_id]);
        $role = $stmt->fetch();
        
        if (!$role) return false;
        
        $permissions = json_decode($role['permissions'], true) ?? [];
        return in_array($permission, $permissions);
    }
}
```

---

## Phase 5: Audit Logging System

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT(10) UNSIGNED ZEROFILL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES gibbonPerson(gibbonPersonID) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Audit Logger Class

```php
class AuditLogger {
    public static function log($action, $entityType, $entityId, $oldValues = null, $newValues = null) {
        $db = getDB();
        $user = $_REQUEST['user'] ?? null;
        
        $stmt = $db->prepare("
            INSERT INTO audit_logs 
            (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
            VALUES (:user_id, :action, :entity_type, :entity_id, :old_values, :new_values, :ip, :user_agent)
        ");
        
        $stmt->execute([
            'user_id' => $user->user_id ?? null,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $oldValues ? json_encode($oldValues) : null,
            'new_values' => $newValues ? json_encode($newValues) : null,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
    }
}

// Usage examples:
AuditLogger::log('create', 'notice', $noticeId, null, $noticeData);
AuditLogger::log('update', 'gallery', $imageId, $oldData, $newData);
AuditLogger::log('delete', 'contact_message', $messageId, $messageData, null);
```

### Audit Log Viewer Endpoint

```php
GET /api/admin/audit-logs

// Query parameters:
- page: pagination
- limit: items per page
- user_id: filter by user
- entity_type: filter by entity
- action: filter by action (create/update/delete)
- date_from: filter by date range
- date_to: filter by date range
```

---

## Phase 6: Soft Delete Support

### Database Updates

```sql
-- Add soft delete columns
ALTER TABLE notices 
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN deleted_by INT(10) UNSIGNED ZEROFILL,
ADD FOREIGN KEY (deleted_by) REFERENCES gibbonPerson(gibbonPersonID);

ALTER TABLE gallery 
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN deleted_by INT(10) UNSIGNED ZEROFILL,
ADD FOREIGN KEY (deleted_by) REFERENCES gibbonPerson(gibbonPersonID);

ALTER TABLE contact_messages 
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN deleted_by INT(10) UNSIGNED ZEROFILL,
ADD FOREIGN KEY (deleted_by) REFERENCES gibbonPerson(gibbonPersonID);
```

### Soft Delete Implementation

```php
// Instead of DELETE, update deleted_at
DELETE /api/admin/notices/{id}

// Implementation:
$stmt = $db->prepare("
    UPDATE notices 
    SET deleted_at = NOW(), deleted_by = :user_id 
    WHERE id = :id AND deleted_at IS NULL
");
$stmt->execute(['id' => $id, 'user_id' => $user->user_id]);

// Filter deleted items from public views:
WHERE deleted_at IS NULL

// Restore endpoint:
POST /api/admin/notices/{id}/restore

// Permanent delete:
DELETE /api/admin/notices/{id}/permanent
```

---

## Phase 7: Production Deployment (Hostinger)

### File Upload Configuration

**Hostinger Path:** `/home/u542293952/public_html/ldmcollege.com/uploads/`

**Upload Directories:**
```
public_html/
├── ldmcollege.com/
│   └── uploads/
│       └── gallery/
│           ├── originals/
│           ├── thumbnails/
│           └── medium/
```

**Permissions:** 755 for directories, 644 for files

### Environment Configuration

```php
// Production config
$isProduction = $_SERVER['HTTP_HOST'] === 'ldmcollege.com';

if ($isProduction) {
    $uploadPath = '/home/u542293952/public_html/ldmcollege.com/uploads/gallery/';
    $uploadUrl = 'https://ldmcollege.com/uploads/gallery/';
} else {
    $uploadPath = __DIR__ . '/../public/uploads/gallery/';
    $uploadUrl = 'http://localhost:8000/uploads/gallery/';
}
```

### Security Headers

```php
// Add to index.php
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
```

---

## Phase 8: Optimization & Caching

### Query Caching

```php
class CacheManager {
    private $cacheDir = '/tmp/api_cache/';
    private $ttl = 300; // 5 minutes
    
    public function get($key) {
        $file = $this->cacheDir . md5($key);
        if (file_exists($file) && (time() - filemtime($file)) < $this->ttl) {
            return json_decode(file_get_contents($file), true);
        }
        return null;
    }
    
    public function set($key, $value) {
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0777, true);
        }
        file_put_contents($this->cacheDir . md5($key), json_encode($value));
    }
}
```

### Rate Limiting Enhancement

```php
// Enhanced rate limiter with different limits per endpoint
$publicLimits = ['contact' => [3, 10]]; // 3 requests per 10 minutes
$adminLimits = ['upload' => [10, 60]];  // 10 uploads per hour
```

---

## Testing Checklist

### Gallery Module
- [ ] Upload JPG image
- [ ] Upload PNG image
- [ ] Test file size validation (>5MB should fail)
- [ ] Test invalid file type (PDF should fail)
- [ ] Verify thumbnail creation
- [ ] Verify medium version creation
- [ ] Test gallery list (public)
- [ ] Test gallery admin list
- [ ] Test update metadata
- [ ] Test delete (files + DB record)

### Permissions
- [ ] Admin can access all endpoints
- [ ] Non-admin cannot access admin endpoints
- [ ] Permission checks working correctly

### Audit Logs
- [ ] All CRUD operations logged
- [ ] User info captured correctly
- [ ] Old/new values stored
- [ ] Audit log viewer working

### Soft Delete
- [ ] Delete marks deleted_at
- [ ] Deleted items hidden from public
- [ ] Restore function works
- [ ] Permanent delete removes record

---

## Success Criteria

✅ Secure file uploads with validation  
✅ Image processing (thumbnails, optimization)  
✅ Role-based access control enforced  
✅ All admin actions audited  
✅ Soft delete implemented across CMS  
✅ Production-ready for Hostinger  
✅ Complete API documentation  
✅ Admin user guide created  
✅ Deployment guide ready  

---

## Timeline Estimate

- **Gallery Module:** 3-4 hours
- **Permissions:** 1-2 hours
- **Audit Logging:** 1-2 hours
- **Soft Delete:** 1-2 hours
- **Testing & Polish:** 2-3 hours
- **Documentation:** 1-2 hours

**Total:** ~10-15 hours of focused development
