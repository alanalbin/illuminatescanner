/**
 * ============================================================================
 * ILLUMINATE 2026 - GOOGLE SHEET REAL-TIME FEEDBACK SYNC WEBHOOK
 * ============================================================================
 * Target Spreadsheet:
 * https://docs.google.com/spreadsheets/d/19KDKagXBecFyaZSYqaGjz-LOSitukaCXsCfK2cF14DU/edit?usp=sharing
 *
 * HOW TO DEPLOY (Takes 60 seconds):
 * 1. Open the Google Sheet above in your browser.
 * 2. In the top menu, click: Extensions -> Apps Script.
 * 3. Delete any default code in Code.gs and PASTE THIS ENTIRE FILE.
 * 4. Click the blue "Deploy" button (top right) -> "New deployment".
 * 5. Click the gear icon next to "Select type" -> choose "Web app".
 * 6. Set Description: "Illuminate Feedback Sync"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (CRITICAL: MUST BE "Anyone")
 * 7. Click "Deploy" -> click "Authorize access" (choose your Google account -> Advanced -> Go to ... (unsafe) -> Allow).
 * 8. Copy the "Web app URL" (ends in /exec).
 * 9. Paste this Web app URL into the ILLUMINATE Scanner Admin Dashboard or Settings.
 * ============================================================================
 */

function doPost(e) {
  try {
    var sheet = getOrCreateFeedbackSheet();
    var data = {};

    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var timestamp = data.timestamp || Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy, hh:mm:ss a");
    var participantName = data.participantName || data.name || "";
    var phone = data.phone || data.mobile || "";
    var email = data.email || "";
    var batch = data.batch || data.course || "";
    var college = data.college || "KMCT College of Engineering, Kasaragod";
    var trainerName = data.trainerName || "Mr. Naveen Paul";
    var trainerRating = data.trainerRating || 5;
    var trainerReview = data.trainerReview || "";
    var programRating = data.programRating || 5;
    var programReview = data.programReview || "";
    var recommend = data.recommend || "yes";
    var ticketId = data.ticketId || "WALK-IN";

    // Append new row to Google Sheet
    sheet.appendRow([
      timestamp,
      participantName,
      "'" + phone, // Prefix with apostrophe so Google Sheets treats it as text (no dropped leading 0)
      email,
      batch,
      college,
      trainerName,
      trainerRating,
      trainerReview,
      programRating,
      programReview,
      recommend,
      ticketId
    ]);

    // Apply clean styling to the row if it's the second row
    if (sheet.getLastRow() === 2) {
      formatSheetColumns(sheet);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Feedback recorded successfully for " + participantName,
      row: sheet.getLastRow()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "ILLUMINATE 2026 Feedback Webhook",
    spreadsheet: "https://docs.google.com/spreadsheets/d/19KDKagXBecFyaZSYqaGjz-LOSitukaCXsCfK2cF14DU/edit?usp=sharing"
  })).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateFeedbackSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Student Feedback");
  
  if (!sheet) {
    sheet = ss.getActiveSheet();
    sheet.setName("Student Feedback");
  }

  // Ensure header row exists
  if (sheet.getLastRow() === 0) {
    var headers = [
      "Timestamp",
      "Full Name",
      "Mobile Number",
      "Email Address",
      "Batch / Department",
      "College",
      "Trainer Name",
      "Trainer Rating (1-5)",
      "Trainer Review (Mr. Naveen Paul)",
      "Workshop Rating (1-5)",
      "Workshop Review (ILLUMINATE)",
      "Would Recommend?",
      "Ticket ID"
    ];
    
    sheet.appendRow(headers);
    formatSheetHeader(sheet);
  }

  return sheet;
}

function formatSheetHeader(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, 13);
  headerRange.setBackground("#4c1d95"); // Deep purple
  headerRange.setFontColor("#ffffff"); // White
  headerRange.setFontWeight("bold");
  headerRange.setFontFamily("Arial");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
}

function formatSheetColumns(sheet) {
  sheet.autoResizeColumns(1, 13);
  sheet.setColumnWidth(9, 320); // Trainer review column wider
  sheet.setColumnWidth(11, 320); // Workshop review column wider
}
