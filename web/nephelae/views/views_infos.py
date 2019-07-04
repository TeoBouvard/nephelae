import os
from timeit import default_timer as timer

from django.http import Http404, HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render


# Rendering of empty pages
def infos(request):
    return render(request, 'infos.html')