import json

from channels.generic.websocket import WebsocketConsumer

from .models.common import scenario

from .models.common import websockets_ids

from .models import tracker, hypercube

# propably some names to change in here

class GPSConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        scenario.database.add_gps_observer(self)


    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        print(message)


    def disconnect(self, close_code):
        scenario.database.remove_gps_observer(self)
        self.channel_layer.group_discard


    def add_gps(self, gps):
        message = tracker.prettify_gps(gps)
        self.send(json.dumps(message))


class SensorConsumer(WebsocketConsumer):
    def __init__(self, number_of_messages, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.list_of_messages = []
        self.number_of_messages = number_of_messages

    def connect(self):
        self.accept()
        scenario.database.add_sensor_observer(self)


    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        print(message)


    def disconnect(self, close_code):
        print("disconnecting")
        scenario.database.remove_sensor_observer(self)
        self.channel_layer.group_discard


    def add_sample(self, sample):
        if sample.variableName not in tracker.db_data_tags:
            return
        message = tracker.prettify_sample(sample)
        self.list_of_messages.append(message)
        if(len(self.list_of_messages) >= self.number_of_messages):
            self.send(json.dumps(self.list_of_messages))
            self.list_of_messages = []


class StatusConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        for aircraft in scenario.aircrafts.values():
            aircraft.add_status_observer(self)


    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        print(message)


    def disconnect(self, close_code):
        for aircraft in scenario.aircrafts.values():
            aircraft.remove_status_observer(self)
        self.channel_layer.group_discard


    def notify_status(self, status):
        self.send(json.dumps(status.to_dict()))

class CloudDataConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.id_client = args[0]['url_route']['kwargs']['id_client']

    def connect(self):
        self.accept()
        websockets_ids[self.id_client] = self

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        print(message)

    def disconnect(self, close_code):
        del websockets_ids[self.id_client]
        self.channel_layer.group_discard
        print("Id Client " + self.id_client + " disconnected")

    def send_cloud_data(self, variable, cloudsData, border):
        res = {}
        res[variable] = []
        for i in range(len(cloudsData)):
            res[variable].append(hypercube.prettify_cloud_data(cloudsData[i]))
        self.send(json.dumps(res))
