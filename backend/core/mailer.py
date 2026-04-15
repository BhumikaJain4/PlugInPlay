from __future__ import annotations

import asyncio
import smtplib
from email.message import EmailMessage

import httpx


async def send_email(
    *,
    host: str,
    port: int,
    username: str,
    password: str,
    sender: str,
    recipient: str,
    subject: str,
    text_body: str,
    html_body: str | None = None,
    use_tls: bool = True,
    provider: str = "smtp",
    sendgrid_api_key: str = "",
    sendgrid_from: str = "",
) -> tuple[bool, str]:
    selected_provider = (provider or "auto").strip().lower()
    if selected_provider == "auto":
        selected_provider = "sendgrid" if sendgrid_api_key and sendgrid_from else "smtp"

    if selected_provider == "sendgrid":
        if not sendgrid_api_key or not sendgrid_from:
            return False, "SendGrid is selected but SENDGRID_API_KEY or SENDGRID_FROM is missing"

        payload = {
            "personalizations": [{"to": [{"email": recipient}]}],
            "from": {"email": sendgrid_from},
            "subject": subject,
            "content": [
                {"type": "text/plain", "value": text_body},
            ],
        }
        if html_body:
            payload["content"].append({"type": "text/html", "value": html_body})

        async def _send_sendgrid() -> None:
            headers = {
                "Authorization": f"Bearer {sendgrid_api_key}",
                "Content-Type": "application/json",
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    headers=headers,
                    json=payload,
                )
            if response.status_code >= 400:
                raise RuntimeError(response.text or f"SendGrid error {response.status_code}")

        try:
            await _send_sendgrid()
            return True, "Email sent via SendGrid"
        except Exception as exc:  # pragma: no cover - surfaced through API response
            return False, str(exc)

    if selected_provider == "smtp" and sendgrid_api_key and sendgrid_from:
        return await send_email(
            host=host,
            port=port,
            username=username,
            password=password,
            sender=sender,
            recipient=recipient,
            subject=subject,
            text_body=text_body,
            html_body=html_body,
            use_tls=use_tls,
            provider="sendgrid",
            sendgrid_api_key=sendgrid_api_key,
            sendgrid_from=sendgrid_from,
        )

    if not host or not sender:
        return False, "SMTP is not configured"

    def _send() -> None:
        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = sender
        message["To"] = recipient
        message.set_content(text_body)
        if html_body:
            message.add_alternative(html_body, subtype="html")

        with smtplib.SMTP(host, port, timeout=30) as server:
            if use_tls:
                server.starttls()
            if username and password:
                server.login(username, password)
            server.send_message(message)

    try:
        await asyncio.to_thread(_send)
        return True, "Email sent"
    except Exception as exc:  # pragma: no cover - surfaced through API response
        return False, str(exc)
