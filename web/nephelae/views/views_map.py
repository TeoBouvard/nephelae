import os
import random
from timeit import default_timer as timer

from django.http import HttpResponse, HttpResponseNotFound, JsonResponse
from django.shortcuts import render

from ..models import PprzGpsGrabber, hypercube

pprz = PprzGpsGrabber()
pprz.start()

# Get UAV fleet info
def update_map(request):
    data = {
        'drones' : pprz.uavs,
        'clouds' : []
    }
    return JsonResponse(data)

# Render icons for drones
def plane_icon(request, index):
    try:
        path = 'nephelae/img/icons/plane_icon' + str(index) + '.png'
        with open(path, "rb") as f:
            return HttpResponse(f.read(), content_type="image/png")
    except IOError:
        return HttpResponseNotFound()

# Render map tiles
def map_tiles(request, z, x, y):
    try:
        path = os.environ.get('MAP_TILES') + '/' + str(z) + '/' + str(x) + '/' + str(y) + '.png'
        with open(path, "rb") as f:
            return HttpResponse(f.read(), content_type="image/png")
    except IOError:
        return HttpResponseNotFound()

# Render layer image
def layer_img(request, variable_name, time_value, altitude_value):
    buf = hypercube.print_horizontal_slice(variable_name, time_value, altitude_value)
    return HttpResponse(buf.read(), content_type="image/png")

# Render base page
def map(request):
    return render(request, 'map.html')