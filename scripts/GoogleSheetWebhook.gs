/**
 * ============================================================================
 * ILLUMINATE 2026 - OFFICIAL WORKSHOP FEEDBACK FORM & REAL-TIME WEBHOOK
 * ============================================================================
 * Spreadsheet URL:
 * https://docs.google.com/spreadsheets/d/1FX6FUEm_9urEtGZ_-neZF1pZiprzU7ErBjd5ZYQ5o68/edit?usp=sharing
 *
 * OFFICIAL QUESTIONNAIRE COLUMNS (11 Columns):
 * 1. Timestamp
 * 2. student name *
 * 3. department and course *
 * 4. year of study * (1st year / 2nd year)
 * 5. mobile number *
 * 6. How would you rate the overall workshop? (1-5: poor -> excellent)
 * 7. How relevant was the workshop to your academic and career goals? (1-5: Not relevant -> Extremely relevant)
 * 8. How would you rate the trainer's knowledge and expertise? (1-5: Poor -> Excellent)
 * 9. How clear and understandable were the concepts explained? (1-5: Not clear -> very clear)
 * 10. How engaging and interactive was the session? (1-5: Not engaging -> very engaging)
 * 11. overall feedback about event and organization *
 * ============================================================================
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ ILLUMINATE')
    .addItem('✨ Format Official Feedback Table', 'formatFeedbackSheet')
    .addToUi();
}

/**
 * Formats the sheet with the exact 11 columns matching the official Google Form questionnaire
 */
function formatFeedbackSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Student Feedback") || ss.getActiveSheet();
  sheet.setName("Student Feedback");

  // EXACT 11 OFFICIAL HEADERS
  var headers = [
    "Timestamp",
    "student name",
    "department and course",
    "year of study",
    "mobile number",
    "How would you rate the overall workshop? (1-5)",
    "How relevant was the workshop to your academic and career goals? (1-5)",
    "How would you rate the trainer's knowledge and expertise? (1-5)",
    "How clear and understandable were the concepts explained? (1-5)",
    "How engaging and interactive was the session? (1-5)",
    "overall feedback about event and organization"
  ];

  // Clean Row 1 to prevent any offset
  sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).clearContent();

  // Set the 11 headers on Row 1
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Style Header Row (Deep Purple & Bold White Text)
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#2e1065");
  headerRange.setFontColor("#f5f3ff");
  headerRange.setFontFamily("Arial");
  headerRange.setFontSize(10);
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  headerRange.setWrap(true);
  sheet.setRowHeight(1, 50);

  // Freeze Row 1 and Col 2 (Student Name)
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);

  // Column Widths
  var widths = {
    1: 165, // Timestamp
    2: 190, // student name
    3: 220, // department and course
    4: 130, // year of study
    5: 140, // mobile number
    6: 170, // How would you rate the overall workshop?
    7: 190, // How relevant was the workshop to academic & career goals?
    8: 185, // How would you rate trainer's knowledge and expertise?
    9: 185, // How clear and understandable were the concepts?
    10: 185,// How engaging and interactive was the session?
    11: 380 // overall feedback about event and organization
  };

  for (var colIndex in widths) {
    sheet.setColumnWidth(Number(colIndex), widths[colIndex]);
  }

  // Text Wrapping for Feedback Column (Col 11)
  sheet.getRange("K2:K").setWrap(true);

  // Set Alignments for Data Rows
  sheet.getRange("A2:A").setHorizontalAlignment("center"); // Timestamp
  sheet.getRange("B2:B").setHorizontalAlignment("left");   // Name
  sheet.getRange("C2:C").setHorizontalAlignment("left");   // Dept & course
  sheet.getRange("D2:D").setHorizontalAlignment("center"); // Year of study
  sheet.getRange("E2:E").setHorizontalAlignment("center"); // Mobile
  sheet.getRange("F2:F").setHorizontalAlignment("center").setFontWeight("bold"); // Overall
  sheet.getRange("G2:G").setHorizontalAlignment("center").setFontWeight("bold"); // Relevance
  sheet.getRange("H2:H").setHorizontalAlignment("center").setFontWeight("bold"); // Trainer expertise
  sheet.getRange("I2:I").setHorizontalAlignment("center").setFontWeight("bold"); // Clarity
  sheet.getRange("J2:J").setHorizontalAlignment("center").setFontWeight("bold"); // Engagement
  sheet.getRange("K2:K").setHorizontalAlignment("left");   // Overall feedback

  // Alternating Row Colors
  var existingBandings = sheet.getBandings();
  for (var b = 0; b < existingBandings.length; b++) {
    existingBandings[b].remove();
  }
  var dataRange = sheet.getRange(1, 1, Math.max(100, sheet.getMaxRows()), headers.length);
  dataRange.applyRowBanding(SpreadsheetApp.BandingTheme.PURPLE, true, false);

  // Conditional Formatting for Ratings (Cols F through J)
  var ratingRange = sheet.getRange("F2:J");
  var rules = [];

  var rule5 = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberEqualTo(5)
    .setBackground("#dcfce7")
    .setFontColor("#166534")
    .setRanges([ratingRange])
    .build();
  rules.push(rule5);

  var rule4 = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberEqualTo(4)
    .setBackground("#e0f2fe")
    .setFontColor("#075985")
    .setRanges([ratingRange])
    .build();
  rules.push(rule4);

  var ruleLow = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThanOrEqualTo(2)
    .setBackground("#ffe4e6")
    .setFontColor("#9f1239")
    .setRanges([ratingRange])
    .build();
  rules.push(ruleLow);

  sheet.setConditionalFormatRules(rules);

  SpreadsheetApp.getActiveSpreadsheet().toast("✅ Official questionnaire table formatted!", "ILLUMINATE 2026", 5);
}

/**
 * Real-time Webhook Receiver (doPost)
 * Appends live student feedback rows matching the official Google Form questionnaire
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
    var studentName = data.studentName || data.participantName || "";
    var departmentAndCourse = data.departmentAndCourse || data.batch || data.course || "";
    var yearOfStudy = data.yearOfStudy || "1st year";
    var mobileNumber = data.mobileNumber || data.phone || "";
    
    // 5 Specific Rating Questions (1-5)
    var overallWorkshopRating = Number(data.overallWorkshopRating || data.programRating) || 5;
    var relevanceRating = Number(data.relevanceRating) || 5;
    var trainerKnowledgeRating = Number(data.trainerKnowledgeRating || data.trainerRating) || 5;
    var clarityRating = Number(data.clarityRating) || 5;
    var engagementRating = Number(data.engagementRating) || 5;
    
    // Overall Feedback Description
    var overallFeedback = data.overallFeedback || data.trainerReview || data.orgTeamReview || "";

    // Append Row - EXACT 11 VALUES IN ORDER
    sheet.appendRow([
      timestamp,
      studentName,
      departmentAndCourse,
      yearOfStudy,
      "'" + mobileNumber, // Preserve leading 0
      overallWorkshopRating,
      relevanceRating,
      trainerKnowledgeRating,
      clarityRating,
      engagementRating,
      overallFeedback
    ]);

    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 11).setWrap(true);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Feedback logged for " + studentName,
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
    service: "Official Student Feedback Webhook (11 Columns)",
    spreadsheet: "https://docs.google.com/spreadsheets/d/1FX6FUEm_9urEtGZ_-neZF1pZiprzU7ErBjd5ZYQ5o68/edit?usp=sharing"
  })).setMimeType(ContentService.MimeType.JSON);
}
