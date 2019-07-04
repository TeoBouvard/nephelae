import os
from timeit import default_timer as timer

from django.http import HttpResponseNotFound, HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render

from ..models import hypercube

def print_img(request, time_ratio, altitude_ratio):

    # Compute time of cross section with duration of acquisition
    computed_time, computed_altitude = hypercube.dimensions_from_ratio(time_ratio, altitude_ratio)

    print(computed_time, computed_altitude)

    raw_clouds_image = hypercube.encode_horizontal_clouds(time_ratio, altitude_ratio)
    raw_thermals_image = hypercube.encode_horizontal_thermals(time_ratio, altitude_ratio)

	#int64 have to be casted to int to be JSON serializable
    response = JsonResponse({
		'date': int(computed_time),
		'altitude': int(computed_altitude),
		'clouds': raw_clouds_image,
		'thermals': raw_thermals_image,
	})

    return response


# Render HTML template
def cross_section(request):
    return render(request, 'cross_section.html')
