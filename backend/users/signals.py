from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in
from django.utils import timezone
from allauth.account.signals import user_signed_up
from .utils import send_async_email
import logging

logger = logging.getLogger(__name__)

@receiver(user_logged_in)
def send_login_alert(sender, request, user, **kwargs):
    """
    Sends an email alert whenever a user successfully logs in.
    """
    if not user.email:
        return
        
    time_str = timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')
    
    # Try to get IP address
    ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'Unknown IP'))
    
    subject = "New Login Alert - Eternally Yours"
    message = f"""
Hello {user.username},

We noticed a new login to your Eternally Yours account.

Time: {time_str}
IP Address: {ip_address}

If this was you, you can safely ignore this email.
If you did not authorize this login, please change your password immediately and contact support.

Best regards,
The Eternally Yours Security Team
    """
    
    logger.info(f"Triggering login alert email for {user.email}")
    send_async_email(subject, message, [user.email])

@receiver(user_signed_up)
def send_welcome_email(request, user, **kwargs):
    """
    Sends a welcome email when a user registers via allauth/dj-rest-auth.
    """
    if not user.email:
        return
        
    subject = "Welcome to Eternally Yours!"
    message = f"""
Hello {user.username},

Welcome to Eternally Yours! We're thrilled to have you join our community.

Whether you're planning your perfect wedding or offering your extraordinary services, our platform is designed to make the journey seamless and elegant.

If you have any questions, feel free to reach out to our support team.

Best regards,
The Eternally Yours Team
    """
    
    logger.info(f"Triggering welcome email for newly registered user {user.email}")
    send_async_email(subject, message, [user.email])
