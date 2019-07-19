import os
import sys

import utm

import nephelae_paparazzi.pprzinterface as ppint
from nephelae_mapping.database import DatabasePlayer, NephelaeDataServer

from . import utils


#db = NephelaeDataServer()
#
#def build_uav(uavId, navRef):
#    uav = ppint.PprzMesoNHUav(uavId, navRef, os.environ['MESO_NH'], ['RCT', 'WT'])
#    uav.add_sensor_observer(db)
#    uav.add_gps_observer(db)
#    return uav
#
#interface = ppint.PprzSimulation(os.environ['MESO_NH'],
#                                 ['RCT', 'WT'],
#                                 build_uav_callback=build_uav)
#interface.start()
## Has to be called after interface.start()
## (block execution until a NAVIGATION_REF message is received, won't receive if not started.)
#db.set_navigation_frame(interface.navFrame)


db = DatabasePlayer('/home/arthurdent/Documents/dev/nephelae/nephelae_mapping/tests/output/database02.neph')
# db = DatabasePlayer('/home/pnarvor/work/nephelae/code/nephelae_mapping/tests/output/database01.neph')
# db = DatabasePlayer('/home/pnarvor/work/nephelae/code/nephelae_mapping/tests/output/database02.neph')
db.play(looped=True)


nav_frame = list(utm.to_latlon(db.navFrame['utm_east'], db.navFrame['utm_north'], db.navFrame['utm_zone'], northern=True))


def discover():
    return dict(origin=nav_frame, uavs=db.uavIds, sample_tags=db.variableNames)


# GPS time is *absolute*, but SAMPLE time is relative to navFrame
def get_positions(uav_ids, trail_length):
    positions = dict()

    for uav_id in uav_ids:

        messages = [entry.data for entry in db.find_entries(['GPS', str(uav_id)], (slice(-trail_length, None, -1), ), lambda entry: entry.data.stamp)]

        # Gather most recent information for display
        positions[uav_id] = {
            'heading': messages[-1]['course'],
            'speed': messages[-1]['speed'],
            'time': int(messages[-1]['stamp'] - db.navFrame['stamp'])
        }

        for message in messages:

            position = list(utm.to_latlon(message['utm_east'], message['utm_north'], message['utm_zone'], northern=True))
            position.append(message['alt'])

            frame_position = utils.translate_position(position, nav_frame)
            frame_position.append(message['alt'])

            if 'path' not in positions[uav_id]:
                positions[uav_id]['path'] = [position]
                positions[uav_id]['frame_path'] = [frame_position]
            else:
                positions[uav_id]['path'].append(position)
                positions[uav_id]['frame_path'].append(frame_position)
    
    return dict(positions=positions)


def get_data(uav_ids, trail_length, variables):

    data = dict()

    for variable in variables:

        for uav_id in uav_ids:

            messages = [entry.data for entry in db.find_entries([variable, str(uav_id)], (slice(-trail_length, None, -1), ), lambda entry: entry.data.timeStamp)]

            for message in messages:

                if uav_id not in data.keys():
                    data[uav_id] = dict()
                elif message.variableName not in data[uav_id].keys():
                    data[uav_id][message.variableName] = dict(
                        positions=[message.position.data.tolist()],
                        values=[message.data[0]],
                    )
                else:
                    data[uav_id][message.variableName]['positions'].append(message.position.data.tolist())
                    data[uav_id][message.variableName]['values'].append(message.data[0])
    
    return dict(data=data)
