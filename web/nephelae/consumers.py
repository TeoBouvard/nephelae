import json

from channels.generic.websocket import WebsocketConsumer

from .models import tracker


class GPSConsumer(WebsocketConsumer):
    def connect(self):
        print('Connecting websocket')
        self.accept()
        tracker.db.add_gps_observer(self)


    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        print(message)


    def disconnect(self, close_code):
        print('Disconnecting websocket')
        #tracker.db.add_gps_observer(self)
        self.channel_layer.group_discard


    def add_gps(self, gps):
        message = tracker.prettify(gps)
        self.send(json.dumps(tracker.prettify(gps)))
