# Debug index.js Implementation Plan

The objective is to fix the routes in `index.js` so they return the correct data and don't hang.

## Proposed Changes

### [webdev]

#### [MODIFY] [index.js](file:///media/swastik/focus/projects%202026/webdev/index.js)
- Update `/todos` route to return the `todos` array.
- Update `/todos/:id` route to find and return a specific todo, and send a 404 if not found.
- Remove `console.log(req)` to keep logs clean.

## Verification Plan

### Automated Tests
- Run `node index.js`.
- Test `GET /todos` using `curl`.
- Test `GET /todos/:id` with valid and invalid IDs using `curl`.
