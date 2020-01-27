from django.http import JsonResponse, HttpResponse
import re
from utm import from_latlon

try:
    from nephelae_gui.models import hypercube, utils
    from nephelae_gui.models.common import scenario, db_data_tags

    nav_frame   = utils.local_frame_latlon()
    flight_area = utils.flight_area_latlon()
    database    = scenario.database
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


# Returns discovered UAVs and navigation frame info
def discover(request):
    uavs = {}
    for key in scenario.aircrafts.keys():
        uavs[key] = {}
        uavs[key]['id'] = str(key)
        uavs[key]['name'] = scenario.aircrafts[key].config.ac_name
        uavs[key]['gui_color'] = scenario.aircrafts[key].config.default_gui_color
    return JsonResponse({'origin': nav_frame,
                         'uavs':uavs,
                         'sample_tags':db_data_tags,
                         'flight_area': flight_area},
                        safe=False)


def get_positions(request):
    """Seems to be only used in 3D WebGL page (consider removal ?)"""

    # Parse request parameters
    trail_length = int(request.GET.get('trail_length'))
    uav_ids = [int(item) for item in request.GET.getlist('uav_id[]')]
    reality = request.GET.get('reality') == "true"

    positions = {}
    for uav_id in uav_ids:

        messages = [entry.data for entry in \
            database['STATUS', str(uav_id)](lambda x: x.data.position.t)[-trail_length:]]

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

    return JsonResponse({'positions':positions})


def get_positions_latlong(request):
    trail_length = int(request.GET.get('trail_length'))
    uav_ids = [int(item) for item in request.GET.getlist('uav_id[]')]

    positions = {}
    for uav_id in uav_ids:
        messages = [entry.data for entry in \
            database['STATUS', str(uav_id)](lambda x: x.data.position.t)[-trail_length:]]
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

    return JsonResponse({'positions':positions})


def get_available_missions(request, aircraftId):
    response = {'aircraftId':aircraftId}
    try:
        response['mission_types'] =\
            list(scenario.aircrafts[aircraftId].mission_types())
    except AttributeError as e:
        response['mission_types'] = []
    except KeyError:
        warn("Could not find aircraft '"+aircraftId+
             "' while fetching mission types.")
        response['mission_types'] = []
    return JsonResponse(response)


def get_mission_parameters(request, aircraftId, missionType):
    response = {'aircraftId' : aircraftId,
                'missionType': missionType}
    try:
        aircraft = scenario.aircrafts[aircraftId]
        response['parameter_names'] = aircraft.mission_parameter_names(missionType)
        response['parameter_tags']  = aircraft.mission_parameter_tags(missionType)
        response['parameter_rules'] = aircraft.mission_parameter_rules(missionType)
    except KeyError:
        warn("Error while fetching parameters for mission '" + missionType +
             "' for aircraft " + aircraftId)
        response['parameters_names'] = []
        response['parameters_tags']  = {}
        response['parameters_rules'] = {}
    return JsonResponse(response)


def get_mission_updatables(request, aircraftId, missionType):
    response = {'aircraftId' : aircraftId,
                'missionType': missionType}
    try:
        aircraft = scenario.aircrafts[aircraftId]
        response['updatable_names'] = aircraft.mission_updatable_names(missionType)
        response['updatable_tags']  = aircraft.mission_updatable_tags(missionType)
        response['updatable_rules'] = aircraft.mission_updatable_rules(missionType)
    except KeyError:
        warn("Error while fetching updatables for mission '" + missionType +
             "' for aircraft " + aircraftId)
        response['updatables_names'] = []
        response['updatables_tags']  = {}
        response['updatables_rules'] = {}
    return JsonResponse(response)


def create_mission(request):
    
    def parse_parameter(param, key):
        """Converts a string in a float or list of floats"""
        words = re.findall("[-+]?\d*\.\d+|[-+]?\d+", param)
        if len(words) < 1:
            raise ValueError("invalid value ("+param+") for parameter " + key)
        if len(words) == 1:
            return float(words[0])
        else:
            return [float(w) for w in words]

    aircraftId  =   str(request.GET.get('aircraftId'));
    missionType =   str(request.GET.get('missionType'));
    insertMode  =   int(request.GET.get('insertMode'));
    duration    = float(request.GET.get('duration'));

    params = {}
    for key in request.GET:
        if 'params_' not in key:
            continue
        params[key.split('params_')[1]] = parse_parameter(request.GET[key], key)

    scenario.aircrafts[aircraftId].create_mission(
        missionType, insertMode, duration, **params)

    return JsonResponse({'called':'called!'})


def current_mission_status(request, aircraftId):
    
    status = scenario.aircrafts[aircraftId].current_mission_status()
    if status is None:
        return JsonResponse({'aircraft': aircraftId,
            'current_mission_time_left': -1,
                             'missions': []})
    else:
        return JsonResponse({'aircraft': aircraftId,
            'current_mission_time_left': status['current_mission_time_left'],
                             'missions': [m.to_dict() for m in status['missions']]})


def current_mission_status_all(request):
    
    res = {}
    for aircraft in scenario.aircrafts.values():
        status = aircraft.current_mission_status()
        if status is None:
            res[aircraft.id] = ({'aircraft': aircraft.id,
                'current_mission_time_left': -1,
                                 'missions': []})
        else:
            res[aircraft.id] = ({'aircraft': aircraft.id,
                'current_mission_time_left': status['current_mission_time_left'],
                                 'missions': [m.to_dict() for m in status['missions']]})
    return JsonResponse(res)


def pending_missions(request, aircraftId):

    return JsonResponse([m.to_dict() for m in 
                         scenario.aircrafts[aircraftId].get_pending_missions()])


def pending_missions_all(request):
    
    res = {}
    for aircraftId in scenario.aircrafts.keys():
        res[aircraftId] = [m.to_dict() for m in 
                           scenario.aircrafts[aircraftId].get_pending_missions()]
    return JsonResponse(res)


def authorize_mission(request, aircraftId, missionId):
    scenario.aircrafts[aircraftId].authorize_mission(missionId)
    return JsonResponse({'status' : 'Authorized !'})


def reject_mission(request, aircraftId, missionId):
    scenario.aircrafts[aircraftId].reject_mission(missionId)
    return JsonResponse({'status' : 'Rejected !'})


def next_mission(request, aircraftId):
    scenario.aircrafts[aircraftId].next_mission()
    # return JsonResponse({'next_mission':'next_mission'})
    return HttpResponse(status=204)


def end_mission(request, aircraftId):
    scenario.aircrafts[aircraftId].end_mission()
    # return JsonResponse({'next_mission':'next_mission'})
    return HttpResponse(status=204)


def remove_center_to_update_UAV(request):
    query = request.GET
    uav_id = query.get('uav_id')
    aircraft = scenario.aircrafts[uav_id]
    if hasattr(aircraft, 'set_computing_center'):
        aircraft.set_computing_center(False)
    return HttpResponse(status=204)


def center_to_update_UAV(request):
    query = request.GET
    uav_id = query.get('uav_id')
    time = float(query.get('t'))
    coordinates = (float(query.get('x')), float(query.get('y')))
    aircraft = scenario.aircrafts[uav_id]
    if hasattr(aircraft, 'cloud_center_to_track_setter'):
        aircraft.cloud_center_to_track_setter(coordinates, time)
    if hasattr(aircraft, 'set_computing_center'):
        aircraft.set_computing_center(True)
    return HttpResponse(status=204)

def choosing_nearest_cloud_center(request):
    query = request.GET
    uav_id = query.get('uav_id')
    nearest_center = (query.get('nearest_center') == 'true')
    aircraft = scenario.aircrafts[uav_id]
    value = None
    if hasattr(aircraft, 'set_choose_nearest_cloud_center'):
        aircraft.set_choose_nearest_cloud_center(nearest_center)
    if hasattr(aircraft, 'is_choosing_nearest_cloud_center'):
        value = aircraft.is_choosing_nearest_cloud_center()
    return JsonResponse({'choose_nearest': value})

def is_choosing_nearest_cloud_center(request):
    query = request.GET
    uav_id = query.get('uav_id')
    value = None
    aircraft = scenario.aircrafts[uav_id]
    if hasattr(aircraft, 'is_choosing_nearest_cloud_center'):
        value = aircraft.is_choosing_nearest_cloud_center()
    return JsonResponse({'choose_nearest': value})

def get_deltas_tracker(request):
    query = request.GET
    uav_id = query.get('uav_id')
    aircraft = scenario.aircrafts[uav_id]
    res = {}
    if hasattr(aircraft, 'get_space_x') and hasattr(aircraft, 'get_space_y'):
        res['deltaX'] = aircraft.get_space_x()
        res['deltaY'] = aircraft.get_space_y()
    return JsonResponse(res)

def set_delta_x_tracker(request):
    query = request.GET
    uav_id = query.get('uav_id')
    deltaX = float(query.get('deltaX'))
    aircraft = scenario.aircrafts[uav_id]
    if hasattr(aircraft, 'set_space_x'):
        aircraft.set_space_x(deltaX)
    return HttpResponse(status=204)

def set_delta_y_tracker(request):
    query = request.GET
    uav_id = query.get('uav_id')
    deltaY = float(query.get('deltaY'))
    aircraft = scenario.aircrafts[uav_id]
    if hasattr(aircraft, 'set_space_y'):
        aircraft.set_space_y(deltaY)
    return HttpResponse(status=204) 
