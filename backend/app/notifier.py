import logging
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Optional, Any, Union
import json
import aiohttp
import asyncio

from .config import settings

logger = logging.getLogger(__name__)

class Notifier:
    """Handles sending notifications via email and Slack."""
    
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"  # Default, can be overridden in settings
        self.smtp_port = 587  # Default, can be overridden in settings
        self.slack_webhook_url = settings.SLACK_WEBHOOK_URL
    
    async def send_notification(
        self, 
        message: str, 
        subject: Optional[str] = None,
        notification_type: str = "info",
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send a notification via the appropriate channels.
        
        Args:
            message: The main notification message
            subject: Optional subject line (for email)
            notification_type: Type of notification ('info', 'warning', 'error', 'success')
            data: Additional data to include in the notification
            
        Returns:
            Dictionary with results from each notification channel
        """
        if not subject:
            subject = f"{notification_type.upper()}: Price Comparison Alert"
        
        results = {
            "email": None,
            "slack": None
        }
        
        # Send email notifications if enabled
        if settings.EMAIL_NOTIFICATIONS and settings.EMAIL_FROM and settings.EMAIL_TO:
            results["email"] = await self._send_email(
                to_emails=settings.EMAIL_TO,
                subject=subject,
                message=message,
                notification_type=notification_type,
                data=data
            )
        
        # Send Slack notification if webhook URL is configured
        if self.slack_webhook_url:
            results["slack"] = await self._send_slack(
                message=message,
                subject=subject,
                notification_type=notification_type,
                data=data
            )
        
        return results
    
    async def _send_email(
        self,
        to_emails: List[str],
        subject: str,
        message: str,
        notification_type: str = "info",
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send an email notification."""
        if not settings.EMAIL_PASSWORD:
            return {"success": False, "error": "Email password not configured"}
        
        try:
            # Create message container
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.EMAIL_FROM
            msg["To"] = ", ".join(to_emails)
            
            # Create the HTML version of the message
            html = f"""
            <html>
                <body>
                    <h2 style="color: {'#4CAF50' if notification_type == 'success' else '#f39c12' if notification_type == 'warning' else '#e74c3c' if notification_type == 'error' else '#3498db'}">
                        {subject}
                    </h2>
                    <p>{message}</p>
            """
            
            if data:
                html += "<h3>Details:</h3><pre>"
                html += json.dumps(data, indent=2)
                html += "</pre>"
            
            html += """
                    <p><small>This is an automated message. Please do not reply to this email.</small></p>
                </body>
            </html>
            """
            
            # Attach parts into message container
            msg.attach(MIMEText(html, "html"))
            
            # Create secure connection with server and send email
            context = ssl.create_default_context()
            
            # Use a thread pool executor for the synchronous SMTP operations
            def _send():
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls(context=context)
                    server.login(settings.EMAIL_FROM, settings.EMAIL_PASSWORD)
                    server.send_message(msg)
            
            # Run the synchronous code in a thread pool
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, _send)
            
            return {"success": True, "message": "Email sent successfully"}
            
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return {"success": False, "error": str(e)}
    
    async def _send_slack(
        self,
        message: str,
        subject: str = "",
        notification_type: str = "info",
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send a Slack notification using a webhook."""
        if not self.slack_webhook_url:
            return {"success": False, "error": "Slack webhook URL not configured"}
        
        try:
            # Determine color based on notification type
            color_map = {
                "success": "#36a64f",
                "warning": "#ffcc00",
                "error": "#ff0000",
                "info": "#439FE0"
            }
            
            color = color_map.get(notification_type.lower(), "#439FE0")
            
            # Prepare the payload
            payload = {
                "attachments": [
                    {
                        "fallback": f"{subject}: {message}",
                        "color": color,
                        "title": subject,
                        "text": message,
                        "fields": [],
                        "footer": "Price Comparison Scraper",
                        "ts": int(time.time())
                    }
                ]
            }
            
            # Add data as fields if provided
            if data:
                for key, value in data.items():
                    if isinstance(value, (dict, list)):
                        value = f"```{json.dumps(value, indent=2)}```"
                    payload["attachments"][0]["fields"].append({
                        "title": key,
                        "value": str(value),
                        "short": len(str(value)) < 30
                    })
            
            # Send the request
            headers = {"Content-Type": "application/json"}
            timeout = aiohttp.ClientTimeout(total=10)
            
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(
                    self.slack_webhook_url,
                    json=payload,
                    headers=headers
                ) as response:
                    if response.status == 200:
                        return {"success": True, "message": "Slack notification sent successfully"}
                    else:
                        error_text = await response.text()
                        return {
                            "success": False,
                            "error": f"Slack API error: {response.status} - {error_text}"
                        }
                        
        except Exception as e:
            logger.error(f"Error sending Slack notification: {e}")
            return {"success": False, "error": str(e)}

# Global instance
notifier = Notifier()
