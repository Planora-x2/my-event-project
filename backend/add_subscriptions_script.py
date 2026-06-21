import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Subscription

def add_subscriptions():
    clients = User.objects.filter(role='CLIENT')
    created_count = 0
    for client in clients:
        # Create an APPROVED subscription for each client if it doesn't exist
        subscription, created = Subscription.objects.get_or_create(
            client=client,
            defaults={
                'status': 'APPROVED',
                'period': 'Unlimited (Legacy)'
            }
        )
        if created:
            created_count += 1
            print(f"Created subscription for client: {client.username}")
        else:
            print(f"Client {client.username} already has a subscription.")

    print(f"\nDone! Created {created_count} subscriptions.")

if __name__ == '__main__':
    add_subscriptions()
