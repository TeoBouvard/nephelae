import json

from channels.generic.websocket import WebsocketConsumer

try:
    from .models.common import scenario, db_data_tags
except Exception as e:
    # Have to do this because #@%*&@^*! django is hiding exceptions
   print("# Caught exception #############################################\n    ", e)
   exc_type, exc_obj, exc_tb = sys.exc_info()
   fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
   print(exc_type, fname, exc_tb.tb_lineno,
         end="\n############################################################\n\n\n")
   raise e

# propably some names to change in here

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
            'position': [status.lat, status.long, status.alt],
            'speed'   : status.speed,
            'time'    : status.position.t}))


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
        if sample.variableName not in db_data_tags:
            return
        message = {'uav_id':       sample.producer,
                   'variable_name':sample.variableName,
                   'position':     sample.position.data.tolist(),
                   'data':         sample.data}
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


    def add_status(self, status):
        self.send(json.dumps(status.to_dict()))
