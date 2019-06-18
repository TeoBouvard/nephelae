from django.shortcuts import render
from django.http import HttpRequest, HttpResponse, JsonResponse
from .models import HorizontalCrossSection
import matplotlib.pyplot as plt, mpld3

def preview(request):
    return render(request, 'nephelae/preview.html')


def cross_section(request):

    # Handler for altitude and time sliders
    if request.method == 'POST':

        # Create cross section
        hcs = HorizontalCrossSection()

        # Compute time of cross section with duration of acquisition
        time_percentage = 0.01*int(request.POST['time_percentage'])
        time = hcs.min_time() + time_percentage*hcs.duration()

        #Compute altitude level
        altitude_percentage = 0.01*42.0 #TODO 
        altitude = hcs.min_level() + altitude_percentage*hcs.altitude_range()

        #set cross section attributes
        hcs.time = time
        hcs.altitude = altitude

        #image = hcs.printUpwind()

        #int64 have to be casted to int to be JSON serializable
        response = JsonResponse({
            'time': int(hcs.time),
            'altitude': int(hcs.altitude),
            #'image': hcs.printUpwind().savefig('cs.png')
        })
        return response

    # Render HTML template
    elif request.method == 'GET':
        return render(request, 'nephelae/cross_section.html')


def infos(request):
    return render(request, 'nephelae/infos.html')
