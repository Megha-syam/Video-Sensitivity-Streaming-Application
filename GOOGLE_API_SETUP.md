# Google Video Intelligence API Setup (Optional)

If you want to use Google Video Intelligence API for actual ML-based sensitivity detection instead of the mock implementation:

## Prerequisites
- Google Cloud account
- Enabled Video Intelligence API

## Steps

### 1. Create Service Account

```bash
# Go to Google Cloud Console
# Navigate to: IAM & Admin > Service Accounts
# Create a new service account with "Video Intelligence API User" role
```

### 2. Download Credentials

```bash
# Download the JSON key file
# Save as: google-credentials.json
```

### 3. Configure Backend

Add to `backend/.env`:

```env
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
```

### 4. Place Credentials File

```bash
# Copy google-credentials.json to backend directory
cp google-credentials.json backend/
```

## Without Google API

The application works perfectly **without** Google credentials using a mock sensitivity checker that randomly flags 20% of videos.

## Cost Note

- First 1,000 minutes/month: **FREE**
- After that: $0.10 per minute

For testing/demo: Use the mock implementation (no setup required)
