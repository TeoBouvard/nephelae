from django.http import HttpResponseNotFound, HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render
import numpy as np

from ..models import hypercube


def mesonh_box(request):
    bounds = hypercube.clouds.bounds
    box = [
        {'min': bounds[0].min, 'max':bounds[0].max},
        {'min': bounds[1].min, 'max':bounds[1].max},
        {'min': bounds[2].min, 'max':bounds[2].max},
        {'min': bounds[3].min, 'max':bounds[3].max}]

    return JsonResponse(box, safe=False)


# Render HTML template
def sections(request):
    return render(request, 'sections.html')


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
