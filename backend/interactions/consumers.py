import json
from channels.generic.websocket import AsyncWebsocketConsumer
# from confluent_kafka import Producer

# kafka_conf = {'bootstrap.servers': 'localhost:9092'}
# producer = Producer(**kafka_conf)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = self.room_name

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        # TODO: Push to Kafka topic for processing/persistence when Kafka is running
        # producer.produce('chat-messages', key=self.room_name, value=message)
        # producer.flush()

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        sender_name = event.get('sender_name', 'Unknown')
        timestamp = event.get('timestamp', '')

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'sender_name': sender_name,
            'timestamp': timestamp
        }))
