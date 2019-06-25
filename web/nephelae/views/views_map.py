import os
import random
from timeit import default_timer as timer

from django.http import Http404, HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render

from ..models import PprzGpsGrabber

pprz = PprzGpsGrabber()
pprz.start()

def update_map(request):

    data = {}

    for key, value in pprz.uavs.items():
        data[key] = value

    response = JsonResponse({'data': data})
    return response


def map(request):
    return render(request, 'nephelae/map.html')

# Render icons for drones
def plane_icon(request, index):
    with open('nephelae/img/icons/plane_icon' + str(index) + '.png', "rb") as f:
        return HttpResponse(f.read(), content_type="image/png")
