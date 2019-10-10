import os
import sys
import utm

# import  nephelae_paparazzi.pprzinterface as ppint
# from nephelae_mapping.database import DatabasePlayer, NephelaeDataServer
from nephelae_paparazzi import PprzSimulation, PprzMesonhUav
from nephelae.database  import DatabasePlayer, NephelaeDataServer

from . import utils
from . import common

try:
    class Logger:
    
        def __init__(self):
            pass
    
        def add_sample(self, sample):
            if 'RCT' in sample.variableName:
                print(sample, end="\n\n")
            # if 'WT' in sample.variableName:
            #     print(sample, end="\n\n")
            # if 'UT' in sample.variableName:
            #     print(sample, end="\n\n")
            # print(sample, end="\n\n")
    
        def add_gps(self, gps):
            print(gps, end="\n\n")
    logger = Logger()
    
    # if 'PPRZ_DB' in os.environ:
    #     # if PPRZ_DB is defined, do a replay
    #     db = DatabasePlayer(os.environ['PPRZ_DB'])
    #     db.play(looped=True)
    #     def on_exit():
    #         db.stop()
    #         exit()
    # else:
    if not 'PPRZ_DB' in os.environ:
        # else connect to paparazzi uavs
        # db = NephelaeDataServer()
        db = common.db
        if 'MESO_NH' in os.environ:
            def build_uav(uavId, navRef):
                # uav = PprzMesonhUav(uavId, navRef, os.environ['MESO_NH'], ['RCT', 'WT'])
                uav = PprzMesonhUav(uavId, navRef, common.atm, ['RCT', 'WT', ['UT','VT']])
                uav.add_sensor_observer(db)
                uav.add_gps_observer(db)
                # uav.add_sensor_observer(logger)
                # uav.add_gps_observer(logger)
                return uav
            # interface = PprzSimulation(common.atm, ['RCT', 'WT'], build_uav_callback=build_uav)
            interface = PprzSimulation(common.atm, ['RCT', 'WT'], build_uav_callback=build_uav, windFeedback=True)
        else:
            print('Full UAV interface not implmented yet. Please set MESO_NH env variable to a mesonh dataset')
            exit()
        interface.start()
        db.set_navigation_frame(interface.navFrame)
        def on_exit():
            print("Shutting down paparazzi interface... ", end='')
            sys.stdout.flush()
            interface.stop()
            print("Done.")
            exit()
    db_data_tags = ['RCT', 'WT'] 
    nav_frame = list(utm.to_latlon(db.navFrame['utm_east'], db.navFrame['utm_north'], db.navFrame['utm_zone'], northern=True))
except Exception as e:
    # Have to do this because #@%*&@^*! django is hiding exceptions
   print("# Caught exception #############################################\n    ", e)
   exc_type, exc_obj, exc_tb = sys.exc_info()
   fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
   print(exc_type, fname, exc_tb.tb_lineno,
         end="\n############################################################\n\n\n")
   raise e


def discover():
    # return dict(origin=nav_frame, uavs=db.uavIds, sample_tags=db.variableNames)
    return dict(origin=nav_frame, uavs=db.uavIds, sample_tags=db_data_tags)


# GPS time is *absolute*, but SAMPLE time is relative to navFrame
def get_positions(uav_ids, trail_length, reality=True):
    
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
            
            if reality:
                position = utils.compute_position(message)
            else:
                position = utils.compute_frame_position(message, nav_frame)

            if 'path' not in positions[uav_id]:
                positions[uav_id]['path'] = [position]
            else:
                positions[uav_id]['path'].append(position)
    
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
                    data[uav_id][message.variableName] = {
                        'positions': [message.position.data.tolist()],
                        'values': [message.data[0]],
                    }
                else:
                    data[uav_id][message.variableName]['positions'].append(message.position.data.tolist())
                    data[uav_id][message.variableName]['values'].append(message.data[0])
    
    return dict(data=data)


def prettify_gps(message):

    return dict(
        uav_id=message.uavId,
        heading=message.course,
        position=utils.compute_position(message),
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