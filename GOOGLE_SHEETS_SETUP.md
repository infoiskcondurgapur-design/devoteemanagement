# Google Sheets Backup Setup Guide

This guide will help you set up Google Sheets backup functionality for the Devotee Management application.

## Prerequisites

- Google Account
- Internet connection
- Devotee Management application installed

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `Devotee Management Backup`
4. Click **"Create"**
5. Wait for the project to be created (you'll see a notification)

## Step 2: Enable Google Sheets API

1. In the Google Cloud Console, ensure your new project is selected
2. Go to **"APIs & Services"** → **"Library"** (from the left menu)
3. Search for **"Google Sheets API"**
4. Click on **"Google Sheets API"**
5. Click **"Enable"**

## Step 3: Create Service Account

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"Service Account"**
3. Fill in the details:
   - **Service account name**: `devotee-backup-service`
   - **Service account ID**: (auto-generated)
   - **Description**: `Service account for devotee management backup`
4. Click **"Create and Continue"**
5. Skip the optional steps (click **"Continue"** then **"Done"**)

## Step 4: Create and Download Credentials

1. On the **Credentials** page, find your newly created service account
2. Click on the service account email (e.g., `devotee-backup-service@...`)
3. Go to the **"Keys"** tab
4. Click **"Add Key"** → **"Create new key"**
5. Select **"JSON"** format
6. Click **"Create"**
7. The credentials file will be downloaded automatically (e.g., `devotee-management-backup-xxxxx.json`)

## Step 5: Install Credentials in Application

1. Rename the downloaded file to **`google-credentials.json`**
2. Copy the file to your application directory:
   ```
   e:\WEBSITE\Devotee Management - Copy\google-credentials.json
   ```
3. **Important**: Keep this file secure and never share it publicly!

## Step 6: Test the Backup

1. Start the Devotee Management application
2. Go to **File** → **Backup** → **Google Sheets**
3. Wait for the backup to complete (you'll see a loading dialog)
4. A success dialog will appear with the spreadsheet URL
5. Click **"Open in Browser"** to view your backup

## Troubleshooting

### Error: "Google credentials file not found"

**Solution**: Ensure the `google-credentials.json` file is in the correct location:
- `e:\WEBSITE\Devotee Management - Copy\google-credentials.json`

### Error: "Permission denied" or "Access forbidden"

**Solution**: 
1. Verify that the Google Sheets API is enabled in your Google Cloud project
2. Check that the service account has the correct permissions
3. Try creating a new service account key

### Error: "Failed to create spreadsheet"

**Solution**:
1. Check your internet connection
2. Verify that the Google Sheets API is enabled
3. Ensure your Google Cloud project is active (not suspended)

### The spreadsheet is created but I can't see it

**Solution**: The spreadsheet is created under the service account's Google Drive. To access it:
1. Open the spreadsheet URL from the success dialog
2. The spreadsheet will open (you have automatic access)
3. Optionally, move it to your personal Google Drive or share it with others

## Advanced Configuration

### Custom Credentials Path

You can specify a custom path for the credentials file by setting an environment variable:

1. Create or edit `.env` file in the project root
2. Add the following line:
   ```
   GOOGLE_SHEETS_CREDENTIALS_PATH=C:\path\to\your\credentials.json
   ```

### Automatic Sharing

If you want the backup spreadsheets to be automatically shared with specific users:

1. This feature is not currently implemented
2. You can manually share spreadsheets after creation
3. Or modify `google-sheets-service.mjs` to add sharing permissions

## Security Notes

- **Never commit** `google-credentials.json` to version control
- The `.gitignore` file should already exclude this file
- Keep your credentials file secure
- Regularly rotate service account keys for better security
- Consider using separate service accounts for production and testing

## What Gets Backed Up?

The Google Sheets backup includes three sheets:

1. **Devotees** - All devotee information (name, contact, spiritual details, etc.)
2. **Sadhana** - All sadhana entries (rounds, dates, etc.)
3. **Metadata** - Backup information (timestamp, counts, version)

## Backup Frequency

- Backups are manual (triggered by user)
- Each backup creates a new spreadsheet
- Spreadsheets are timestamped for easy identification
- Consider setting up a regular backup schedule (weekly/monthly)

## Support

If you encounter issues not covered in this guide:
1. Check the application console logs for detailed error messages
2. Verify all steps were completed correctly
3. Ensure your Google Cloud project has no billing issues
4. Try creating a new service account if problems persist
