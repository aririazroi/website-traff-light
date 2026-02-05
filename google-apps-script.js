/**
 * Google Apps Script Webhook for Traffic Light Experiment Tracking
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Create a new Google Sheet:
 *    - Go to https://sheets.google.com
 *    - Create a new spreadsheet
 *    - Name it "Traffic Light Experiment Data" (or your preferred name)
 * 
 * 2. Set up the header row (Row 1):
 *    - In cell A1, type: timestamp
 *    - In cell B1, type: participantId
 *    - In cell C1, type: eventType
 *    - In cell D1, type: articleId
 *    - In cell E1, type: trafficLightStatus
 *    - In cell F1, type: misleadingScore
 *    - In cell G1, type: durationSeconds
 *    - In cell H1, type: durationMs
 * 
 * 3. Open Apps Script:
 *    - In your Google Sheet, go to Extensions > Apps Script
 *    - Delete any default code
 *    - Copy and paste the code below into the editor
 * 
 * 4. Deploy as Web App:
 *    - Click "Deploy" > "New deployment"
 *    - Click the gear icon (⚙️) next to "Select type" and choose "Web app"
 *    - Description: "Traffic Light Experiment Webhook"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (this allows your website to call it)
 *    - Click "Deploy"
 *    - Copy the "Web app URL" - this is your webhook URL
 * 
 * 5. Authorize the script:
 *    - When you first run it, Google will ask for permissions
 *    - Click "Review Permissions" > Choose your account > "Advanced" > "Go to [Project Name] (unsafe)" > "Allow"
 * 
 * 6. Update your website:
 *    - Open script.js
 *    - Find the CONFIG object at the top
 *    - Set googleSheetsWebhookUrl to your webhook URL from step 4
 * 
 * 7. Test:
 *    - Visit your website and interact with articles
 *    - Check your Google Sheet - data should appear automatically
 */

function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Ensure header row exists (only add if sheet is empty)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'timestamp',
        'participantId',
        'eventType',
        'articleId',
        'trafficLightStatus',
        'misleadingScore',
        'durationSeconds',
        'durationMs'
      ]);
    }
    
    // Handle batch of events or single event
    const events = Array.isArray(data.events) ? data.events : [data];
    
    events.forEach(event => {
      // Extract event data
      const timestamp = event.timestamp || new Date().toISOString();
      const participantId = event.participantId || data.participantId || '';
      // Make sure we get eventType - check both eventType and type for backwards compatibility
      const eventType = event.eventType || event.type || '';
      const articleId = event.articleId || '';
      const trafficLightStatus = event.trafficLightStatus || '';
      const misleadingScore = event.misleadingScore || '';
      const durationSeconds = event.durationSeconds || event.durationSeconds || '';
      const durationMs = event.durationMs || '';
      
      // Log for debugging (check Apps Script logs)
      Logger.log('Processing event: ' + JSON.stringify(event));
      Logger.log('Extracted eventType: ' + eventType);
      
      // Append row to sheet
      sheet.appendRow([
        timestamp,
        participantId,
        eventType,
        articleId,
        trafficLightStatus,
        misleadingScore,
        durationSeconds,
        durationMs
      ]);
    });
    
    // Return success response (though it won't be read due to no-cors mode)
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      processed: events.length
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Log error but don't fail silently
    Logger.log('Error in doPost: ' + error.toString());
    Logger.log('Post data: ' + e.postData.contents);
    
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Optional: Test function to verify the script works
 * Run this from the Apps Script editor to test
 */
function testDoPost() {
  const testData = {
    events: [{
      timestamp: new Date().toISOString(),
      participantId: 'test_participant_123',
      eventType: 'article_click',
      articleId: '1',
      trafficLightStatus: 'green',
      misleadingScore: 23
    }]
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log('Test result: ' + result.getContent());
}

