import json
import urllib

from channels.generic.websocket import WebsocketConsumer

from .models import tracker


class GPSConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        tracker.db.add_gps_observer(self)


    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        print(message)


    def disconnect(self, close_code):
        #tracker.db.add_gps_observer(self)
        self.channel_layer.group_discard


    def add_gps(self, gps):
        message = tracker.prettify_gps(gps)
        self.send(json.dumps(message))


class SensorConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        self.id = urllib.parse.parse_qs(self.scope['query_string'].decode('utf8'))['uav_id'][0]
        tracker.db.add_sensor_observer(self)


    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']


    def disconnect(self, close_code):
        #tracker.db.add_gps_observer(self)
        self.channel_layer.group_discard


    def add_sample(self, sample):
        if sample.producer == self.id:
            message = tracker.prettify_sample(sample)
            self.send(json.dumps(message))
