import os
from timeit import default_timer as timer

from django.http import HttpResponseNotFound, HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render


# Render map tiles
def texture(request, file_name):
    try:
        path = 'nephelae/img/textures/' + str(file_name)
        with open(path, "rb") as f:
            response = HttpResponse(f.read(), content_type="image/jpg")
            return response
    except IOError:
        return HttpResponseNotFound()


# Rendering of empty pages
def simulation(request):
    return render(request, 'simulation.html')
