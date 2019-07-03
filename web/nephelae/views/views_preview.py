import os
from timeit import default_timer as timer

from django.http import HttpResponseNotFound, HttpResponse, JsonResponse
from django.shortcuts import render

from ..models.PprzGpsGrabber import box

def get_box(request):
    return JsonResponse(box())

def preview(request):
    return render(request, 'nephelae/preview.html')
