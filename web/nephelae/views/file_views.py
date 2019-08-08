import threading
from pathlib import Path

from django.http import HttpResponse, HttpResponseNotFound

from ..models import hypercube, tile_downloader


def download_map(request):

    # Parse request parameters
    query = request.GET

    map_bounds = {
        'east': float(query.get('map_bounds[east]')),
        'west': float(query.get('map_bounds[west]')),
        'south': float(query.get('map_bounds[south]')),
        'north': float(query.get('map_bounds[north]'))
    }

    t = threading.Thread(target=tile_downloader.dl, args=[map_bounds])
    t.setDaemon(True)
    t.start()
    return HttpResponse()


# Render icons for UAVs
def plane_icon(request, index):
    try:
        path = Path('nephelae/img/plane_icons/plane_icon' + str(index) + '.png')
        with open(str(path), 'rb') as f:
            return HttpResponse(f.read(), content_type="image/png")
    except IOError:
        return HttpResponseNotFound()


# Render map tiles
def map_tiles(request, z, x, y):
    try:
        path = Path('nephelae/static/map_tiles/', str(z), str(x), str(y) + '.jpg')
        with open(str(path), "rb") as f:
            return HttpResponse(f.read(), content_type="image/jpg")
    except IOError:
        return HttpResponseNotFound()


# Render simulation texture
def texture(request, file_name):
    try:
        path = Path('nephelae/img/textures/', str(file_name))
        with open(str(path), "rb") as f:
            response = HttpResponse(f.read(), content_type="image/jpg")
            return response
    except IOError:
        return HttpResponseNotFound()


# Render UAV 3D model
def model3D(request, file_name):
    try:
        path = Path('nephelae/img/3d_models/', str(file_name))
        with open(str(path), "rb") as f:
            response = HttpResponse(f.read())
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
    transparent = query.get('transparent') == 'true'

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

    buf = hypercube.print_horizontal_slice(variable_name, time_value, altitude_value, map_bounds, origin, thermals_cmap, clouds_cmap, transparent)
    return HttpResponse(buf.read(), content_type="image/png")
