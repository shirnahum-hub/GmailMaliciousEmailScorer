const BACKEND_URL = "https://gmailmaliciousemailscorer.onrender.com/analyze-email";
const SUSPICIOUS_WEEKLY_THRESHOLD = 1;
const IT_SECURITY_EMAIL = "shirnahum2211@gmail.com";
function getMessageId(e) {
  return e.gmail.messageId;
}

function getOpenedEmailData(e) {
  const messageId = getMessageId(e);
  const accessToken = e.gmail.accessToken;

  GmailApp.setCurrentMessageAccessToken(accessToken);

  const message = GmailApp.getMessageById(messageId);
  const body = message.getPlainBody();
  const links = body.match(/https?:\/\/[^\s]+/g) || [];

  const attachments = message.getAttachments();

  const attachmentData = attachments.map(function(attachment) {
  return {
    name: attachment.getName(),
    contentType: attachment.getContentType(),
    size: attachment.getSize()
  };
});

  return {
  sender: message.getFrom(),
  subject: message.getSubject(),
  body: body,
  links: links,
  attachments: attachmentData
};
}

function callBackend(emailData) {
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(emailData)
  };

  const response = UrlFetchApp.fetch(BACKEND_URL, options);
  return JSON.parse(response.getContentText());
}

function buildAddOn(e) {
  return showAnalysisResult(e);
}

function showAnalysisResult(e) {
  return buildAnalysisCard(e, false);
}

function buildAnalysisCard(e, showDetails) {
  const emailData = getOpenedEmailData(e);
  const result = callBackend(emailData);
  const weeklyStats = saveWeeklySecurityStats(e, emailData, result);

  const scoreColor = getScoreColor(result.score);
  const scoreIcon = getScoreIcon(result.score);

  const card = CardService.newCardBuilder();
  const section = CardService.newCardSection();

  section.addWidget(
  CardService.newTextParagraph()
    .setText('<b>🛡️ SafeInbox</b><br>Email security assistant')
);

  section.addWidget(
    CardService.newTextParagraph()
      .setText(
        '<b>Risk Score</b><br><font color="' + scoreColor + '"><b>' +
        result.score + '/100 ' + scoreIcon +
      '</b></font>'
      )
  );

  section.addWidget(
    CardService.newTextParagraph()
      .setText(
        '<b>Verdict</b><br><font color="' + scoreColor + '"><b>' +
        result.verdict +
        '</b></font>'
      )
  );

  section.addWidget(
    CardService.newTextParagraph()
      .setText('<b>Recommendation</b><br>' + getRecommendation(result.verdict))
  );

  if (weeklyStats.suspiciousUniqueSenders >= SUSPICIOUS_WEEKLY_THRESHOLD) {
  section.addWidget(
    CardService.newTextParagraph()
      .setText(
        '<font color="#D93025"><b>Weekly security alert</b></font><br>' +
        'You received ' + weeklyStats.suspiciousCount +
        ' suspicious emails this week from ' +
        weeklyStats.suspiciousUniqueSenders +
        ' different sender(s). Consider contacting IT Security.'
      )
  );
}


  if (result.verdict === "High Risk") {
    var moveToSpamAction = CardService.newAction()
      .setFunctionName("moveCurrentEmailToSpam");

    var moveToSpamButton = CardService.newTextButton()
      .setText("Move to Spam & Report to IT")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor("#D93025")
      .setOnClickAction(moveToSpamAction);

    section.addWidget(moveToSpamButton);
  }

  if (!showDetails) {
    var showDetailsAction = CardService.newAction()
      .setFunctionName("showAnalysisDetails");

    var showDetailsButton = CardService.newTextButton()
      .setText("Show risk indicators")
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setOnClickAction(showDetailsAction);

    section.addWidget(showDetailsButton);
  }

  if (showDetails) {
  section.addWidget(
    CardService.newTextParagraph()
      .setText("<b>Risk indicators</b>")
  );

  for (let i = 0; i < result.reasons.length; i++) {
    section.addWidget(
      CardService.newTextParagraph()
        .setText("• " + result.reasons[i])
    );
  }

  var hideDetailsAction = CardService.newAction()
    .setFunctionName("hideAnalysisDetails");

  var hideDetailsButton = CardService.newTextButton()
    .setText("Hide risk indicators")
    .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
    .setOnClickAction(hideDetailsAction);

  section.addWidget(hideDetailsButton);
}

  card.addSection(section);
  return card.build();
}

function showAnalysisDetails(e) {
  return CardService.newActionResponseBuilder()
    .setNavigation(
      CardService.newNavigation()
        .updateCard(buildAnalysisCard(e, true))
    )
    .build();
}

function hideAnalysisDetails(e) {
  return CardService.newActionResponseBuilder()
    .setNavigation(
      CardService.newNavigation()
        .updateCard(buildAnalysisCard(e, false))
    )
    .build();
}

function getRecommendation(verdict) {
  if (verdict === "High Risk") {
    return "High risk detected. Do not click links or download attachments before verifying the sender.";
  }

  if (verdict === "Suspicious") {
    return "Some warning signs were found. Review the sender and links carefully before taking action.";
  }

  return "Looks safe this time. Stay cautious with unexpected emails.";
}

function getScoreColor(score) {
  if (score <= 29) {
    return "#188038"; // green - Low Risk
  }

  if (score <= 69) {
    return "#E37400"; // orange - Suspicious
  }

  return "#D93025"; // red - High Risk
}

function getScoreIcon(score) {
  if (score <= 29) {
    return "🟢";
  }

  if (score <= 69) {
    return "🟠";
  }

  return "🔴";
}

function moveCurrentEmailToSpam(e) {
  var accessToken = e.gmail.accessToken;
  var messageId = e.gmail.messageId;

  GmailApp.setCurrentMessageAccessToken(accessToken);

  var message = GmailApp.getMessageById(messageId);
  var thread = message.getThread();

  var emailData = getOpenedEmailData(e);
  var result = callBackend(emailData);

  var reportSubject = "[SafeInbox] High-risk email reported";

  var reportBody =
    "SafeInbox detected and reported a high-risk email.\n\n" +
    "Risk Score: " + result.score + "/100\n" +
    "Verdict: " + result.verdict + "\n\n" +
    "Sender:\n" + emailData.sender + "\n\n" +
    "Subject:\n" + emailData.subject + "\n\n" +
    "Risk indicators:\n" +
    result.reasons.map(function(reason) {
      return "- " + reason;
    }).join("\n") +
    "\n\nRecommended action:\n" +
    "Review the sender, links, and attachment metadata. If confirmed malicious, consider blocking the sender or domain at the organization level.\n\n" +
    "Note: This MVP reports metadata and risk indicators only. It does not forward attachments or execute any file content.";

  GmailApp.sendEmail(
    IT_SECURITY_EMAIL,
    reportSubject,
    reportBody
  );

  GmailApp.moveThreadToSpam(thread);

  return CardService.newActionResponseBuilder()
    .setNotification(
      CardService.newNotification()
        .setText("Email moved to spam and reported to IT.")
    )
    .build();
}

function saveWeeklySecurityStats(e, emailData, result) {
  var userProperties = PropertiesService.getUserProperties();
  var storageKey = "weeklySecurityStats";
  var currentWeekKey = getCurrentWeekKey();

  var savedStats = userProperties.getProperty(storageKey);
  var stats = savedStats ? JSON.parse(savedStats) : {};

  if (stats.weekKey !== currentWeekKey) {
    stats = {
      weekKey: currentWeekKey,
      analyzedMessageIds: [],
      suspiciousCount: 0,
      highRiskCount: 0,
      suspiciousSenders: {}
    };
  }

  var messageId = getMessageId(e);

  if (stats.analyzedMessageIds.indexOf(messageId) !== -1) {
    return buildWeeklyStatsView(stats);
  }

  stats.analyzedMessageIds.push(messageId);

  if (result.verdict === "Suspicious" || result.verdict === "High Risk") {
    stats.suspiciousCount += 1;

    var senderEmail = normalizeSenderEmail(emailData.sender);
    stats.suspiciousSenders[senderEmail] = true;
  }

  if (result.verdict === "High Risk") {
    stats.highRiskCount += 1;
  }

  userProperties.setProperty(storageKey, JSON.stringify(stats));

  return buildWeeklyStatsView(stats);
}

function buildWeeklyStatsView(stats) {
  return {
    weekKey: stats.weekKey,
    suspiciousCount: stats.suspiciousCount || 0,
    highRiskCount: stats.highRiskCount || 0,
    suspiciousUniqueSenders: Object.keys(stats.suspiciousSenders || {}).length
  };
}

function normalizeSenderEmail(sender) {
  if (!sender) {
    return "";
  }

  var match = sender.match(/<([^>]+)>/);

  if (match) {
    return match[1].toLowerCase();
  }

  return sender.toLowerCase().trim();
}

function getCurrentWeekKey() {
  var now = new Date();
  var startOfYear = new Date(now.getFullYear(), 0, 1);
  var daysPassed = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  var weekNumber = Math.ceil((daysPassed + startOfYear.getDay() + 1) / 7);

  return now.getFullYear() + "-W" + weekNumber;
}