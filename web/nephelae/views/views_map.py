import os
import random
from timeit import default_timer as timer

from django.http import HttpResponse, HttpResponseNotFound, JsonResponse
from django.shortcuts import render

from ..models import PprzGpsGrabber, hypercube

pprz = PprzGpsGrabber()
pprz.start()

def update_map(request):
    return JsonResponse(pprz.uavs)

# Render base page
def map(request):
    return render(request, 'nephelae/map.html')

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

# Render cloud tiles
def cloud_tiles(request, x, y, z, altitude):
	buf = hypercube.horizontal_clouds(x, y, z, altitude)
	if buf is not None:
		return HttpResponse(buf.read(), content_type="image/png")
	else:
		return HttpResponseNotFound()
