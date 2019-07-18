from django.http import JsonResponse

from ..models import hypercube, tracker


# Returns discovered UAVs and navigation frame info
def discover(request):
    return JsonResponse(tracker.discover(), safe=False)


# Update UAV fleet positions
def get_positions(request):

    # Parse request parameters
    trail_length = int(request.GET.get('trail_length'))
    uav_ids = [int(item) for item in request.GET.getlist('uav_id[]')]

    return JsonResponse(tracker.get_positions(uav_ids, trail_length))


def get_data(request):

    # Parse request parameters
    trail_length = int(request.GET.get('trail_length'))
    uav_ids = [int(item) for item in request.GET.getlist('uav_id[]')]
    variables = request.GET.getlist('variables[]')

    return JsonResponse(tracker.get_data(uav_ids, trail_length, variables))


# Get sections/map sliders bounds, bad design for now ..
def mesonh_box(request):
    return JsonResponse(hypercube.box(), safe=False)


# Update MesoNH hyperslabs
def update_section(request, time_value, altitude_value):

    response = JsonResponse({

        'axes': hypercube.axes(),

        'clouds': {
            'data': hypercube.clouds[time_value, altitude_value, :, :].data.tolist(),
            'colormap_zero': hypercube.colormap_zero('clouds', time_value, altitude_value)
        },

        'thermals': {
            'data': hypercube.thermals[time_value, altitude_value, :, :].data.tolist(),
            'colormap_zero': hypercube.colormap_zero('thermals', time_value, altitude_value)
        },
    })

    return response


# Data updates
def update_profiles(request):
    data = {}

    return JsonResponse(data)


def update_cloud_data(request):
    data = {}
    return JsonResponse(data)


def update_raw_data(request):

    # Parse request parameters
    trail_length = int(request.GET.get('trail_length'))
    uav_ids = [int(item) for item in request.GET.getlist('uav_id[]')]

    return JsonResponse(tracker.data(uav_ids, trail_length))


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

    origin = {
        'lat': float(query.getlist('origin[]')[0]),
        'lng': float(query.getlist('origin[]')[1])
    }

    data = hypercube.get_wind(time_value, altitude_value, map_bounds, origin)
    return JsonResponse(data, safe=False)
