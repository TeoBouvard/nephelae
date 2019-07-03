import os
from timeit import default_timer as timer

from django.http import HttpResponseNotFound, HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render

def box(request):
    return JsonResponse(hypercube.box())

def preview(request):
    return render(request, 'nephelae/preview.html')
