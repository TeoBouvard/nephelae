import os
import sys
from utm import to_latlon

from . import utils
from . import common

from .common import scenario

db = scenario.database

nav_frame   = utils.local_frame_latlon()
flight_area = utils.flight_area_latlon()


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
