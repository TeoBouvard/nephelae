import os
from timeit import default_timer as timer

from django.http import Http404, HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render

from ..models import HorizontalCrossSection as hcs

def cross_section(request):

    # Refresh cross section on altitude and time slider events
    if request.method == 'POST':

        #start = timer()

        # Compute time of cross section with duration of acquisition
        time_percentage = 0.01*int(request.POST['time_percentage'])
        time = int(time_percentage*hcs.max_time_index())

        #Compute altitude of cross section with altitude range
        altitude_percentage = 0.01*int(request.POST['altitude_percentage'])
        altitude = int(altitude_percentage*hcs.max_altitude_index())

        #end1 = timer()

        #set cross section attributes, WARNING : use existing indices
        cross_section = hcs(altitude, time)

        #end2 = timer()

        #base64 strings representing cross section images
        cloud_string = cross_section.print_clouds()
        thermals_string = cross_section.print_thermals()

        #end3 = timer()

        #int64 have to be casted to int to be JSON serializable
        response = JsonResponse({
            'date': int(cross_section.get_seconds()),
            'altitude': int(cross_section.get_altitude()),
            'clouds': cloud_string,
            'thermals': thermals_string,
        })
        
        #end = timer()

        #print('Benchmark :')
        #print('Server took',1000*(end1 - start),'ms to get POST parameters')
        #print('Server took',1000*(end2 - end1),'ms to create cross section')
        #print('Server took',1000*(end3 - end2),'ms to encode strings in base64')
        #print('Server took',1000*(end - start),'ms to craft an answer')

        return response

    # Render HTML template
    elif request.method == 'GET':
        return render(request, 'nephelae/cross_section.html')
