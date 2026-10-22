/**
 * ============================================================================
 * ILLUMINATE 2026 - GOOGLE SHEET FEEDBACK FORMATTER & REAL-TIME WEBHOOK
 * ============================================================================
 * Spreadsheet URL:
 * https://docs.google.com/spreadsheets/d/1FX6FUEm_9urEtGZ_-neZF1pZiprzU7ErBjd5ZYQ5o68/edit?usp=sharing
 *
 * ONLY NEEDED COLUMNS (11 Columns Total):
 * 1. Timestamp
 * 2. Full Name
 * 3. Mobile Number
 * 4. Email Address
 * 5. Batch
 * 6. Trainer Rating (1-5) [Mr. Naveen Paul]
 * 7. Trainer Review
 * 8. Organisation Team Rating (1-5)
 * 9. Organisation Team Review
 * 10. Workshop Rating (1-5) [ILLUMINATE 2026]
 * 11. Workshop Review
 * ============================================================================
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ ILLUMINATE')
    .addItem('✨ Format Clean Table (11 Columns)', 'formatFeedbackSheet')
    .addToUi();
}

/**
 * Formats the sheet with ONLY the needed columns, perfect alignment and purple theme
 */
function formatFeedbackSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Student Feedback") || ss.getActiveSheet();
  sheet.setName("Student Feedback");

  // EXACT 11 NEEDED HEADERS
  var headers = [
    "Timestamp",
    "Full Name",
    "Mobile Number",
    "Email Address",
    "Batch",
    "Trainer Rating (1-5)",
    "Trainer Review",
    "Organisation Team Rating (1-5)",
    "Organisation Team Review",
    "Workshop Rating (1-5)",
    "Workshop Review"
  ];

  // Clean row 1
  sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).clearContent();

  // Set the 11 headers on Row 1
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Style Header Row (Deep Violet Purple & Bold White Text)
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#2e1065");
  headerRange.setFontColor("#f5f3ff");
  headerRange.setFontFamily("Arial");
  headerRange.setFontSize(10);
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 42);

  // Freeze Row 1 and Col 2 (Name)
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);

  // Column Widths for the 11 columns
  var widths = {
    1: 165, // Timestamp
    2: 190, // Full Name
    3: 135, // Mobile Number
    4: 220, // Email Address
    5: 160, // Batch
    6: 155, // Trainer Rating (1-5)
    7: 350, // Trainer Review
    8: 165, // Organisation Team Rating (1-5)
    9: 350, // Organisation Team Review
    10: 160,// Workshop Rating (1-5)
    11: 350 // Workshop Review
  };

  for (var colIndex in widths) {
    sheet.setColumnWidth(Number(colIndex), widths[colIndex]);
  }

  // Set Text Wrapping for Review Columns (Cols 7, 9, 11)
  sheet.getRange("G2:G").setWrap(true);
  sheet.getRange("I2:I").setWrap(true);
  sheet.getRange("K2:K").setWrap(true);

  // Set Alignments for Data Rows
  sheet.getRange("A2:A").setHorizontalAlignment("center");
  sheet.getRange("B2:B").setHorizontalAlignment("left");
  sheet.getRange("C2:C").setHorizontalAlignment("center");
  sheet.getRange("D2:D").setHorizontalAlignment("left");
  sheet.getRange("E2:E").setHorizontalAlignment("center");
  sheet.getRange("F2:F").setHorizontalAlignment("center").setFontWeight("bold");
  sheet.getRange("G2:G").setHorizontalAlignment("left");
  sheet.getRange("H2:H").setHorizontalAlignment("center").setFontWeight("bold");
  sheet.getRange("I2:I").setHorizontalAlignment("left");
  sheet.getRange("J2:J").setHorizontalAlignment("center").setFontWeight("bold");
  sheet.getRange("K2:K").setHorizontalAlignment("left");

  // Alternating Row Colors
  var existingBandings = sheet.getBandings();
  for (var b = 0; b < existingBandings.length; b++) {
    existingBandings[b].remove();
  }
  var dataRange = sheet.getRange(1, 1, Math.max(100, sheet.getMaxRows()), headers.length);
  dataRange.applyRowBanding(SpreadsheetApp.BandingTheme.PURPLE, true, false);

  // Setup Conditional Formatting for Star Ratings
  var rules = [];
  var rule5 = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberEqualTo(5)
    .setBackground("#dcfce7")
    .setFontColor("#166534")
    .setRanges([sheet.getRange("F2:F"), sheet.getRange("H2:H"), sheet.getRange("J2:J")])
    .build();
  rules.push(rule5);

  var rule4 = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberEqualTo(4)
    .setBackground("#e0f2fe")
    .setFontColor("#075985")
    .setRanges([sheet.getRange("F2:F"), sheet.getRange("H2:H"), sheet.getRange("J2:J")])
    .build();
  rules.push(rule4);

  sheet.setConditionalFormatRules(rules);

  SpreadsheetApp.getActiveSpreadsheet().toast("✅ Clean table formatted with 11 columns!", "ILLUMINATE 2026", 5);
}

/**
 * Real-time Webhook Receiver (doPost)
 * Appends rows with ONLY the 11 needed fields
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Student Feedback") || ss.getActiveSheet();

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
    var trainerRating = Number(data.trainerRating) || 5;
    var trainerReview = data.trainerReview || "";
    var orgTeamRating = Number(data.orgTeamRating) || 5;
    var orgTeamReview = data.orgTeamReview || "";
    var programRating = Number(data.programRating) || 5;
    var programReview = data.programReview || "";

    // Append Row - EXACT 11 VALUES IN ORDER
    sheet.appendRow([
      timestamp,
      participantName,
      "'" + phone, // Prefix with ' to preserve full 10 digits as text
      email,
      batch,
      trainerRating,
      trainerReview,
      orgTeamRating,
      orgTeamReview,
      programRating,
      programReview
    ]);

    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 7).setWrap(true);
    sheet.getRange(lastRow, 9).setWrap(true);
    sheet.getRange(lastRow, 11).setWrap(true);

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
    service: "Student Feedback Webhook (11 Clean Columns)",
    spreadsheet: "https://docs.google.com/spreadsheets/d/1FX6FUEm_9urEtGZ_-neZF1pZiprzU7ErBjd5ZYQ5o68/edit?usp=sharing"
  })).setMimeType(ContentService.MimeType.JSON);
}
