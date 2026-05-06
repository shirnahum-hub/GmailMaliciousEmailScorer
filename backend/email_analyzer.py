def analyze_email(sender, subject, body, links=None):
    score = 0
    reasons = []
    if links is None:
        links = []

    if sender is None:
        sender = ""

    if subject is None:
        subject = ""

    if body is None:
        body = ""

    sender_lower = sender.lower()
    subject_lower = subject.lower()
    body_lower = body.lower()

    suspicious_words = {
        "urgent": 10,
        "password": 20,
        "verify": 10,
        "account": 10,
        "click": 10
    }

    if "@" not in sender:
        score += 20
        reasons.append("Sender email address is invalid")

    common_domain_endings = [".com", ".org", ".net", ".co.il", ".io"]

    if "@" in sender:
        email_part = sender

        if "<" in sender and ">" in sender:
            email_part = sender.split("<")[1].split(">")[0]

        domain = email_part.split("@")[1]

        if not domain.endswith(tuple(common_domain_endings)):
            score += 10
            reasons.append("Sender domain has an uncommon ending")

    suspicious_sender_words = ["verify", "login", "alert", "support", "security"]

    for word in suspicious_sender_words:
        if word in sender_lower:
            score += 5
            reasons.append("Sender contains suspicious word: " + word)

    for word, points in suspicious_words.items():
        if word in subject_lower or word in body_lower:
            score += points
            reasons.append("Email content contains suspicious word: " + word)

    if len(links) > 0:
        score += 10
        reasons.append("Email contains " + str(len(links)) + " link(s)")

    suspicious_link_words = ["login", "verify", "password", "account"]

    for link in links:
        link_lower = link.lower()
        if link_lower.startswith("http://"):
            score += 15
            reasons.append("Link uses insecure HTTP: " + link)

        for word in suspicious_link_words:
            if word in link_lower:
                score += 10
                reasons.append("Link contains suspicious word: " + word)

    if len(links) >= 3:
        score += 10
        reasons.append("Email contains multiple links")

    if len(reasons) == 0:
        reasons.append("No suspicious indicators found")

    if score > 100:
        score = 100

    if score >= 70:
        verdict = "High Risk"
    elif score >= 30:
        verdict = "Suspicious"
    else:
        verdict = "Low Risk"

    return score, verdict, reasons