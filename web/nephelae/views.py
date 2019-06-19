from django.shortcuts import render
from django.http import HttpRequest, HttpResponse, JsonResponse
from .models import HorizontalCrossSection
import matplotlib.pyplot as plt, mpld3
from PIL import Image

# Create horizontal cross section
hcs = HorizontalCrossSection()

def preview(request):
    return render(request, 'nephelae/preview.html')

def cross_section(request):

    # Handler for altitude and time sliders -> actuate cross section
    if request.method == 'POST':

        # Compute time of cross section with duration of acquisition
        time_percentage = 0.01*int(request.POST['time_percentage'])
        time = int(time_percentage*hcs.max_time_index())

        #Compute altitude of cross section with altitude range
        altitude_percentage = 0.01*int(request.POST['altitude_percentage'])
        altitude = int(altitude_percentage*hcs.max_altitude_index())

        #set cross section attributes, WARNING : use existing indices
        hcs.time_index = time
        hcs.altitude_index = altitude

        #base64 strings representing cross section images
        #cloud_string = hcs.print_clouds()
        #thermals_string = hcs.print_thermals()

        #int64 have to be casted to int to be JSON serializable
        response = JsonResponse({
            'date': int(hcs.get_date()),
            'altitude': int(hcs.get_altitude()),
            'clouds': "cloud_string",
            'thermals': "thermals_string",
        })
        
        return response

    # Render HTML template
    elif request.method == 'GET':
        return render(request, 'nephelae/cross_section.html')


def infos(request):
    return render(request, 'nephelae/infos.html')