from django.http import JsonResponse
from utm import from_latlon

try
    from nephelae_gui.models.common import scenario
except Exception as e:
    # Have to do this because #@%*&@^*! django is hiding exceptions
   print("# Caught exception #############################################\n    ", e)
   exc_type, exc_obj, exc_tb = sys.exc_info()
   fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
   print(exc_type, fname, exc_tb.tb_lineno,
         end="\n############################################################\n\n\n")
   raise e


def latlon_to_local(request):
    query = request.GET
    utm = from_latlon(float(query['lat']), float(query['lon']))
    return JsonResponse({'x' : utm[0] - scenario.localFrame.utm_east,
                         'y' : utm[1] - scenario.localFrame.utm_north})

