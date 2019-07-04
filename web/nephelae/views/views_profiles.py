import os

from django.http import HttpResponseNotFound, HttpResponse, JsonResponse
from django.shortcuts import render

from ..models.PprzGpsGrabber import box

def profiles(request):
    return render(request, 'profiles.html')
