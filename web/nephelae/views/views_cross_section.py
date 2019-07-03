import os
from timeit import default_timer as timer

from django.http import HttpResponseNotFound, HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render

from ..models import hypercube

def print_img(request, time_ratio, altitude_ratio):

    # Compute time of cross section with duration of acquisition
    time_index, altitude_index = hypercube.index_from_ratio(time_ratio, altitude_ratio)

    raw_clouds_image = hypercube.print_horizontal_clouds(time_index, altitude_index)
    raw_thermals_image = hypercube.print_horizontal_thermals(time_index, altitude_index)

	#int64 have to be casted to int to be JSON serializable
    response = JsonResponse({
		'date': int(hypercube.get_seconds(time_index)),
		'altitude': int(hypercube.get_altitude(altitude_index)),
		'clouds': raw_clouds_image,
		'thermals': raw_thermals_image,
	})

    return response


# Render HTML template
def cross_section(request):
    return render(request, 'nephelae/cross_section.html')
