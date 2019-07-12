import os

from django.http import HttpResponseNotFound, HttpResponse, JsonResponse
from django.shortcuts import render


def preview(request):
    return render(request, 'preview.html')
