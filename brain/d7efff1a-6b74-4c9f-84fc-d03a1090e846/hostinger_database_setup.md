# Connecting to Hostinger Database for Local Testing

This guide will help you connect your local development environment to your Hostinger MySQL database instead of using a local database.

## Prerequisites

- Active Hostinger hosting account with MySQL database
- PHP backend running locally
- Local development server (e.g., XAMPP, WAMP, or built-in PHP server)

## Step-by-Step Instructions

### 1. Get Your Hostinger Database Credentials

1. **Log into Hostinger hPanel**
   - Go to https://hpanel.hostinger.com
   - Log in with your credentials

2. **Navigate to Databases**
   - Click on **Websites** in the sidebar
   - Select your website
   - Go to **Databases** → **MySQL Databases**

3. **Note Down Your Credentials**
   You'll need:
   - **Database Host**: Usually looks like `mysql123.hostinger.com` or similar
   - **Database Name**: Format `u123456789_dbname`
   - **Username**: Format `u123456789_username`
   - **Password**: Your database password

### 2. Enable Remote MySQL Access

> [!IMPORTANT]
> This step is crucial for connecting from your local machine to Hostinger's database.

1. In the **MySQL Databases** section, scroll down to find **Remote MySQL**
2. Click **Manage** or **Configure**
3. Add your local machine's public IP address:
   - Find your IP at https://whatismyipaddress.com/
   - Click **Add New** and paste your IP address
   - Save the changes

> [!WARNING]
> Your public IP may change if you're using a dynamic IP from your ISP. If you lose connection, check if your IP has changed and update it in Hostinger.

### 3. Update Database Configuration

The database configuration file has been updated at:
```
/media/swastik/focus/ldm new updae 2.0/php_backend/config/db.php
```

**Replace the placeholder values with your actual Hostinger credentials:**

```php
// Hostinger Database Credentials
define('DB_HOST', 'mysql123.hostinger.com');  // Your Hostinger MySQL host
define('DB_USER', 'u123456789_user');         // Your database username
define('DB_PASS', 'your_actual_password');    // Your database password
define('DB_NAME', 'u123456789_dbname');       // Your database name
```

### 4. Test the Connection

1. **Start your local PHP server** (if not already running):
   ```bash
   cd "/media/swastik/focus/ldm new updae 2.0"
   php -S localhost:8000
   ```

2. **Test the connection** by accessing your application:
   - Open http://localhost:8000 in your browser
   - Try logging in or accessing database-dependent features
   - Check for any connection errors

## Troubleshooting

### Connection Refused Error

**Cause**: Remote MySQL access not enabled or IP not whitelisted

**Solution**:
- Verify your IP is added in Hostinger's Remote MySQL settings
- Check if your IP has changed (use whatismyipaddress.com)
- Wait a few minutes after adding IP (changes may take time to propagate)

### Access Denied Error

**Cause**: Incorrect credentials

**Solution**:
- Double-check username, password, and database name
- Ensure there are no extra spaces in your credentials
- Verify the database exists in Hostinger hPanel

### Timeout Error

**Cause**: Firewall blocking connection or wrong host

**Solution**:
- Verify the database host address is correct
- Check if your local firewall is blocking outbound MySQL connections (port 3306)
- Contact Hostinger support if issue persists

### "Too Many Connections" Error

**Cause**: Hostinger has connection limits on shared hosting

**Solution**:
- Close unused database connections in your code
- Consider upgrading your hosting plan for more connections
- Optimize your queries to reduce connection time

## Switching Between Local and Remote Database

### For Remote Hostinger Database (Current Setup):
Keep the current configuration with your Hostinger credentials.

### For Local MySQL Database:
Comment out the Hostinger credentials and uncomment the local development section:

```php
// Hostinger Database Credentials (COMMENTED OUT)
// define('DB_HOST', 'mysql123.hostinger.com');
// define('DB_USER', 'u123456789_user');
// define('DB_PASS', 'your_password');
// define('DB_NAME', 'u123456789_db');

// Local Development (ACTIVE)
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'college_db');
```

## Security Best Practices

> [!CAUTION]
> Never commit your database credentials to version control!

1. **Add to .gitignore**: Ensure `config/db.php` is in your `.gitignore`
2. **Use Environment Variables** (Optional advanced approach):
   - Create a `.env` file for credentials
   - Use a library like `vlucas/phpdotenv` to load them
3. **Restrict File Permissions**: On your server, set `db.php` to `600` permissions
4. **Rotate Passwords**: Change database passwords periodically

## Performance Considerations

> [!NOTE]
> Connecting to a remote database will be slower than a local one due to network latency.

**Expected behavior**:
- Queries may take 100-500ms longer than local
- This is normal and won't affect production (where backend and database are on the same server)
- For faster local development, consider syncing database to local MySQL periodically

## Next Steps

After successful connection:
- ✅ Your local application will now use the Hostinger database
- ✅ Any changes you make will reflect in the live database
- ⚠️ **Be careful**: You're working with production data!

> [!WARNING]
> Since you're connected to your production database, any INSERT, UPDATE, or DELETE operations will affect your live data. Consider creating a separate staging database on Hostinger for testing.
