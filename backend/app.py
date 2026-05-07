from flask import Flask, jsonify, request
from email_analyzer import analyze_email

app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "ok",
        "message": "Malicious Email Scorer backend is running",
        "available_routes": ["/health", "/analyze-email"]
    })

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "ok",
        "message": "Backend is running"
    })
@app.route("/analyze-email", methods=["POST"])
def analyze_email_route():
    data = request.get_json(silent=True)

    if data is None:
        return jsonify({
            "status": "error",
            "message": "Request body must be valid JSON"
        }), 400

    sender = data.get("sender", "")
    subject = data.get("subject", "")
    body = data.get("body", "")
    links = data.get("links", [])
    attachments = data.get("attachments", [])

    score, verdict, reasons = analyze_email(sender, subject, body, links, attachments)

    return jsonify({
        "status": "success",
        "score": score,
        "verdict": verdict,
        "reasons": reasons
    })

if __name__ == "__main__":
    app.run(debug=True)