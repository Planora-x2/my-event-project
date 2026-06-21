import threading
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class EmailThread(threading.Thread):
    def __init__(self, subject, message, recipient_list):
        self.subject = subject
        self.message = message
        self.recipient_list = recipient_list
        threading.Thread.__init__(self)

    def run(self):
        try:
            send_mail(
                subject=self.subject,
                message=self.message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=self.recipient_list,
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Failed to send async email to {self.recipient_list}: {str(e)}")

def send_async_email(subject, message, recipient_list):
    """
    Utility function to send emails without blocking the main request thread.
    """
    EmailThread(subject, message, recipient_list).start()
