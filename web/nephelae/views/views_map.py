import os
import random
from timeit import default_timer as timer

from django.http import Http404, HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render


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



def map(request):
    return render(request, 'nephelae/map.html')

# Render icons for drones
def plane_icon(request, index):
    with open('nephelae/img/icons/plane_icon' + str(index) + '.png', "rb") as f:
        return HttpResponse(f.read(), content_type="image/png")
