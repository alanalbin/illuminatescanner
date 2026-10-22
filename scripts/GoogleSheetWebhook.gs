/**
 * ============================================================================
 * ILLUMINATE 2026 - GOOGLE SHEET FEEDBACK FORMATTER & REAL-TIME WEBHOOK
 * ============================================================================
 * Spreadsheet URL:
 * https://docs.google.com/spreadsheets/d/1FX6FUEm_9urEtGZ_-neZF1pZiprzU7ErBjd5ZYQ5o68/edit?usp=sharing
 *
 * HOW TO FORMAT YOUR SHEET IN 30 SECONDS:
 * 1. Open your Google Sheet in browser.
 * 2. Click: Extensions -> Apps Script.
 * 3. Delete any default code in Code.gs and PASTE THIS ENTIRE SCRIPT.
 * 4. At the top toolbar, select function "formatFeedbackSheet" and click "Run".
 *    (It will instantly format headers, widths, colors, alternating rows & summary stats!)
 * 5. Then click "Deploy" -> "New deployment" -> type "Web app"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 6. Copy the Web app URL and paste it into your Scanner Admin Dashboard.
 * ============================================================================
 */

// Custom Menu in Google Sheets UI
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ ILLUMINATE')
    .addItem('✨ Format Feedback Sheet', 'formatFeedbackSheet')
    .addItem('📊 Create Analytics Summary Tab', 'createSummaryTab')
    .addToUi();
}

/**
 * Main Formatting Function:
 * Formats columns, headers, colors, fonts, widths, text-wrapping, and conditional formatting
 */
function formatFeedbackSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Student Feedback");
  
  if (!sheet) {
    sheet = ss.getActiveSheet();
    sheet.setName("Student Feedback");
  }

  // Define Standard Column Headers
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
    "Organisation Team Rating (1-5)",
    "Organisation Team Review",
    "Workshop Rating (1-5)",
    "Workshop Review (ILLUMINATE)",
    "Would Recommend?",
    "Ticket ID"
  ];

  // Set Headers on Row 1
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Style Header Row (Deep Violet/Purple with Crisp White Text)
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#2e1065"); // Tailwind purple-950
  headerRange.setFontColor("#f5f3ff"); // Light violet/white
  headerRange.setFontFamily("Arial");
  headerRange.setFontSize(10);
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  headerRange.setWrap(true);
  sheet.setRowHeight(1, 44);

  // Freeze Row 1 and Column 2 (Full Name)
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);

  // Column Widths optimized for student feedback data
  var widths = {
    1: 160,  // Timestamp
    2: 190,  // Full Name
    3: 135,  // Mobile Number
    4: 230,  // Email Address
    5: 180,  // Batch / Department
    6: 240,  // College
    7: 160,  // Trainer Name
    8: 150,  // Trainer Rating (1-5)
    9: 340,  // Trainer Review (Mr. Naveen Paul)
    10: 160, // Organisation Team Rating (1-5)
    11: 340, // Organisation Team Review
    12: 150, // Workshop Rating (1-5)
    13: 340, // Workshop Review (ILLUMINATE)
    14: 150, // Would Recommend?
    15: 130  // Ticket ID
  };

  for (var colIndex in widths) {
    sheet.setColumnWidth(Number(colIndex), widths[colIndex]);
  }

  // Set Text Wrapping for Review Columns (Cols 9, 11, 13)
  sheet.getRange("I2:I").setWrap(true);
  sheet.getRange("K2:K").setWrap(true);
  sheet.getRange("M2:M").setWrap(true);

  // Set Alignments for Data Rows
  sheet.getRange("A2:A").setHorizontalAlignment("center"); // Timestamp
  sheet.getRange("B2:B").setHorizontalAlignment("left");   // Name
  sheet.getRange("C2:C").setHorizontalAlignment("center"); // Mobile
  sheet.getRange("D2:D").setHorizontalAlignment("left");   // Email
  sheet.getRange("E2:E").setHorizontalAlignment("center"); // Batch
  sheet.getRange("F2:F").setHorizontalAlignment("left");   // College
  sheet.getRange("G2:G").setHorizontalAlignment("center"); // Trainer Name
  sheet.getRange("H2:H").setHorizontalAlignment("center").setFontWeight("bold"); // Trainer Rating
  sheet.getRange("I2:I").setHorizontalAlignment("left");   // Trainer Review
  sheet.getRange("J2:J").setHorizontalAlignment("center").setFontWeight("bold"); // Org Team Rating
  sheet.getRange("K2:K").setHorizontalAlignment("left");   // Org Team Review
  sheet.getRange("L2:L").setHorizontalAlignment("center").setFontWeight("bold"); // Workshop Rating
  sheet.getRange("M2:M").setHorizontalAlignment("left");   // Workshop Review
  sheet.getRange("N2:N").setHorizontalAlignment("center"); // Recommend
  sheet.getRange("O2:O").setHorizontalAlignment("center").setFontFamily("Courier New"); // Ticket ID

  // Add Alternating Row Colors (Banded Range)
  var existingBandings = sheet.getBandings();
  for (var b = 0; b < existingBandings.length; b++) {
    existingBandings[b].remove();
  }
  var dataRange = sheet.getRange(1, 1, Math.max(100, sheet.getMaxRows()), headers.length);
  dataRange.applyRowBanding(SpreadsheetApp.BandingTheme.PURPLE, true, false);

  // Setup Conditional Formatting for Star Ratings
  setupConditionalFormatting(sheet);

  // Also create Summary Tab automatically
  createSummaryTab();

  SpreadsheetApp.getActiveSpreadsheet().toast("✅ Feedback Sheet Formatted Successfully!", "ILLUMINATE 2026", 5);
}

/**
 * Creates conditional formatting rules for visual rating highlights
 */
function setupConditionalFormatting(sheet) {
  var rules = [];

  // High rating (5 Stars) -> Soft Emerald Green
  var rule5 = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberEqualTo(5)
    .setBackground("#dcfce7")
    .setFontColor("#166534")
    .setRanges([sheet.getRange("H2:H"), sheet.getRange("J2:J")])
    .build();
  rules.push(rule5);

  // Good rating (4 Stars) -> Soft Blue/Cyan
  var rule4 = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberEqualTo(4)
    .setBackground("#e0f2fe")
    .setFontColor("#075985")
    .setRanges([sheet.getRange("H2:H"), sheet.getRange("J2:J")])
    .build();
  rules.push(rule4);

  // Average rating (3 Stars) -> Soft Amber
  var rule3 = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberEqualTo(3)
    .setBackground("#fef3c7")
    .setFontColor("#92400e")
    .setRanges([sheet.getRange("H2:H"), sheet.getRange("J2:J")])
    .build();
  rules.push(rule3);

  // Needs improvement (1 or 2 Stars) -> Soft Rose
  var ruleLow = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThanOrEqualTo(2)
    .setBackground("#ffe4e6")
    .setFontColor("#9f1239")
    .setRanges([sheet.getRange("H2:H"), sheet.getRange("J2:J")])
    .build();
  rules.push(ruleLow);

  // Definitely Recommend -> Soft Green
  var ruleRec = SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains("Definitely")
    .setBackground("#dcfce7")
    .setFontColor("#15803d")
    .setRanges([sheet.getRange("L2:L")])
    .build();
  rules.push(ruleRec);

  sheet.setConditionalFormatRules(rules);
}

/**
 * Creates an automated KPI Summary & Analytics tab with live formulas
 */
function createSummaryTab() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var summarySheet = ss.getSheetByName("📊 Analytics Summary");

  if (!summarySheet) {
    summarySheet = ss.insertSheet("📊 Analytics Summary");
  }

  summarySheet.clear();
  summarySheet.setColumnWidth(1, 260);
  summarySheet.setColumnWidth(2, 180);
  summarySheet.setColumnWidth(3, 240);

  // Header Title
  summarySheet.getRange("A1:C1").merge();
  summarySheet.getRange("A1").setValue("ILLUMINATE 2026 - WORKSHOP FEEDBACK SUMMARY");
  summarySheet.getRange("A1").setBackground("#2e1065").setFontColor("#ffffff").setFontWeight("bold").setFontSize(12).setHorizontalAlignment("center");
  summarySheet.setRowHeight(1, 38);

  // Key Metrics Table
  var kpiData = [
    ["Metric", "Value", "Notes"],
    ["Total Submissions", "=COUNTA('Student Feedback'!B2:B)", "Total students who submitted review"],
    ["Trainer Avg Rating (Mr. Naveen Paul)", "=IFERROR(ROUND(AVERAGE('Student Feedback'!H2:H), 2), 0)", "Out of 5.0 Stars"],
    ["Workshop Avg Rating (ILLUMINATE)", "=IFERROR(ROUND(AVERAGE('Student Feedback'!J2:J), 2), 0)", "Out of 5.0 Stars"],
    ["Overall Combined Rating", "=IFERROR(ROUND(AVERAGE('Student Feedback'!H2:H, 'Student Feedback'!J2:J), 2), 0)", "Weighted Program Overall"],
    ["Trainer 5-Star Reviews", "=COUNTIF('Student Feedback'!H2:H, 5)", "Highest rating count"],
    ["Workshop 5-Star Reviews", "=COUNTIF('Student Feedback'!J2:J, 5)", "Highest rating count"],
    ["Would Recommend (Definitely)", "=COUNTIF('Student Feedback'!L2:L, \"*Definitely*\")", "Positive recommendation count"],
    ["Recommendation %", "=IFERROR(ROUND((COUNTIF('Student Feedback'!L2:L, \"*Definitely*\") / MAX(1, COUNTA('Student Feedback'!B2:B))) * 100, 1) & \"%\", \"0%\")", "Advocacy rate"]
  ];

  summarySheet.getRange(3, 1, kpiData.length, 3).setValues(kpiData);

  // Format KPI Table
  summarySheet.getRange("A3:C3").setBackground("#4c1d95").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  summarySheet.getRange("A4:A12").setFontWeight("bold");
  summarySheet.getRange("B4:B12").setHorizontalAlignment("center").setFontSize(11).setFontWeight("bold").setFontColor("#2e1065");
  summarySheet.getRange("C4:C12").setFontColor("#6b7280").setFontSize(9);

  var kpiRange = summarySheet.getRange(3, 1, kpiData.length, 3);
  kpiRange.setBorder(true, true, true, true, true, true, "#e5e7eb", SpreadsheetApp.BorderStyle.SOLID);

  summarySheet.setFrozenRows(1);
}

/**
 * Real-time Webhook Receiver (doPost)
 * Appends live student feedback rows with proper formatting
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Student Feedback");
    if (!sheet) {
      formatFeedbackSheet();
      sheet = ss.getSheetByName("Student Feedback");
    }

    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
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
    var trainerRating = Number(data.trainerRating) || 5;
    var trainerReview = data.trainerReview || "";
    var orgTeamRating = Number(data.orgTeamRating) || 5;
    var orgTeamReview = data.orgTeamReview || "";
    var programRating = Number(data.programRating) || 5;
    var programReview = data.programReview || "";
    var recommend = data.recommend === "yes" ? "Definitely! 🚀" : (data.recommend === "maybe" ? "Maybe 👍" : "Not Really 👎");
    var ticketId = data.ticketId || "WALK-IN";

    // Append Row (15 Columns)
    sheet.appendRow([
      timestamp,
      participantName,
      "'" + phone, // Prefix with ' to preserve full 10 digits as text
      email,
      batch,
      college,
      trainerName,
      trainerRating,
      trainerReview,
      orgTeamRating,
      orgTeamReview,
      programRating,
      programReview,
      recommend,
      ticketId
    ]);

    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 9).setWrap(true);
    sheet.getRange(lastRow, 11).setWrap(true);
    sheet.getRange(lastRow, 13).setWrap(true);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Feedback logged for " + participantName,
      row: lastRow
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    workshop: "ILLUMINATE 2026",
    service: "Student Feedback Webhook",
    spreadsheet: "https://docs.google.com/spreadsheets/d/1FX6FUEm_9urEtGZ_-neZF1pZiprzU7ErBjd5ZYQ5o68/edit?usp=sharing"
  })).setMimeType(ContentService.MimeType.JSON);
}
