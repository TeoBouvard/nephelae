import os
import sys
from utm import to_latlon

from . import utils
from . import common

from .common import scenario

db = scenario.database

nav_frame   = utils.local_frame_latlon()
flight_area = utils.flight_area_latlon()


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
