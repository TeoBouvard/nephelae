import os

from django.http import HttpResponse, HttpResponseNotFound, JsonResponse
from geopy.distance import distance

from ..models import hypercube


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
        path = 'nephelae/static/map_tiles/' + str(z) + '_' + str(x) + '_' + str(y) + '.jpg'
        with open(path, "rb") as f:
            return HttpResponse(f.read(), content_type="image/jpg")
    except IOError:
        return HttpResponseNotFound()


# Render simulation texture
def texture(request, file_name):
    try:
        path = 'nephelae/img/textures/' + str(file_name)
        with open(path, "rb") as f:
            response = HttpResponse(f.read(), content_type="image/jpg")
            return response
    except IOError:
        return HttpResponseNotFound()


# Render layer image
def layer_img(request, variable_name):

    # Parse request parameters
    query = request.GET

    time_value = float(query.get('time'))
    altitude_value = float(query.get('altitude'))

    thermals_cmap = query.get('thermals_cmap')
    clouds_cmap = query.get('clouds_cmap')
    transparent = True if (query.get('transparent')) == 'true' else False

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

    buf = hypercube.print_horizontal_slice(variable_name, time_value, altitude_value, x0, x1, y0, y1, thermals_cmap, clouds_cmap, transparent)
    return HttpResponse(buf.read(), content_type="image/png")
