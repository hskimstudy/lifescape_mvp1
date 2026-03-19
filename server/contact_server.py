"""
Lightweight contact-only server.
Run this locally: python contact_server.py
This handles the /contact endpoint without loading heavy ML models.
"""
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import os, json, time

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/contact")
async def contact_email(
    name: str = Form(...),
    email: str = Form(...),
    inquiry_type: str = Form("미선택"),
    message: str = Form(...),
    attachment: Optional[UploadFile] = File(None),
):
    """Send contact form email with optional file attachment"""
    RECIPIENT = "hyeonsu.kim@lifescape.kr"
    SMTP_USER = os.environ.get("SMTP_EMAIL", "")
    SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
    SENDER = os.environ.get("SENDER_EMAIL", "hyeonsu.kim@lifescape.kr")

    try:
        # Build email
        msg = MIMEMultipart()
        msg["From"] = SENDER
        msg["To"] = RECIPIENT
        msg["Subject"] = f"[뚝딱.AI 문의] {name}님의 문의"
        msg["Reply-To"] = email

        body = (
            f"보낸 사람: {name}\n"
            f"이메일: {email}\n"
            f"문의 유형: {inquiry_type}\n"
            f"{'─' * 40}\n\n"
            f"{message}\n"
        )
        msg.attach(MIMEText(body, "plain", "utf-8"))

        # Attach file if provided
        if attachment and attachment.filename:
            file_data = await attachment.read()
            if len(file_data) > 10 * 1024 * 1024:
                return JSONResponse(status_code=400, content={"detail": "첨부파일은 10MB 이하만 가능합니다."})
            part = MIMEBase("application", "octet-stream")
            part.set_payload(file_data)
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f"attachment; filename={attachment.filename}")
            msg.attach(part)

        # Send via SMTP
        if not SMTP_USER or not SMTP_PASSWORD:
            os.makedirs("contact_messages", exist_ok=True)
            fallback_data = {
                "name": name, "email": email, "inquiry_type": inquiry_type,
                "message": message,
                "has_attachment": bool(attachment and attachment.filename),
                "timestamp": time.time()
            }
            filepath = os.path.join("contact_messages", f"contact_{int(time.time())}.json")
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(fallback_data, f, ensure_ascii=False, indent=2)
            print(f"CONTACT: SMTP not configured. Saved to {filepath}")
            return {"status": "saved", "message": "문의가 접수되었습니다."}

        with smtplib.SMTP_SSL("smtp.daum.net", 465) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"CONTACT: Email sent from {email} to {RECIPIENT}")
        return {"status": "sent", "message": "문의가 성공적으로 전송되었습니다."}

    except Exception as e:
        print(f"CONTACT ERROR: {str(e)}")
        return JSONResponse(status_code=500, content={"detail": f"이메일 전송 실패: {str(e)}"})

@app.get("/")
def root():
    return {"message": "Contact server running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
