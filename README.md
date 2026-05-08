# Safe Inbox — Gmail Malicious Email Scorer

## Why this project?

We’ve all been there.

You open your inbox, see an email that looks *almost* legitimate, click “open”, maybe click a link, maybe download something, and suddenly you start wondering:

“Wait… was that actually from Google?”
“Why is my bank calling me ‘Dear customer’?”
“And why does this urgent security warning have three spelling mistakes?”

In a world where suspicious emails can look surprisingly convincing, users need a quick and simple way to understand whether an email might be risky before interacting with it.

That’s where **Gmail Malicious Email Scorer** comes in.

This project analyzes email content and highlights possible warning signs, such as suspicious wording, risky links, or unusual sender behavior. It then provides a clear risk score and verdict, helping users quickly understand whether an email looks safe, suspicious, or potentially dangerous.

The solution includes:

- A Gmail Add-on built with Google Apps Script and Google Workspace APIs
- A Python Flask backend deployed on Render
- A rule-based email risk scoring engine

---

## What the Add-on Does

When the user opens an email in Gmail, SafeInbox can analyze it and show:

- Risk score from 0 to 100
- Verdict: Low Risk, Suspicious, or High Risk
- Recommendation for the user
- Risk indicators
- A button to move high-risk emails to spam and report them to IT Security
- A weekly warning if many suspicious emails were detected from different senders

---

## Main Features

- Reads the currently opened Gmail message
- Extracts selected email signals:
  - Sender
  - Subject
  - Body
  - Links
  - Attachment metadata
- Sends the data to a Flask backend
- Calculates a risk score
- Shows a clear result inside Gmail
- Allows the user to expand or hide risk indicators
- Allows moving high-risk emails to spam
- Sends an IT Security report for high-risk emails
- Tracks weekly suspicious email activity using Apps Script user properties

---

## Tech Stack

### Gmail Add-on

- Google Apps Script
- Google Workspace APIs
- GmailApp
- CardService
- UrlFetchApp
- PropertiesService

### Backend

- Python
- Flask
- Gunicorn
- Render

---

## Architecture

The system has two main parts:

1. **Gmail Add-on**  
   Runs inside Gmail. It reads the opened email using Google Workspace APIs and sends selected email data to the backend.

2. **Flask Backend**  
   Receives the email data, analyzes it, and returns a score, verdict, and risk indicators.

```text
Opened Gmail email
        ↓
Gmail Add-on
        ↓
Google Workspace APIs
        ↓
Flask backend on Render
        ↓
Risk scoring logic
        ↓
Score + verdict + indicators
        ↓
Displayed inside Gmail
```

---

## Backend API

### POST `/analyze-email`

The backend receives email data as JSON.

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

The backend uses a rule-based scoring model.

Each suspicious signal adds points to the total score.

### Sender checks

- Missing or invalid sender email
- Uncommon sender domain ending
- Suspicious words in the sender address such as verify, login, alert, support, security.

### Email content checks

- Suspicious words such as urgent, password, verify, account, click

### Link checks

- Links inside the email
- Insecure `http://` links
- Sensitive words inside links, such as, login, verify, password, account
- Uncommon link domain endings
- Multiple links
- Emails that ask the user to take action through a link

### Attachment checks

The system does not open or execute attachments.

It only checks safe metadata:

- Number of attachments
- File name
- Content type
- File size

Risky extensions include:

- `.exe`
- `.js`
- `.scr`
- `.bat`
- `.cmd`
- `.html`
- `.zip`

---

## Verdict Thresholds

```text
0–29   → Low Risk
30–69  → Suspicious
70–100 → High Risk
```

The final score is capped at 100.

---

## Security Considerations

The security of the user is the heart of the project.

Emails, links, attachments, and backend responses are treated as untrusted input.

The system does not:

- Execute attachments
- Open attachment contents
- Forward attachments to IT

Instead, it analyzes selected metadata and risk indicators, that's what I decided to focus on the MVP.

For high-risk emails, the add-on can move the email to spam and send a short report to IT Security with the score, sender, subject, and risk indicators.

---

## Weekly Security Alert

The add-on keeps a weekly count of suspicious emails using Apps Script `PropertiesService`.

If the user receives many suspicious emails from different senders during the week, I believe it's something the IT should know and the user needs to take caution action. The add-on displays a warning suggesting that the user contact IT Security.

This is an MVP version of a security monitoring idea. In production, this could be connected to a security mailbox or ticketing system.

---

## UI Behavior

<img width="400" height="500" alt="image" src="https://github.com/user-attachments/assets/5af3387c-7280-4aa4-b26f-295be0b65cc3" />


The UI is designed to show the most important information first.

At first, the user sees:

- Risk score
- Verdict
- Recommendation

The user can click **Show risk indicators** to see the detailed reasons.

For high-risk emails, the add-on shows:

```text
Move to Spam & Report to IT
```

---

## Deployment

The backend is deployed on Render.

Backend URL:

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

Run the backend:

```bash
python backend/app.py
```

Local server:

```text
http://127.0.0.1:5000
```

Health check:

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
├── gmail-addon/
│   ├── Code.gs
│   └── appsscript.json
│
├── assets/
│   └── safeinbox-logo.png
│
├── requirements.txt
├── render.yaml
└── README.md
```

---

## Limitations

This is an MVP and is not production-ready.

Current limitations:

- The scoring model is rule-based
- It does not use threat intelligence databases
- It does not scan attachment contents
- It does not fully block senders
- Some legitimate emails may receive risk points
- Some malicious emails may not match the current rules

---

## Future Improvements

Possible improvements:

- Replace the current “Move to Spam” action with a sender-blocking flow
- Add threat intelligence lookup for links
- Add organization-level block lists
- Add trusted sender lists
- Add a real IT/SOC reporting integration
- Add attachment sandboxing
- Improve the visual UI further
- Add AI-based phishing explanation

---

## Author

Developed by Shir Nahum.
