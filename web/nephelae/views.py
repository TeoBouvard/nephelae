from timeit import default_timer as timer

import matplotlib.pyplot as plt
import mpld3
from django.http import HttpRequest, HttpResponse, JsonResponse, Http404
from django.shortcuts import render

from .models import HorizontalCrossSection

# Create horizontal cross section -> separate views later
hcs = HorizontalCrossSection()

def update_map(request):
    positions = []

    drone_id1 = 1
    drone_position1 = [43.6077, 1.4482]

    drone_id2 = 2
    drone_position2 = [43.6097, 1.4452]

    positions.append({'drone_id' : drone_id1, 'position' : drone_position1})
    positions.append({'drone_id' : drone_id2, 'position' : drone_position2})

    response = JsonResponse({
        'positions' : positions
        })

    return response

def get_drones(request):
    drones = []

    drone_id1 = 1
    drone_position1 = [43.6047, 1.4442]

    drone_id2 = 2
    drone_position2 = [43.6057, 1.4452]

    drones.append({'drone_id' : drone_id1, 'position' : drone_position1})
    drones.append({'drone_id' : drone_id2, 'position' : drone_position2})

    response = JsonResponse({
        'drones': drones,
        })

    return response

def cross_section(request):

    # Handler for altitude and time sliders -> actuate cross section
    if request.method == 'POST':

        start = timer()

        # Compute time of cross section with duration of acquisition
        time_percentage = 0.01*int(request.POST['time_percentage'])
        time = int(time_percentage*hcs.max_time_index())

        #Compute altitude of cross section with altitude range
        altitude_percentage = 0.01*int(request.POST['altitude_percentage'])
        altitude = int(altitude_percentage*hcs.max_altitude_index())

        end1 = timer()

        #set cross section attributes, WARNING : use existing indices
        hcs.time_index = time
        hcs.altitude_index = altitude

        end2 = timer()

        #base64 strings representing cross section images
        cloud_string = hcs.print_clouds()
        thermals_string = hcs.print_thermals()
        #hcs.print_clouds_img()
        #hcs.print_thermals_img()

        end3 = timer()

        #int64 have to be casted to int to be JSON serializable
        response = JsonResponse({
            'date': int(hcs.get_date()),
            'altitude': int(hcs.get_altitude()),
            'clouds': cloud_string,
            'thermals': thermals_string,
        })
        
        end = timer()

        print('Benchmark :')
        print('Server took',1000*(end1 - start),'ms to get POST parameters')
        print('Server took',1000*(end2 - end1),'ms to create cross section')
        print('Server took',1000*(end3 - end2),'ms to encode strings in base64')
        print('Server took',1000*(end - start),'ms to craft an answer')

        return response

    # Render HTML template
    elif request.method == 'GET':
        return render(request, 'nephelae/cross_section.html')


# Rendering of empty pages
def infos(request):
    return render(request, 'nephelae/infos.html')

def preview(request):
    return render(request, 'nephelae/preview.html')

def map(request):
    return render(request, 'nephelae/map.html')

def img(request):
    try:
        with open('nephelae/img/plane_icon.png', "rb") as f:
            return HttpResponse(f.read(), content_type="image/png")
    except IOError:
        return Http404()