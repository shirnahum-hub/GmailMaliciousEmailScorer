# SafeInbox — Gmail Malicious Email Scorer

SafeInbox is a Gmail Add-on that analyzes an opened email and helps the user understand whether it may be suspicious or malicious.

The add-on reads selected signals from the currently opened Gmail message, sends them to a Python Flask backend, and displays a risk score, verdict, recommendation, and risk indicators directly inside Gmail.

---

## Main Features

- Analyze the currently opened Gmail email
- Calculate an email risk score from 0 to 100
- Classify the email as Low Risk, Suspicious, or High Risk
- Display a short recommendation based on the verdict
- Show or hide detailed risk indicators
- Detect suspicious words in the email content
- Detect suspicious sender patterns
- Detect insecure or suspicious links
- Analyze attachment metadata without opening or executing files
- Allow the user to move high-risk emails to spam

---

## Tech Stack

### Gmail Add-on

- Google Apps Script
- Google Workspace APIs
- GmailApp
- CardService
- UrlFetchApp

### Backend

- Python
- Flask
- Gunicorn
- Render deployment

---

## Architecture

The system is built from two main parts:

1. **Gmail Add-on**  
   The Gmail Add-on runs inside Gmail. It reads the currently opened email using Google Workspace APIs and extracts selected email data such as sender, subject, body, links, and attachment metadata.

2. **Backend Service**  
   The backend receives the email data, analyzes it using rule-based scoring logic, and returns a structured JSON response with a score, verdict, and risk indicators.

```text
Opened Gmail email
        ↓
Gmail Add-on
        ↓
Google Workspace APIs
        ↓
Flask backend on Render
        ↓
Email scoring logic
        ↓
Risk score + verdict + reasons
        ↓
Displayed inside Gmail
```

---

## Backend API

### POST `/analyze-email`

The backend exposes an endpoint that receives email data in JSON format.

Example request:

```json
{
  "sender": "security@paypa1.com",
  "subject": "Urgent: verify your account",
  "body": "Please click here to verify your password",
  "links": ["http://example.com/login"],
  "attachments": [
    {
      "name": "invoice.zip",
      "contentType": "application/zip",
      "size": 120000
    }
  ]
}
```

Example response:

```json
{
  "status": "success",
  "score": 85,
  "verdict": "High Risk",
  "reasons": [
    "Suspicious words found in email content: urgent, verify, account, click",
    "Email contains 1 link(s)",
    "Link uses insecure HTTP: http://example.com/login",
    "Sensitive keyword found in link: login",
    "Email contains 1 attachment(s)",
    "Attachment has a risky file extension: .zip"
  ]
}
```

---

## Risk Scoring Logic

The backend uses a rule-based scoring approach. Each suspicious signal adds points to the total risk score.

### Sender signals

- Invalid sender email address
- Uncommon sender domain ending
- Suspicious words in the sender address, such as `login`, `verify`, `alert`, or `security`

### Email content signals

- Suspicious words in the subject or body, such as `urgent`, `password`, `verify`, `account`, or `click`

### Link signals

- Presence of links
- Insecure `http://` links
- Suspicious or sensitive words inside links, such as `login`, `verify`, `password`, or `account`
- Uncommon link domain endings
- Multiple links in the same email
- Emails that ask the user to take action through a link

### Attachment signals

- Presence of attachments
- Risky file extensions such as `.exe`, `.js`, `.scr`, `.bat`, `.cmd`, `.html`, or `.zip`

The final score is capped at 100.

Verdict thresholds:

```text
0–29   → Low Risk
30–69  → Suspicious
70–100 → High Risk
```

---

## Security Considerations

Security was treated as a first-class concern throughout the implementation.

Emails, links, attachments, and backend responses are treated as untrusted input.

The system does not open, execute, or parse the contents of attachments. Instead, it only analyzes safe metadata such as:

- Attachment name
- Content type
- File size

This reduces the risk of handling potentially malicious files directly.

The Gmail Add-on only sends selected email signals to the backend for analysis.

---

## UI Behavior

The Gmail Add-on displays a concise result first:

- Risk score
- Verdict
- Recommendation

The user can choose to expand the detailed risk indicators using the **Show risk indicators** button.

For high-risk emails, the add-on also displays a **Move to Spam** action button.

---

## Deployment

The backend is deployed on Render.

Production backend URL:

```text
https://gmailmaliciousemailscorer.onrender.com
```

Health check:

```text
GET /health
```

Email analysis endpoint:

```text
POST /analyze-email
```

---

## Running the Backend Locally

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the Flask backend:

```bash
python backend/app.py
```

The local server will run at:

```text
http://127.0.0.1:5000
```

Test the health endpoint:

```text
http://127.0.0.1:5000/health
```

---

## Project Structure

```text
GmailMaliciousEmailScorer/
│
├── backend/
│   ├── app.py
│   └── email_analyzer.py
│
├── assets/
│   └── safeinbox-logo.png
│
├── gmail-addon/
│
├── requirements.txt
├── render.yaml
└── README.md
```

---

## Limitations

This project uses rule-based analysis and does not replace a full enterprise-grade email security platform.

Current limitations include:

- The scoring logic is based on predefined rules
- The system does not perform real-time threat intelligence lookups
- The system does not scan attachment contents
- Some legitimate emails may still receive risk points if they contain sensitive words or links
- Some malicious emails may avoid detection if they do not match the current rule set

---

## Future Improvements

Possible future improvements include:

- Adding threat intelligence checks for link domains
- Improving domain reputation analysis
- Add sender blocking or user-defined trusted/blocked sender lists.
- Adding attachment sandboxing or external file scanning
- Adding user-defined trusted senders
- Supporting organization-level policies
- Improving the UI further with more visual risk indicators
- Adding AI-based explanation and phishing pattern detection

---

## Author

Developed by Shir Nahum as part of the Upwind Security Bootcamp home assignment.
