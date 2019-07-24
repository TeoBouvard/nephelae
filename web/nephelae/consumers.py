from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
import json

class DataConsumer(WebsocketConsumer):
    def connect(self):
        print('Connecting websocket')
        self.accept()

    def disconnect(self, close_code):
        print('Disconnecting websocket')
        self.channel_layer.group_discard

    # Receive message from WebSocket
    def receive(self, text_data):
        #text_data_json = json.loads(text_data)
        #message = text_data_json['message']
        print(text_data)
        self.send('hello boy')