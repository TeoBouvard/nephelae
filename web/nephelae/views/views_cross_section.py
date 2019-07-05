from django.http import HttpResponseNotFound, HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render

from ..models import hypercube

def mesonh_box(request):
    bounds = hypercube.clouds.bounds
    box = [
        {'min':bounds[0].min, 'max':bounds[0].max}, 
        {'min':bounds[1].min, 'max':bounds[1].max}, 
        {'min':bounds[2].min, 'max':bounds[2].max}, 
        {'min':bounds[3].min, 'max':bounds[3].max}]
        
    return JsonResponse(box, safe=False)

def print_img(request, time_value, altitude_value):

    raw_clouds_image = hypercube.encode_horizontal_clouds(time_value, altitude_value)
    raw_thermals_image = hypercube.encode_horizontal_thermals(time_value, altitude_value)

	#int64 have to be casted to int to be JSON serializable
    response = JsonResponse({
		'clouds': raw_clouds_image,
		'thermals': raw_thermals_image,
	})

    return response


# Render HTML template
def cross_section(request):
    return render(request, 'cross_section.html')
