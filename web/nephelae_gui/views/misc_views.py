from django.http import JsonResponse, HttpResponse
from utm import from_latlon, to_latlon

try:
    from nephelae_gui.models.common import scenario
    
    from nephelae_gui.models.common import refreshers
except Exception as e:
   import sys
   import os
   # Have to do this because #@%*&@^*! django is hiding exceptions
   print("# Caught exception #############################################\n    ", e, flush=True)
   exc_type, exc_obj, exc_tb = sys.exc_info()
   # fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
   fname = exc_tb.tb_frame.f_code.co_filename
   print(exc_type, fname, exc_tb.tb_lineno,
         end="\n############################################################\n\n\n", flush=True)
   raise e


def latlon_to_local(request):
    query = request.GET
    utm = from_latlon(float(query['lat']), float(query['lon']))
    return JsonResponse({'x' : utm[0] - scenario.localFrame.utm_east,
                         'y' : utm[1] - scenario.localFrame.utm_north})


def local_to_latlon(request):
    query = request.GET
    latlon = to_latlon(
            float(query['utm_east']) + scenario.localFrame.utm_east,
            float(query['utm_north']) + scenario.localFrame.utm_north,
            scenario.localFrame.utm_number, scenario.localFrame.utm_letter)
    return JsonResponse({'x': latlon[0],
                         'y': latlon[1]})
def refresh_page(request):
    query = request.GET
    dictionnary = query.dict()
    id_obj = {}
    type_refresh = ''
    for (key, value) in dictionnary.items():
        if key == 'type':
            type_refresh = value
        else:
            id_obj[key] = value
    if type_refresh in refreshers.keys():
        for socket in refreshers[type_refresh]:
            socket.send_refresh_signal(id_obj)
    return HttpResponse(status=204)
