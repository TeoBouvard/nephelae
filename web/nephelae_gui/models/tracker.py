import os
import sys
from utm import to_latlon

from . import utils
from . import common

from .common import scenario

# Defines displayable samples, to keep for now. Find an alternative to put in scenario
db_data_tags = ['RCT', 'WT', 'THT'] 

db = scenario.database

# nav_frame = list(to_latlon(scenario.localFrame.position.x,
#                            scenario.localFrame.position.y,
#                            scenario.localFrame.utm_zone,
#                            northern=True))
# print(nav_frame)

nav_frame   = utils.local_frame_latlon()
flight_area = utils.flight_area_latlon()


def discover():
    uavs = {}
    for key in scenario.aircrafts.keys():
        uavs[key] = {}
        uavs[key]['id'] = str(key)
        uavs[key]['name'] = scenario.aircrafts[key].config.ac_name
        uavs[key]['gui_color'] = scenario.aircrafts[key].config.default_gui_color
    # return {'origin': nav_frame, 'uavs':uavs, 'sample_tags':db_data_tags}
    return {'origin': nav_frame, 'uavs':uavs, 'sample_tags':db_data_tags, 'flight_area': flight_area}


# GPS time is *absolute*, but SAMPLE time is relative to navFrame
def get_positions(uav_ids, trail_length, reality=True):
    
    positions = dict()

    for uav_id in uav_ids:

        messages = [entry.data for entry in db.find_entries(['GPS', str(uav_id)], (slice(-trail_length, None, -1), ), lambda entry: entry.data.stamp)]

        # Gather most recent information for display
        positions[uav_id] = {
            'heading': messages[-1]['course'],
            'speed': messages[-1]['speed'],
            'time': messages[-1]['stamp'] - db.navFrame['stamp']
        }

        for message in messages:
            
            if reality:
                position = utils.utm_to_latlon(message)
            else:
                position = utils.compute_frame_position(message, nav_frame)
            if 'path' not in positions[uav_id]:
                positions[uav_id]['path'] = [position]
            else:
                positions[uav_id]['path'].append(position)
    return dict(positions=positions)
            
def get_positions_uavs_map(uav_ids, trail_length):

    positions = dict()
    for uav_id in uav_ids:
        messages = [entry.data for entry in db.find_entries(
            ['GPS', str(uav_id)], (slice(-trail_length, None, -1), ),
            lambda entry: entry.data.stamp)]

        # Gather most recent information for display
        positions[uav_id] = {
            'heading': messages[-1]['course'],
            'speed': messages[-1]['speed'],
            'time': messages[-1]['stamp'] - db.navFrame['stamp']
        }
        for message in messages:
            position = utils.utm_to_latlon(message)
            if 'path' not in positions[uav_id]:
                positions[uav_id]['path'] = [position]
            else:
                positions[uav_id]['path'].append(position)
            if 'times' not in positions[uav_id]:
                positions[uav_id]['times'] = [message['stamp'] -
                        db.navFrame['stamp']]
            else:
                positions[uav_id]['times'].append(message['stamp'] -
                        db.navFrame['stamp'])
    return dict(positions=positions)

def get_data(uav_ids, variables, start, end=None, step=-1):

    data = dict()
    for variable in variables:
        for uav_id in uav_ids:
            messages = [entry.data for entry in db.find_entries([variable, str(uav_id)], (slice(-start, end, step), ), lambda entry: entry.data.timeStamp)]

            for message in messages:

                if uav_id not in data.keys():
                    data[uav_id] = dict()
                elif message.variableName not in data[uav_id].keys():
                    data[uav_id][message.variableName] = {
                        'positions': [message.position.data.tolist()],
                        'values': [message.data[0]],
                    }
                else:
                    data[uav_id][message.variableName]['positions'].append(message.position.data.tolist())
                    data[uav_id][message.variableName]['values'].append(message.data[0])
    return dict(data=data)

def get_state_at_time(uav_ids, variables, at_time):
    data = dict()
    for variable in variables:
        for uav_id in uav_ids:
            message = db[variable, str(uav_id)][float(at_time)][0].data
            if not uav_id in data.keys():
                data[uav_id] = dict()
            data[uav_id][message.variableName] = {
                    'positions': [message.position.data.tolist()],
                    'values': [message.data],
            }
    return data

def prettify_gps(message):

    return dict(
        uav_id=message.uavId,
        heading=message.course,
        position=utils.utm_to_latlon(message),
        speed=message.speed,
        time=int(message.stamp - db.navFrame.stamp)
    )


def prettify_sample(message):

    return dict(
        uav_id=message.producer,
        variable_name=message.variableName,
        position=message.position.data.tolist(),
        data=message.data,
    )
