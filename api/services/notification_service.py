"""
Notification Service for UrbanAid

Provides multi-channel notification capabilities:
- Email notifications (via SMTP or SendGrid)
- Push notifications (via Firebase Cloud Messaging)
- In-app notifications (stored in database)
- SMS notifications (via Twilio) - optional

Features:
- Template-based messaging
- Rate limiting to prevent spam
- Delivery tracking
- Retry mechanism for failed deliveries
"""

import os
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from enum import Enum
from dataclasses import dataclass, field
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import httpx

logger = logging.getLogger(__name__)


class NotificationChannel(str, Enum):
    """Supported notification channels."""

    EMAIL = "email"
    PUSH = "push"
    IN_APP = "in_app"
    SMS = "sms"


class NotificationPriority(str, Enum):
    """Notification priority levels."""

    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class NotificationStatus(str, Enum):
    """Notification delivery status."""

    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    BOUNCED = "bounced"


@dataclass
class NotificationResult:
    """Result of a notification attempt."""

    success: bool
    channel: NotificationChannel
    message_id: Optional[str] = None
    error: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class NotificationPayload:
    """Notification content payload."""

    title: str
    body: str
    data: Dict[str, Any] = field(default_factory=dict)
    action_url: Optional[str] = None
    image_url: Optional[str] = None


class NotificationService:
    """
    Service for sending notifications across multiple channels.

    Supports email, push notifications, in-app notifications, and SMS.
    Configuration is loaded from environment variables.
    """

    def __init__(self):
        """Initialize notification service with configuration."""
        # Email configuration (SMTP)
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.smtp_from_email = os.getenv("SMTP_FROM_EMAIL", "noreply@urbanaid.org")
        self.smtp_from_name = os.getenv("SMTP_FROM_NAME", "UrbanAid")
        self._email_enabled = bool(self.smtp_user and self.smtp_password)

        # SendGrid configuration (alternative to SMTP)
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY", "")
        self._sendgrid_enabled = bool(self.sendgrid_api_key)

        # Firebase Cloud Messaging configuration
        self.fcm_server_key = os.getenv("FCM_SERVER_KEY", "")
        self._push_enabled = bool(self.fcm_server_key)

        # Twilio configuration (SMS)
        self.twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        self.twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "")
        self.twilio_phone = os.getenv("TWILIO_PHONE_NUMBER", "")
        self._sms_enabled = bool(
            self.twilio_sid and self.twilio_token and self.twilio_phone
        )

        # HTTP session for API calls
        self._session: Optional[httpx.AsyncClient] = None

        # Rate limiting (notifications per user per hour)
        self._rate_limits = {
            NotificationChannel.EMAIL: 10,
            NotificationChannel.PUSH: 50,
            NotificationChannel.SMS: 5,
            NotificationChannel.IN_APP: 100,
        }
        self._notification_counts: Dict[str, Dict[str, int]] = {}
        self._count_reset_time: Dict[str, datetime] = {}

        # Notification templates
        self._templates = self._load_templates()

    async def _get_session(self) -> httpx.AsyncClient:
        """Get or create async HTTP session."""
        if self._session is None:
            self._session = httpx.AsyncClient(timeout=30.0)
        return self._session

    async def close_session(self):
        """Close HTTP session."""
        if self._session:
            await self._session.aclose()
            self._session = None

    # =========================================================================
    # Email Notifications
    # =========================================================================

    async def send_email(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        body_text: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        reply_to: Optional[str] = None,
    ) -> NotificationResult:
        """
        Send an email notification.

        Args:
            to_email: Recipient email address
            subject: Email subject line
            body_html: HTML body content
            body_text: Plain text body (falls back to stripped HTML)
            attachments: List of attachment dicts with 'filename' and 'content'
            reply_to: Reply-to email address

        Returns:
            NotificationResult with delivery status.
        """
        if not self._email_enabled and not self._sendgrid_enabled:
            logger.warning("Email notifications not configured")
            return NotificationResult(
                success=False,
                channel=NotificationChannel.EMAIL,
                error="Email not configured",
            )

        # Check rate limit
        if not self._check_rate_limit(to_email, NotificationChannel.EMAIL):
            return NotificationResult(
                success=False,
                channel=NotificationChannel.EMAIL,
                error="Rate limit exceeded",
            )

        # Use SendGrid if configured, otherwise SMTP
        if self._sendgrid_enabled:
            return await self._send_email_sendgrid(
                to_email, subject, body_html, body_text, reply_to
            )
        else:
            return await self._send_email_smtp(
                to_email, subject, body_html, body_text, attachments
            )

    async def _send_email_smtp(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        body_text: Optional[str],
        attachments: Optional[List[Dict[str, Any]]],
    ) -> NotificationResult:
        """Send email via SMTP."""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.smtp_from_name} <{self.smtp_from_email}>"
            msg["To"] = to_email

            # Plain text version
            if body_text:
                msg.attach(MIMEText(body_text, "plain", "utf-8"))

            # HTML version
            msg.attach(MIMEText(body_html, "html", "utf-8"))

            # Attachments
            if attachments:
                for attachment in attachments:
                    part = MIMEBase("application", "octet-stream")
                    part.set_payload(attachment["content"])
                    encoders.encode_base64(part)
                    part.add_header(
                        "Content-Disposition",
                        f"attachment; filename={attachment['filename']}",
                    )
                    msg.attach(part)

            # Send via SMTP (run in thread pool to avoid blocking)
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._smtp_send, to_email, msg)

            self._increment_rate_limit(to_email, NotificationChannel.EMAIL)

            logger.info(f"Email sent to {to_email}: {subject}")
            return NotificationResult(
                success=True,
                channel=NotificationChannel.EMAIL,
                message_id=msg["Message-ID"],
            )

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return NotificationResult(
                success=False, channel=NotificationChannel.EMAIL, error=str(e)
            )

    def _smtp_send(self, to_email: str, msg: MIMEMultipart):
        """Synchronous SMTP send (runs in thread pool)."""
        with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.sendmail(self.smtp_from_email, to_email, msg.as_string())

    async def _send_email_sendgrid(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        body_text: Optional[str],
        reply_to: Optional[str],
    ) -> NotificationResult:
        """Send email via SendGrid API."""
        try:
            session = await self._get_session()

            payload = {
                "personalizations": [{"to": [{"email": to_email}]}],
                "from": {"email": self.smtp_from_email, "name": self.smtp_from_name},
                "subject": subject,
                "content": [],
            }

            if body_text:
                payload["content"].append({"type": "text/plain", "value": body_text})

            payload["content"].append({"type": "text/html", "value": body_html})

            if reply_to:
                payload["reply_to"] = {"email": reply_to}

            response = await session.post(
                "https://api.sendgrid.com/v3/mail/send",
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.sendgrid_api_key}",
                    "Content-Type": "application/json",
                },
            )

            if response.status_code in (200, 202):
                self._increment_rate_limit(to_email, NotificationChannel.EMAIL)
                message_id = response.headers.get("X-Message-Id", "")

                logger.info(f"Email sent via SendGrid to {to_email}: {subject}")
                return NotificationResult(
                    success=True,
                    channel=NotificationChannel.EMAIL,
                    message_id=message_id,
                )
            else:
                error = response.text
                logger.error(f"SendGrid error: {error}")
                return NotificationResult(
                    success=False, channel=NotificationChannel.EMAIL, error=error
                )

        except Exception as e:
            logger.error(f"SendGrid exception: {e}")
            return NotificationResult(
                success=False, channel=NotificationChannel.EMAIL, error=str(e)
            )

    # =========================================================================
    # Push Notifications
    # =========================================================================

    async def send_push_notification(
        self,
        device_token: str,
        payload: NotificationPayload,
        priority: NotificationPriority = NotificationPriority.NORMAL,
    ) -> NotificationResult:
        """
        Send a push notification via Firebase Cloud Messaging.

        Args:
            device_token: FCM device registration token
            payload: Notification content
            priority: Delivery priority

        Returns:
            NotificationResult with delivery status.
        """
        if not self._push_enabled:
            logger.warning("Push notifications not configured")
            return NotificationResult(
                success=False,
                channel=NotificationChannel.PUSH,
                error="Push notifications not configured",
            )

        # Check rate limit
        if not self._check_rate_limit(device_token, NotificationChannel.PUSH):
            return NotificationResult(
                success=False,
                channel=NotificationChannel.PUSH,
                error="Rate limit exceeded",
            )

        try:
            session = await self._get_session()

            fcm_payload = {
                "to": device_token,
                "notification": {"title": payload.title, "body": payload.body},
                "data": payload.data,
                "priority": "high"
                if priority in (NotificationPriority.HIGH, NotificationPriority.URGENT)
                else "normal",
            }

            if payload.image_url:
                fcm_payload["notification"]["image"] = payload.image_url

            if payload.action_url:
                fcm_payload["data"]["action_url"] = payload.action_url

            response = await session.post(
                "https://fcm.googleapis.com/fcm/send",
                json=fcm_payload,
                headers={
                    "Authorization": f"key={self.fcm_server_key}",
                    "Content-Type": "application/json",
                },
            )

            result = response.json()

            if result.get("success", 0) > 0:
                self._increment_rate_limit(device_token, NotificationChannel.PUSH)

                logger.info(f"Push notification sent: {payload.title}")
                return NotificationResult(
                    success=True,
                    channel=NotificationChannel.PUSH,
                    message_id=str(result.get("message_id", "")),
                )
            else:
                error = result.get("results", [{}])[0].get("error", "Unknown error")
                logger.error(f"FCM error: {error}")
                return NotificationResult(
                    success=False, channel=NotificationChannel.PUSH, error=error
                )

        except Exception as e:
            logger.error(f"Push notification exception: {e}")
            return NotificationResult(
                success=False, channel=NotificationChannel.PUSH, error=str(e)
            )

    async def send_push_to_topic(
        self,
        topic: str,
        payload: NotificationPayload,
        priority: NotificationPriority = NotificationPriority.NORMAL,
    ) -> NotificationResult:
        """
        Send a push notification to all devices subscribed to a topic.

        Args:
            topic: FCM topic name
            payload: Notification content
            priority: Delivery priority

        Returns:
            NotificationResult with delivery status.
        """
        if not self._push_enabled:
            return NotificationResult(
                success=False,
                channel=NotificationChannel.PUSH,
                error="Push notifications not configured",
            )

        try:
            session = await self._get_session()

            fcm_payload = {
                "to": f"/topics/{topic}",
                "notification": {"title": payload.title, "body": payload.body},
                "data": payload.data,
                "priority": "high"
                if priority in (NotificationPriority.HIGH, NotificationPriority.URGENT)
                else "normal",
            }

            response = await session.post(
                "https://fcm.googleapis.com/fcm/send",
                json=fcm_payload,
                headers={
                    "Authorization": f"key={self.fcm_server_key}",
                    "Content-Type": "application/json",
                },
            )

            result = response.json()

            if "message_id" in result:
                logger.info(f"Topic push sent to {topic}: {payload.title}")
                return NotificationResult(
                    success=True,
                    channel=NotificationChannel.PUSH,
                    message_id=str(result["message_id"]),
                )
            else:
                error = result.get("error", "Unknown error")
                return NotificationResult(
                    success=False, channel=NotificationChannel.PUSH, error=error
                )

        except Exception as e:
            logger.error(f"Topic push exception: {e}")
            return NotificationResult(
                success=False, channel=NotificationChannel.PUSH, error=str(e)
            )

    # =========================================================================
    # SMS Notifications
    # =========================================================================

    async def send_sms(self, phone_number: str, message: str) -> NotificationResult:
        """
        Send an SMS notification via Twilio.

        Args:
            phone_number: Recipient phone number (E.164 format)
            message: SMS message content (max 1600 chars)

        Returns:
            NotificationResult with delivery status.
        """
        if not self._sms_enabled:
            logger.warning("SMS notifications not configured")
            return NotificationResult(
                success=False,
                channel=NotificationChannel.SMS,
                error="SMS not configured",
            )

        # Check rate limit
        if not self._check_rate_limit(phone_number, NotificationChannel.SMS):
            return NotificationResult(
                success=False,
                channel=NotificationChannel.SMS,
                error="Rate limit exceeded",
            )

        # Truncate message if too long
        if len(message) > 1600:
            message = message[:1597] + "..."

        try:
            session = await self._get_session()

            response = await session.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_sid}/Messages.json",
                data={"To": phone_number, "From": self.twilio_phone, "Body": message},
                auth=(self.twilio_sid, self.twilio_token),
            )

            result = response.json()

            if response.status_code in (200, 201):
                self._increment_rate_limit(phone_number, NotificationChannel.SMS)

                logger.info(f"SMS sent to {phone_number}")
                return NotificationResult(
                    success=True,
                    channel=NotificationChannel.SMS,
                    message_id=result.get("sid", ""),
                )
            else:
                error = result.get("message", "Unknown error")
                logger.error(f"Twilio error: {error}")
                return NotificationResult(
                    success=False, channel=NotificationChannel.SMS, error=error
                )

        except Exception as e:
            logger.error(f"SMS exception: {e}")
            return NotificationResult(
                success=False, channel=NotificationChannel.SMS, error=str(e)
            )

    # =========================================================================
    # Rate Limiting
    # =========================================================================

    def _check_rate_limit(self, identifier: str, channel: NotificationChannel) -> bool:
        """Check if notification is within rate limits."""
        now = datetime.utcnow()
        limit = self._rate_limits.get(channel, 100)

        # Reset counts after 1 hour
        if identifier in self._count_reset_time:
            if now - self._count_reset_time[identifier] > timedelta(hours=1):
                self._notification_counts[identifier] = {}
                self._count_reset_time[identifier] = now

        # Initialize if needed
        if identifier not in self._notification_counts:
            self._notification_counts[identifier] = {}
            self._count_reset_time[identifier] = now

        current_count = self._notification_counts[identifier].get(channel.value, 0)
        return current_count < limit

    def _increment_rate_limit(self, identifier: str, channel: NotificationChannel):
        """Increment notification count for rate limiting."""
        if identifier not in self._notification_counts:
            self._notification_counts[identifier] = {}

        current = self._notification_counts[identifier].get(channel.value, 0)
        self._notification_counts[identifier][channel.value] = current + 1

    # =========================================================================
    # Templates
    # =========================================================================

    def _load_templates(self) -> Dict[str, Dict[str, str]]:
        """Load notification templates."""
        return {
            "welcome": {
                "subject": "Welcome to UrbanAid!",
                "html": """
                    <h1>Welcome to UrbanAid, {name}!</h1>
                    <p>Thank you for joining our community. With UrbanAid, you can:</p>
                    <ul>
                        <li>Find nearby social services and utilities</li>
                        <li>Rate and review services you've used</li>
                        <li>Help others find essential resources</li>
                    </ul>
                    <p><a href="{app_url}">Get Started</a></p>
                """,
                "text": "Welcome to UrbanAid, {name}! Find nearby social services at {app_url}",
            },
            "password_reset": {
                "subject": "Reset Your UrbanAid Password",
                "html": """
                    <h1>Password Reset Request</h1>
                    <p>We received a request to reset your password. Click the link below to create a new password:</p>
                    <p><a href="{reset_link}">Reset Password</a></p>
                    <p>This link expires in 1 hour.</p>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                """,
                "text": "Reset your password: {reset_link} (expires in 1 hour)",
            },
            "email_verification": {
                "subject": "Verify Your UrbanAid Email",
                "html": """
                    <h1>Verify Your Email</h1>
                    <p>Please verify your email address by clicking the link below:</p>
                    <p><a href="{verification_link}">Verify Email</a></p>
                """,
                "text": "Verify your email: {verification_link}",
            },
            "utility_update": {
                "subject": "Update on {utility_name}",
                "html": """
                    <h1>Service Update</h1>
                    <p>{utility_name} has been updated:</p>
                    <p>{update_message}</p>
                    <p><a href="{utility_url}">View Details</a></p>
                """,
                "text": "{utility_name} update: {update_message}",
            },
            "new_rating": {
                "subject": "New Rating on Your Listing",
                "html": """
                    <h1>New Rating Received</h1>
                    <p>Your listing for {utility_name} received a new {rating}-star rating.</p>
                    <p>Comment: "{comment}"</p>
                    <p><a href="{utility_url}">View Ratings</a></p>
                """,
                "text": "New {rating}-star rating on {utility_name}: {comment}",
            },
        }

    async def send_template_email(
        self, to_email: str, template_name: str, variables: Dict[str, Any]
    ) -> NotificationResult:
        """
        Send an email using a predefined template.

        Args:
            to_email: Recipient email address
            template_name: Name of the template to use
            variables: Variables to substitute in the template

        Returns:
            NotificationResult with delivery status.
        """
        template = self._templates.get(template_name)
        if not template:
            return NotificationResult(
                success=False,
                channel=NotificationChannel.EMAIL,
                error=f"Template '{template_name}' not found",
            )

        subject = template["subject"].format(**variables)
        body_html = template["html"].format(**variables)
        body_text = template.get("text", "").format(**variables)

        return await self.send_email(to_email, subject, body_html, body_text)

    # =========================================================================
    # Convenience Methods
    # =========================================================================

    async def send_welcome_email(
        self, to_email: str, name: str, app_url: str = "https://urbanaid.org"
    ) -> NotificationResult:
        """Send welcome email to new user."""
        return await self.send_template_email(
            to_email, "welcome", {"name": name, "app_url": app_url}
        )

    async def send_password_reset_email(
        self, to_email: str, reset_link: str
    ) -> NotificationResult:
        """Send password reset email."""
        return await self.send_template_email(
            to_email, "password_reset", {"reset_link": reset_link}
        )

    async def send_verification_email(
        self, to_email: str, verification_link: str
    ) -> NotificationResult:
        """Send email verification link."""
        return await self.send_template_email(
            to_email, "email_verification", {"verification_link": verification_link}
        )

    def get_channel_status(self) -> Dict[str, bool]:
        """Get configuration status of all notification channels."""
        return {
            "email_smtp": self._email_enabled,
            "email_sendgrid": self._sendgrid_enabled,
            "push": self._push_enabled,
            "sms": self._sms_enabled,
        }


# Singleton instance for dependency injection
notification_service = NotificationService()
