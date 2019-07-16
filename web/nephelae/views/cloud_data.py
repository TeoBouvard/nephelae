from django.http import HttpResponseNotFound, HttpResponse, JsonResponse
from django.shortcuts import render

from ..models import tracker


def update_cloud_data(request):
    data = {}
    return JsonResponse(data)


def cloud_data(request):
    return render(request, 'cloud_data.html')


def raw_data(request):
    return render(request, 'raw_data.html')


# 1D raw data
def update_raw_data(request):

    # Parse request parameters
    trail_length = int(request.GET.get('trail_length'))
    uav_ids = [int(item) for item in request.GET.getlist('uav_id[]')]

    return JsonResponse(tracker.get_data(uav_ids, trail_length))
