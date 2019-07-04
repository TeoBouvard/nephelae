from django.http import HttpResponseNotFound, HttpResponse, JsonResponse
from django.shortcuts import render


def update_cloud_data(request):
    data = {}
    return JsonResponse(data)

def cloud_data(request):
    return render(request, 'cloud_data.html')

