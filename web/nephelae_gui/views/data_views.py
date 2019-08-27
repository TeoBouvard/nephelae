from django.http import JsonResponse

# from ..models import hypercube, tracker
from nephelae_gui.models import hypercube, tracker


# Returns discovered UAVs and navigation frame info
def discover(request):
    return JsonResponse(tracker.discover(), safe=False)


# Update UAV fleet positions
def get_positions(request):

    # Parse request parameters
    trail_length = int(request.GET.get('trail_length'))
    uav_ids = [int(item) for item in request.GET.getlist('uav_id[]')]
    reality = request.GET.get('reality') == "true"

    return JsonResponse(tracker.get_positions(uav_ids, trail_length, reality))


# Get sensor data with sample positions
def get_sensor_data(request):

    # Parse request parameters, get variables as array and as single value to factor code
    trail_length = int(request.GET.get('trail_length'))
    uav_ids = [int(item) for item in request.GET.getlist('uav_id[]')]
    variables = request.GET.getlist('variables[]')
    variables.append(request.GET.get('variable'))

    return JsonResponse(tracker.get_data(uav_ids, trail_length, variables))


# Get sections/map sliders bounds, bad design for now ..
def mesonh_box(request):
    return JsonResponse(hypercube.box(), safe=False)


# Update MesoNH hyperslabs
def get_section(request):

    time_value = int(request.GET.get('time'))
    altitude_value = int(request.GET.get('altitude'))
    variable = request.GET.get('variable')

    response = JsonResponse({
        'axes': hypercube.axes(),
        'data': hypercube.get_horizontal_slice(variable, time_value, altitude_value).tolist(),
    })

    return response


# Data updates
def update_profiles(request):
    data = {}
    return JsonResponse(data)


def update_cloud_data(request):
    data = {}
    return JsonResponse(data)


def wind_data(request):

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


    data = hypercube.get_wind(time_value, altitude_value, map_bounds, origin)
    return JsonResponse(data, safe=False)
