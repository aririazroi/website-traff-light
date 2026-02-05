# Google Sheets Tracking Setup Guide

This guide will help you set up Google Sheets as a backup tracking system for your traffic light experiment.

## Prerequisites

- A Google account
- Access to Google Sheets and Google Apps Script

## Step-by-Step Setup

### Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click "Blank" to create a new spreadsheet
3. Name it "Traffic Light Experiment Data" (or your preferred name)

### Step 2: Set Up Header Row

In Row 1 of your sheet, add these column headers (one per cell, left to right):

| Column | Header |
|--------|--------|
| A | timestamp |
| B | participantId |
| C | eventType |
| D | articleId |
| E | trafficLightStatus |
| F | misleadingScore |
| G | elementType |
| H | context |
| I | durationMs |
| J | hoverDurationMs |
| K | sessionStart |
| L | sessionEnd |
| M | rawData |

**Note:** The script will automatically add these headers if your sheet is empty, but it's good practice to add them manually.

### Step 3: Open Apps Script

1. In your Google Sheet, click **Extensions** > **Apps Script**
2. A new tab will open with the Apps Script editor
3. Delete any default code in the editor

### Step 4: Add the Webhook Code

1. Open the file `google-apps-script.js` from this project
2. Copy all the code
3. Paste it into the Apps Script editor
4. Click the **Save** icon (💾) or press `Ctrl+S` (Windows) / `Cmd+S` (Mac)
5. Give your project a name (e.g., "Traffic Light Webhook")

### Step 5: Deploy as Web App

1. Click **Deploy** > **New deployment**
2. Click the gear icon (⚙️) next to "Select type"
3. Choose **Web app**
4. Fill in the deployment settings:
   - **Description**: "Traffic Light Experiment Webhook"
   - **Execute as**: "Me" (your Google account)
   - **Who has access**: "Anyone" (this allows your website to call it from any domain)
5. Click **Deploy**
6. **IMPORTANT**: Copy the **Web app URL** that appears - you'll need this for the next step
7. Click **Done**

### Step 6: Authorize the Script

1. When you first deploy, Google will ask for authorization
2. Click **Review Permissions**
3. Choose your Google account
4. You may see a warning: "Google hasn't verified this app"
   - Click **Advanced**
   - Click **Go to [Your Project Name] (unsafe)**
   - Click **Allow**
5. The script is now authorized

### Step 7: Update Your Website Configuration

1. Open `script.js` in your project
2. Find the `CONFIG` object at the top of the file (around line 5)
3. Set `googleSheetsWebhookUrl` to the Web app URL you copied in Step 5:

```javascript
const CONFIG = {
    googleSheetsWebhookUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec', // Paste your URL here
    // ... rest of config
};
```

4. Save the file

### Step 8: Test the Setup

1. Open your website in a browser
2. Interact with articles (click, hover, view)
3. Wait a few seconds (events are batched every 5 seconds)
4. Check your Google Sheet - you should see data appearing automatically

## Troubleshooting

### No data appearing in the sheet

1. **Check the webhook URL**: Make sure it's correctly set in `script.js`
2. **Check browser console**: Open Developer Tools (F12) and look for errors
3. **Test the webhook directly**: 
   - In Apps Script editor, run the `testDoPost()` function
   - Check if a test row appears in your sheet
4. **Check Apps Script execution logs**:
   - In Apps Script editor, click **Executions** (clock icon)
   - Look for any error messages

### CORS errors

- Google Apps Script webhooks automatically handle CORS
- The code uses `mode: 'no-cors'` which prevents reading responses but allows sending
- If you see CORS errors, check that "Who has access" is set to "Anyone"

### Rate limiting

- Google Sheets has a limit of ~100 requests per 100 seconds per user
- The code batches events to reduce requests
- If you hit limits, increase `batchInterval` in CONFIG (e.g., to 10000 for 10 seconds)

### Permission errors

- Make sure you authorized the script in Step 6
- Try redeploying the web app
- Check that "Execute as" is set to "Me"

## Data Structure

Each row in your sheet represents one event. Here's what each column contains:

- **timestamp**: When the event occurred (ISO format)
- **participantId**: Unique identifier for the participant (from URL parameter `?pid=...`)
- **eventType**: Type of event (click, hover_start, hover_end, view_start, view_end, session_start, session_end, etc.)
- **articleId**: ID of the article (if applicable)
- **trafficLightStatus**: Traffic light color (green/yellow/red) for the article
- **misleadingScore**: Misleading score (0-100) for the article
- **elementType**: What was clicked/hovered (traffic_light, article_card, link, button, etc.)
- **context**: Where the event occurred (list or modal)
- **durationMs**: Duration in milliseconds (for view_end, hover_end events)
- **hoverDurationMs**: Hover duration in milliseconds
- **sessionStart**: When the session started (ISO format)
- **sessionEnd**: When the session ended (ISO format)
- **rawData**: Complete JSON of the event (for detailed analysis)

## Security Notes

- The webhook URL is public (anyone with the URL can send data)
- Consider using a secret token if you need additional security
- Participant IDs should be anonymized if required by your study protocol
- Review Google's data retention policies for Sheets

## Next Steps

- Set up data validation rules in your sheet
- Create pivot tables for analysis
- Set up automated backups
- Configure email notifications for new data (optional)

