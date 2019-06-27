import os
import random
from timeit import default_timer as timer

from django.http import HttpResponseNotFound, HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render

from ..models import PprzGpsGrabber

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

# Render icons for drones
def map_tiles(request, z, x, y):
    try:
        path = '/home/arthurdent/Documents/maps/' + str(z) + '/' + str(x) + '/' + str(y) + '.png'
        with open(path, "rb") as f:
            return HttpResponse(f.read(), content_type="image/png")
    except IOError:
        return HttpResponseNotFound()
