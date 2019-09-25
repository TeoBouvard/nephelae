import json

from channels.generic.websocket import WebsocketConsumer

from .models import tracker

# propably some names to change in here

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
        tracker.db.remove_gps_observer(self)
        self.channel_layer.group_discard


    def add_gps(self, gps):
        message = tracker.prettify_gps(gps)
        self.send(json.dumps(message))


class SensorConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        tracker.db.add_sensor_observer(self)


    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        print(message)


    def disconnect(self, close_code):
        print("disconnecting")
        tracker.db.remove_sensor_observer(self)
        self.channel_layer.group_discard


    def add_sample(self, sample):
        if sample.variableName not in tracker.db_data_tags:
            return
        message = tracker.prettify_sample(sample)
        self.send(json.dumps(message))


class StatusConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        for uav in tracker.interface.uavs.values():
            uav.add_status_observer(self)


    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        print(message)


    def disconnect(self, close_code):
        for uav in tracker.interface.uavs.values():
            uav.remove_status_observer(self)
        self.channel_layer.group_discard


    def notify_status(self, status):
        self.send(json.dumps(status))
