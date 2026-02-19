# Role Setup Guide

This guide explains how to set up user roles and initialize the database with default users for the LDM College ERP system.

## Roles Overview

The system supports three primary roles:
1. **Admin**: Full access to all modules, including user management, notices, gallery, and system settings.
2. **Teacher**: Access to academic modules, student attendance, marks entry, and exam management.
3. **Student**: Access to personal dashboard, attendance records, results, and notices.

## Database Seeding

To quickly set up the database with default users and roles, use the provided seeding script.

### Prerequisites

Ensure you have your MongoDB connection string in `.env.local`:
```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ldm2?retryWrites=true&w=majority
```

### Running the Seed Script

1. Open a terminal in the `nextappldm` directory.
2. Run the seeding script:
   ```bash
   npm run seed
   ```
   *(Note: You need to add the seed script to package.json first, see below)*

### Default Credentials

After seeding, the following accounts will be available:

| Role    | Username       | Email                          | Password      |
|---------|----------------|--------------------------------|---------------|
| Admin   | admin          | admin@ldmcollege.com           | admin123      |
| Teacher | dr.sharma      | sharma@ldmcollege.com          | teacher123    |
| Student | student001     | rahul.sharma@student.ldm.com   | student123    |

## Manual Setup (If needed)

If you prefer to create users manually or via the API:

1. **Register a User**: Use the registration page (if enabled) or directly insert into the `users` collection in MongoDB.
2. **Assign Roles**: Ensure the `role` field in the user document is set to one of: `'admin'`, `'teacher'`, `'student'`.

Example MongoDB Document:
```json
{
  "username": "newadmin",
  "email": "newadmin@example.com",
  "password": "<hashed_password>",
  "role": "admin",
  "fullName": "New Administrator",
  "status": "active"
}
```

## Troubleshooting

- **Connection Error**: Verify your `MONGODB_URI` is correct and your IP is whitelisted in MongoDB Atlas.
- **Duplicate Key Error**: The seeding script attempts to create users that already exist. Drop the collection or ignore the error if users are already present.
