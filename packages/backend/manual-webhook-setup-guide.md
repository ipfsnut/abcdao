# Manual Webhook Setup Guide for ABC DAO

## Why Manual Setup?
For security reasons, we don't require admin permissions to your repositories. Instead, you can easily set up webhooks manually in about 2 minutes.

## Step-by-Step Instructions

### 1. Go to Your Repository Settings
- Navigate to your GitHub repository
- Click **Settings** tab
- Click **Webhooks** in the left sidebar
- Click **Add webhook**

### 2. Configure the Webhook
Fill in these exact values:

**Payload URL:**
```
https://abcdao-production.up.railway.app/api/webhooks/github
```

**Content type:**
```
application/json
```

**Secret:**
```
[Your unique secret will be provided by ABC DAO]
```

**Which events would you like to trigger this webhook?**
- Select "Just the push event"

**Active:**
- ✅ Check this box

### 3. Save the Webhook
- Click **Add webhook**
- GitHub will test the webhook and should show a green checkmark

### 4. Confirm in ABC DAO
- Return to abc.epicdylan.com → Dev Tools
- Click "I've configured the webhook" next to your repository
- Start earning ABC rewards for your commits!

## Security Notes
- Each repository gets a unique secret for security
- Webhooks only send commit information, no sensitive data
- You maintain full control over your repository permissions
- You can disable the webhook anytime from GitHub settings

## Troubleshooting
- **Red X on webhook**: Check the secret matches exactly
- **No rewards**: Ensure you're the verified GitHub user for your commits
- **Still issues**: Contact support through ABC DAO Discord

---
*This manual setup protects your repository security while enabling ABC rewards*