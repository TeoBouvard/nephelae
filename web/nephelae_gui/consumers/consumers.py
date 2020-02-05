import json
import time

from channels.generic.websocket import WebsocketConsumer

try:
    from ..models.common import scenario, db_data_tags
    from ..models.common import websockets_cloudData_ids
    from ..models.common import refreshers
    from utm import from_latlon, to_latlon

    from nephelae_paparazzi.common import messageInterface

    localFrame = scenario.localFrame
    windMap = scenario.windMap

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

# propably some names to change in here


class SensorConsumer(WebsocketConsumer):
    def __init__(self, time_limit, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.list_of_messages = []
        self.time_limit = time_limit
        self.start_time = time.perf_counter()

    def connect(self):
        self.accept()
        for key in scenario.dataviews.displayedViews:
            scenario.dataviews[key].attach_observer(self)


    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        print(message)


    def disconnect(self, close_code):
        print("disconnecting")
        for key in scenario.dataviews.displayedViews:
            scenario.dataviews[key].detach_observer(self)
        self.channel_layer.group_discard


    def add_sample(self, sample):
        if sample.variableName not in db_data_tags:
            return
        message = {'uav_id':       sample.producer,
                   'variable_name':sample.variableName,
                   'position':     sample.position.data.tolist(),
                   'data':         sample.data}
        self.list_of_messages.append(message)
        time_now = time.perf_counter()
        if(time_now-self.start_time >= self.time_limit):
            self.start_time = time_now
            self.send(json.dumps(self.list_of_messages))
            self.list_of_messages = []

class PointConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        for aircraft in scenario.aircrafts.values():
            if hasattr(aircraft, 'add_point_observer'):
                aircraft.add_point_observer(self)
            else:
                print('No point observer detected for ' + aircraft.id)

    def disconnect(self, close_code):
        for aircraft in scenario.aircrafts.values():
            if hasattr(aircraft, 'remove_point_observer'):
                aircraft.remove_point_observer(self)
        self.channel_layer.group_discard

    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        print(message)

    def new_point(self, infos):
        position = list(to_latlon(infos['x']
            + localFrame.utm_east, infos['y'] + localFrame.utm_north,
            localFrame.utm_number, localFrame.utm_letter))
        infos['lat'] = position[0]
        infos['lng'] = position[1]
        self.send(json.dumps(infos))


class CloudDataConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.id_client = args[0]['url_route']['kwargs']['id_client']

    def connect(self):
        self.accept()
        websockets_cloudData_ids[self.id_client] = self

    def disconnect(self, close_code):
        del websockets_cloudData_ids[self.id_client]
        self.channel_layer.group_discard
        print("Id Client Cloud Data " + self.id_client + " disconnected")

    def send_cloud_data(self, variable, cloudsData):
        res = {}
        res[variable] = []
        for i in range(len(cloudsData)):
            bounding_box = cloudsData[i].get_bounding_box()
            south_west = tuple(x.min for x in bounding_box)
            north_east = tuple(x.max for x in bounding_box)
            res[variable].append({'center_of_mass': cloudsData[i].get_com(),
                'center_of_mass_latlon': to_latlon(cloudsData[i].get_com()[0] +
                    localFrame.utm_east, cloudsData[i].get_com()[1] +
                    localFrame.utm_north, localFrame.utm_number,
                    localFrame.utm_letter),
                'surface': cloudsData[i].get_surface(),
                'box': [north_east, south_west],
                'box_latlon': [to_latlon(north_east[0] + localFrame.utm_east,
                        north_east[1] + localFrame.utm_north,
                        localFrame.utm_number, localFrame.utm_letter),
                    to_latlon(south_west[0] + localFrame.utm_east,
                        south_west[1] + localFrame.utm_north, 
                        localFrame.utm_number, localFrame.utm_letter)]})
        self.send(json.dumps(res))

class WindConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        windMap.add_wind_observer(self)

    def disconnect(self, close_code):
        windMap.remove_wind_observer(self)
        self.channel_layer.group_discard

    def send_new_wind(self, wind):
        self.send(json.dumps({'north_wind': wind[1], 'east_wind': wind[0]}))


class WindInfoConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        print("New websocket", flush=True, end='\n\n\n\n')
        self.bindId = messageInterface.bind(self.send_new_wind, '(ground_dl WIND_INFO .*)')
        print("New websocket", flush=True, end='\n\n\n\n')

    def disconnect(self, close_code):
        messageInterface.unbind(self.bindId)
        self.channel_layer.group_discard

    def send_new_wind(self, windInfo):
        print("Got wind message\n:", windInfo, flush=True, end='\n\n\n\n')
        self.send(json.dumps({'aircraftId': windInfo['ac_id'],
                              'east_wind' : windInfo['east'],
                              'north_wind': windInfo['north']}))


class RefreshNotifier(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.type = args[0]['url_route']['kwargs']['type']
    
    def connect(self):
        self.accept()
        if not self.type in refreshers.keys():
            refreshers[self.type] = []
        refreshers[self.type].append(self)

    def disconnect(self, close_code):
        refreshers[self.type].remove(self)
        self.channel_layer.group_discard

    def send_refresh_signal(self, obj_id):
        res = {'type': self.type}
        for (key, value) in obj_id.items():
            res[key] = value;
        self.send(json.dumps(res))

