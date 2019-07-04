import os
from timeit import default_timer as timer

from django.http import HttpResponseNotFound, HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render


# Rendering of empty pages
def simulation(request):
    return render(request, 'simulation.html')