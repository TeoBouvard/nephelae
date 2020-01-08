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
    
    positions = {}

    for uav_id in uav_ids:

        messages = [entry.data for entry in \
            db['STATUS', str(uav_id)](lambda x: x.data.position.t)[-trail_length:]]

        # Gather most recent information for display
        positions[uav_id] = {
            'heading': messages[-1].heading,
            'speed': messages[-1].speed,
            'time': messages[-1].position.t,
            'path': []
        }

        for message in messages:
            if reality:
                position = [message.lat, message.long, message.alt]
            else:
                position = [message.position.x,
                            message.position.y,
                            message.position.z]
            positions[uav_id]['path'].append(position)

    return dict(positions=positions)


def get_positions_uavs_map(uav_ids, trail_length):

    positions = {}
    for uav_id in uav_ids:
        messages = [entry.data for entry in \
            db['STATUS', str(uav_id)](lambda x: x.data.position.t)[-trail_length:]]

        # Gather most recent information for display
        positions[uav_id] = {
            'heading': messages[-1].heading,
            'speed'  : messages[-1].speed,
            'time'   : messages[-1].position.t,
            'path'   : [],
            'times'  : []
        }
        for message in messages:
            positions[uav_id]['path'].append([message.lat,
                                              message.long,
                                              message.alt])
            positions[uav_id]['times'].append(message.position.t)

    return dict(positions=positions)


def get_data(uav_ids, variables, start, end=None, step=-1):
    data = {}
    for uav_id in uav_ids:
        data[uav_id] = {}
        for variable in variables:
            messages = [entry.data for entry in
                db[variable, str(uav_id)](lambda x: x.data.timeStamp)[-start:end:step]]
            data[uav_id][variable] = {'positions':[], 'values': []}
            for message in messages:
                data[uav_id][variable]['positions'].append(message.position.data.tolist())
                data[uav_id][variable]['values'].append(message.data[0])
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

def center_to_update_UAV(uav_id, coordinates, time):
    aircraft = scenario.aircrafts[uav_id]
    if hasattr(aircraft, 'set_computing_center'):
        aircraft.set_computing_center(True)
    if hasattr(aircraft, 'cloud_center_to_track_setter'):
        aircraft.cloud_center_to_track_setter(coordinates, time)

def remove_center_to_update_UAV(uav_id):
    aircraft = scenario.aircrafts[uav_id]
    if hasattr(aircraft, 'set_computing_center'):
        aircraft.set_computing_center(False)

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

def prettify_point(message):
    localFrame = scenario.localFrame
    position = list(to_latlon(message['x'] + localFrame.utm_east, message['y'] +
            localFrame.utm_north, localFrame.utm_zone, localFrame.utm_letter))
    message['lat'] = position[0]
    message['lng'] = position[1]
    return message
