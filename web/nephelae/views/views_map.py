import os

from django.http import HttpResponse, HttpResponseNotFound, JsonResponse
from django.shortcuts import render
from django.utils.cache import add_never_cache_headers
import numpy as np
from geopy.distance import distance

from ..models import PprzGpsGrabber, hypercube

pprz = PprzGpsGrabber()
pprz.start()


# Get UAV fleet info
def update_map(request):
    data = {
        'drones': pprz.uavs,
    }
    response = JsonResponse(data)
    add_never_cache_headers(response)
    return response


# Render icons for drones
def plane_icon(request, index):
    try:
        path = 'nephelae/img/plane_icons/plane_icon' + str(index) + '.png'
        with open(path, "rb") as f:
            return HttpResponse(f.read(), content_type="image/png")
    except IOError:
        return HttpResponseNotFound()


# Render map tiles
def map_tiles(request, z, x, y):
    try:
        path = os.environ.get('MAP_TILES') + '/' + str(z) + \
            '/' + str(x) + '/' + str(y) + '.png'
        with open(path, "rb") as f:
            return HttpResponse(f.read(), content_type="image/png")
    except IOError:
        return HttpResponseNotFound()


# Render layer image
def layer_img(request, variable_name):

    # Parse request parameters
    query = request.GET

    time_value = int(query.get('time'))
    altitude_value = int(query.get('altitude'))

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

    # Compute projected origin coordinates
    x_projected_origin = [map_bounds['south'], origin['lng']]
    y_projected_origin = [origin['lat'], map_bounds['west']]

    # Compute distances to map corners
    distance_x0 = distance(x_projected_origin, [map_bounds['south'], map_bounds['west']]).meters
    distance_x1 = distance(x_projected_origin, [map_bounds['south'], map_bounds['east']]).meters
    distance_y0 = distance(y_projected_origin, [map_bounds['south'], map_bounds['west']]).meters
    distance_y1 = distance(y_projected_origin, [map_bounds['north'], map_bounds['west']]).meters

    # Adjust for negative indices
    x0 = distance_x0 if origin['lng'] < map_bounds['west'] else -distance_x0
    x1 = distance_x1 if origin['lng'] < map_bounds['east'] else -distance_x1
    y0 = distance_y0 if origin['lat'] < map_bounds['south'] else -distance_y0
    y1 = distance_y1 if origin['lat'] < map_bounds['north'] else -distance_y1

    buf = hypercube.print_horizontal_slice(variable_name, time_value, altitude_value, x0, x1, y0, y1)
    return HttpResponse(buf.read(), content_type="image/png")


# Render base page
def map(request):
    return render(request, 'map.html')
