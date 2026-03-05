# Gallery Bulk Delete Feature

## Goal Description
Enhance the Media Gallery Admin interface (`ManageGallery.tsx`) to support **Bulk Deletion** of images and videos. This "Out of Box" feature transforms the gallery management from a single-item workflow into a powerful bulk-management tool, addressing user feedback about "time waste" and improved usability.

## User Review Required
> [!IMPORTANT]
> This introduces a new "Selection Mode" in the UI. When enabled, clicking an image will select it instead of doing nothing or opening a preview.

## Proposed Changes

### Backend (`dist/php_backend/api/admin`)
#### [MODIFY] [gallery_delete.php](file:///media/swastik/focus/ldm new updae 2.0/ldm_test/dist/php_backend/api/admin/gallery_delete.php)
- Update logic to accept `ids` (array) in addition to single `id`.
- Loop through IDs and delete them transactionally or sequentially.
- Return success count and list of failed IDs (if any).

### Frontend (`src/pages/admin`)
#### [MODIFY] [ManageGallery.tsx](file:///media/swastik/focus/ldm new updae 2.0/ldm_test/src/pages/admin/ManageGallery.tsx)
- Add state: `selectedIds` (number[]), `isSelectionMode` (boolean).
- Add "Select Multiple" toggle button.
- Add visual indicator (checkbox/overlay) for selected items.
- Add "Delete Selected ({count})" floating action button or toolbar.
- Implement `handleBulkDelete` function triggering the API.

## Verification Plan

### Automated Tests
- **Curl Test**: Send a POST request to `gallery_delete.php` with `ids=[101, 102]` and verify both are deleted from DB.

### Manual Verification
1.  Open `/admin/gallery`.
2.  Click "Select Multiple".
3.  Click 3 images to select them.
4.  Click "Delete Selected (3)".
5.  Confirm the prompt.
6.  Verify all 3 images disappear from the grid.
