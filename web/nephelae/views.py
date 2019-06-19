from django.shortcuts import render
from django.http import HttpRequest, HttpResponse, JsonResponse
from .models import HorizontalCrossSection
import matplotlib.pyplot as plt, mpld3

def preview(request):
    return render(request, 'nephelae/preview.html')

def cross_section(request):

    # Handler for altitude and time sliders -> actuate cross section
    if request.method == 'POST':

        # Create cross section
        hcs = HorizontalCrossSection()

        # Compute time of cross section with duration of acquisition
        time_percentage = 0.01*int(request.POST['time_percentage'])
        time = int(time_percentage*hcs.max_time_index())

        #Compute altitude of cross section with altitude range
        altitude_percentage = 0.01*int(42) #TODO 
        altitude = 42#int(altitude_percentage*hcs.max_altitude_index())

        #set cross section attributes, WARNING : use existing indices
        hcs.time_index = time
        hcs.altitude_index = altitude

        #base64 string representing cross section image
        cross_section_string = hcs.printCloudString()

        #int64 have to be casted to int to be JSON serializable
        response = JsonResponse({
            'date': int(hcs.get_date()),
            'altitude': int(hcs.altitude_index),
            'image': cross_section_string
        })
        
        return response

    # Render HTML template
    elif request.method == 'GET':
        return render(request, 'nephelae/cross_section.html')


def infos(request):
    return render(request, 'nephelae/infos.html')