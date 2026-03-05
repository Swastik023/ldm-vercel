# Fix Middleware and Route Logic

This plan addresses the missing output from the custom middleware and a bug in the `/todos/:id` route.

## Proposed Changes

### Express Application

#### [MODIFY] [index.js](file:///media/swastik/focus/projects%202026/webdev/index.js)

- Register the `custom_middleware` so it actually runs on requests.
- Clean up `console.log(req)` to avoid overwhelming the console.
- Fix the ID comparison in `/todos/:id` (converting params to Number).

```javascript
// Register middleware
app.use(custom_middleware);

// Update route to fix ID comparison
app.get('/todos/:id', (req, res, next) => {
    let todo = todos.filter((todo) => todo.id === Number(req.params.id));
    res.json(todo)
})
```

## Verification Plan

### Manual Verification
- Start the server using `node index.js`.
- Send a GET request to `http://localhost:3000/todos`.
- Verify "custom middleware" appears in the console.
- Send a GET request to `http://localhost:3000/todos/1`.
- Verify it returns the correct todo object instead of an empty array.
