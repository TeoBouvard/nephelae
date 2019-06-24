import os
import random
from timeit import default_timer as timer

import matplotlib.pyplot as plt
import mpld3
from django.http import Http404, HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render

from .models import HorizontalCrossSection as hcs

# update_map and get_drones are redundant, delete later !
def update_map(request):
    positions = []

    drone_id1 = 0
    drone_position1 = [43.6077, 1.4482]
    drone_altitude1 = 90
    past_positions = [
                [43.6077, 1.4482],
                [43.6080, 1.4482],
                [43.6090, 1.4482],
                [43.6100, 1.4482],
                [43.6110, 1.4482],
                ]
    future_positions = [
                [43.6120, 1.4482],
                [43.6130, 1.4482],
                [43.6140, 1.4482],
                [43.6150, 1.4482],
                [43.6160, 1.4482],
            ]

    drone_id2 = 1
    drone_position2 = [43.6027, 1.4422]
    drone_altitude2 = 80

    drone_id3 = 2
    drone_position3 = [43.6097, 1.4452]
    drone_altitude3 = 60

    positions.append({'drone_id' : drone_id1, 
                      'position' : drone_position1,
                      'altitude' : drone_altitude1,
                      'past_positions': past_positions,
                      'future_positions': future_positions,
                      })
    positions.append({'drone_id' : drone_id2, 
                      'position' : drone_position2, 
                      'altitude' : drone_altitude2,
                      'past_positions': past_positions,
                      'future_positions': future_positions,
                      })
    positions.append({'drone_id' : drone_id3, 
                      'position' : drone_position3, 
                      'altitude' : drone_altitude3,
                      'past_positions': past_positions,
                      'future_positions': future_positions,
                      })

    response = JsonResponse({
        'positions' : positions
        })

    return response

def get_drones(request):
    drones = []

    drone_id1 = 0
    drone_position1 = [43.6047, 1.4442]
    drone_altitude1 = 100

    drone_id2 = 1
    drone_position2 = [43.6057, 1.4452]
    drone_altitude2 = 75

    drone_id3 = 2
    drone_position3 = [43.6067, 1.4432]
    drone_altitude3 = 50

    drones.append({'drone_id' : drone_id1, 'position' : drone_position1, 'altitude' : drone_altitude1})
    drones.append({'drone_id' : drone_id2, 'position' : drone_position2, 'altitude' : drone_altitude2})
    drones.append({'drone_id' : drone_id3, 'position' : drone_position3, 'altitude' : drone_altitude3})

    response = JsonResponse({
        'drones': drones,
        })

    return response

def cross_section(request):

    # Refresh cross section on altitude and time slider events
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
        cross_section = hcs(altitude, time)

        end2 = timer()

        #base64 strings representing cross section images
        cloud_string = cross_section.print_clouds()
        thermals_string = cross_section.print_thermals()
        #hcs.print_clouds_img()
        #hcs.print_thermals_img()

        end3 = timer()

        #int64 have to be casted to int to be JSON serializable
        response = JsonResponse({
            'date': int(cross_section.get_date()),
            'altitude': int(cross_section.get_altitude()),
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

# Render icons for drones
def plane_icon(request, index):
    with open('nephelae/img/icons/plane_icon' + str(index) + '.png', "rb") as f:
        return HttpResponse(f.read(), content_type="image/png")
