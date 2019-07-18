import os

from django.http import HttpResponse, HttpResponseNotFound, JsonResponse

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

    buf = hypercube.print_horizontal_slice(variable_name, time_value, altitude_value, map_bounds, origin, thermals_cmap, clouds_cmap, transparent)
    return HttpResponse(buf.read(), content_type="image/png")
