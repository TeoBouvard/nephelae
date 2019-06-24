import os
from timeit import default_timer as timer

from django.http import Http404, HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render


def preview(request):
    return render(request, 'nephelae/preview.html')
