from django.http import JsonResponse

# from ..models import hypercube, tracker
from nephelae_gui.models import hypercube, tracker
from nephelae_paparazzi.missions import MissionBuilder


# Returns discovered UAVs and navigation frame info
def discover(request):
    return JsonResponse(tracker.discover(), safe=False)


def discover_maps(request):
    return JsonResponse(hypercube.discover_maps(), safe=False)


# Returns the center of an horzontal slice
def get_center_of_horizontal_slice(request):
    time_value = float(request.GET.get('time'))
    altitude_value = float(request.GET.get('altitude'))
    variable = request.GET.get('variable')
    min_x = float(request.GET.get('min_x'));
    max_x = float(request.GET.get('max_x'));
    min_y = float(request.GET.get('min_y'));
    max_y = float(request.GET.get('max_y'));
    return JsonResponse(data = hypercube.get_center_of_horizontal_slice(
            variable, time_value, altitude_value,
            x0=min_x, x1=max_x, y0=min_y, y1=max_y))

def get_contour_of_horizontal_slice(request):
    time_value = float(request.GET.get('time'))
    altitude_value = float(request.GET.get('altitude'))
    variable = request.GET.get('variable')
    variable_std = request.GET.get('variable_std')
    min_x = float(request.GET.get('min_x'));
    max_x = float(request.GET.get('max_x'));
    min_y = float(request.GET.get('min_y'));
    max_y = float(request.GET.get('max_y'));
    return JsonResponse(data = hypercube.get_contour_of_horizontal_slice(
            variable, variable_std, time_value, altitude_value,
            x0=min_x, x1=max_x, y0=min_y, y1=max_y))

# Update UAV fleet positions
def get_positions(request):

    # Parse request parameters
    trail_length = int(request.GET.get('trail_length'))
    uav_ids = [int(item) for item in request.GET.getlist('uav_id[]')]
    reality = request.GET.get('reality') == "true"

    return JsonResponse(tracker.get_positions(uav_ids, trail_length, reality))

def get_positions_uavs_map(request):
    trail_length = int(request.GET.get('trail_length'))
    uav_ids = [int(item) for item in request.GET.getlist('uav_id[]')]

    return JsonResponse(tracker.get_positions_uavs_map(uav_ids, trail_length))

# Get sensor data with sample positions
def get_sensor_data(request):

    # Parse request parameters, get variables as array and as single value to factor code
    start = (0 if request.GET.get('start') is None else
        int(request.GET.get('start')))
    end = (None if request.GET.get('end') is None else int(request.GET.get('end')))
    uav_ids = [int(item) for item in request.GET.getlist('uav_id[]')]
    step = (-1 if request.GET.get('step') is None else int(request.GET.get('step')))
    variables = request.GET.getlist('variables[]')
    variables.append(request.GET.get('variable'))
    return JsonResponse(tracker.get_data(uav_ids, variables, start, end, step))


# Get sections/map sliders bounds, bad design for now ..
def mesonh_box(request):
    return JsonResponse(hypercube.box(), safe=False)


# Update MesoNH hyperslabs
def get_section(request):
    time_value = float(request.GET.get('time'))
    altitude_value = float(request.GET.get('altitude'))
    variable = request.GET.get('variable')
    min_x = float(request.GET.get('min_x'));
    max_x = float(request.GET.get('max_x'));
    min_y = float(request.GET.get('min_y'));
    max_y = float(request.GET.get('max_y'));
    data = hypercube.get_horizontal_slice(variable, time_value, altitude_value,
            x0=min_x, x1=max_x, y0=min_y, y1=max_y)
    if data[0] is not None:
        retour = [data[0].tolist(), data[1].tolist(), data[2].tolist()]
    else:
        retour = [[],[],[]]
    response = JsonResponse({
        'axes': hypercube.axes(),
        'axe_x': retour[1],
        'axe_y': retour[2],
        'data': retour[0]
    })

    return response

def get_state_at_time(request):
    variables = request.GET.getlist('variables[]')
    uavs = request.GET.getlist('uav_id[]')
    at_time = float(request.GET.get('at_time'))
    return JsonResponse(tracker.get_state_at_time(uavs, variables, at_time))

def update_cloud_data(request):
    data = {}
    return JsonResponse(data)


def wind_data(request, variable_name):

    # Parse request parameters
    query = request.GET

    time_value = float(query.get('time'))
    altitude_value = float(query.get('altitude'))

    map_bounds = {
        'east': float(query.get('map_bounds[east]')),
        'west': float(query.get('map_bounds[west]')),
        'south': float(query.get('map_bounds[south]')),
        'north': float(query.get('map_bounds[north]'))
    }

    origin = [
        float(query.getlist('origin[]')[0]),
        float(query.getlist('origin[]')[1])
    ]


    data = hypercube.get_wind(variable_name, time_value, altitude_value, map_bounds, origin)
    return JsonResponse(data, safe=False)


def get_available_missions(request):
    return JsonResponse({'available_missions' : MissionBuilder.missionMessagesNames})


def get_mission_parameters(request, mission_type):
    return JsonResponse({"parameters" : MissionBuilder.get_parameter_list(mission_type)})


