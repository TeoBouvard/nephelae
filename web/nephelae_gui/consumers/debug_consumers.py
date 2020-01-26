import json
import numpy as np

from channels.generic.websocket import WebsocketConsumer

try:
    from ..models.common import scenario, db_data_tags
    from ..models.common import websockets_cloudData_ids
    from utm import from_latlon, to_latlon

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

class DebugTrackerConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        for aircraft in scenario.aircrafts.values():
            if hasattr(aircraft, 'add_debug_tracker_observer'):
                aircraft.add_debug_tracker_observer(self)
            else:
                print('No point observer detected for ' + aircraft.id)
        
    def disconnect(self, close_code):
        for aircraft in scenario.aircrafts.values():
            if hasattr(aircraft, 'remove_debug_tracker_observer'):
                aircraft.remove_debug_tracker_observer(self)
        self.channel_layer.group_discard
    
    def tracker_debug(self, debug_infos):
        print(debug_infos)
        if not debug_infos['stop']:
            x_axis = np.linspace(debug_infos['scaledArray'].bounds[0].min,
                    debug_infos['scaledArray'].bounds[0].max,
                debug_infos['scaledArray'].data.shape[0]).T.tolist()
            y_axis = np.linspace(debug_infos['scaledArray'].bounds[1].min,
                    debug_infos['scaledArray'].bounds[1].max,
                debug_infos['scaledArray'].data.shape[1]).T.tolist()
            data = [x.tolist() for x in debug_infos['scaledArray'].data.T]
            tracked_point = (debug_infos['x'], debug_infos['y'])
            old_tracked_point = (debug_infos['x_old'], debug_infos['y_old'])
            uav_position = (debug_infos['x_uav'], debug_infos['y_uav'])
            res = {'x_axis': x_axis, 'y_axis': y_axis, 'data': data,
                    'tracked_point': tracked_point, 'old_tracked_point':
                    old_tracked_point, 'centers': debug_infos['centers'],
                    'producer': debug_infos['producer'],
                    'time':debug_infos['t'], 'stop': False,
                    'uav_position': uav_position,}
        else :
            res = {'stop': True, 'producer': debug_infos['producer']}
        self.send(json.dumps(res))
