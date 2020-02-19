import json

from channels.generic.websocket import WebsocketConsumer

try:
    from ..models.common import scenario
except Exception as e:
    import sys
    import os
    # Have to do this because #@%*&@^*! django is hiding exceptions
    print("# Caught exception #############################################\n    ", e, flush=True)
    exc_type, exc_obj, exc_tb = sys.exc_info()
    fname = exc_tb.tb_frame.f_code.co_filename
    print(exc_type, fname, exc_tb.tb_lineno,
         end="\n############################################################\n\n\n", flush=True)
    raise e


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


    def add_status(self, status):
        self.send(json.dumps(status.to_dict()))


class MissionUploadConsumer(WebsocketConsumer):

    def connect(self):
        self.accept()
        for aircraft in scenario.aircrafts.values():
            aircraft.attach_observer(self, 'mission_uploaded')

    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        print(message)

    def disconnect(self, close_code):
        for aircraft in scenario.aircrafts.values():
            aircraft.detach_observer(self, 'mission_uploaded')
        self.channel_layer.group_discard

    def mission_uploaded(self):
        self.send(json.dumps({"mission":"uploaded"}))


class PendingMissionsConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        for aircraft in scenario.aircrafts.values():
            aircraft.attach_observer(self, 'pending_missions_updated')


    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        print(message)


    def disconnect(self, close_code):
        for aircraft in scenario.aircrafts.values():
            aircraft.detach_observer(self, 'pending_missions_updated')
        self.channel_layer.group_discard


    def pending_missions_updated(self, event):
        self.send(json.dumps({
            'aircraftId' : event['mission'].aircraftId,
            'event'      : event['event'],
            'mission'    : event['mission'].to_dict()}))


class GPSConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        scenario.database.add_status_observer(self)


    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        print(message)


    def disconnect(self, close_code):
        scenario.database.remove_status_observer(self)
        self.channel_layer.group_discard


    def add_status(self, status):
        self.send(json.dumps({
            'uav_id'  : status.aircraftId,
            'heading' : status.heading,
            'position': [status.lat, status.long, status.position.z],
            'speed'   : status.speed,
            'time'    : status.position.t}))

