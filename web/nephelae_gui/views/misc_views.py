from django.http import JsonResponse
from utm import from_latlon

from nephelae_gui.models.common import scenario

def latlon_to_local(request):
    query = request.GET
    utm = from_latlon(float(query['lat']), float(query['lon']))
    return JsonResponse({'x' : utm[0] - scenario.localFrame.utm_east,
                         'y' : utm[1] - scenario.localFrame.utm_north})

