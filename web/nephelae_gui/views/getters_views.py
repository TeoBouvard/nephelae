from django.http import JsonResponse, HttpResponse
import time

try:
    from nephelae_gui.models import hypercube
    from nephelae_gui.models.common import scenario

    database = scenario.database
    windMap = scenario.windMap

except Exception as e:
    import sys
    import os
    # Have to do this because #@%*&@^*! django is hiding exceptions
    print("# Caught exception #############################################\n    ", e, flush=True)
    exc_type, exc_obj, exc_tb = sys.exc_info()
    fname = exc_tb.tb_frame.f_code.co_filename
    print(exc_type, fname, exc_tb.tb_lineno,
          end="\n############################################################\n\n\n", flush=True)
    raise e

def get_state_edge(request):
    query = request.GET
    edge_id = query.get('edge_id')
    return JsonResponse({'state': 
        scenario.dataviews.viewGraph.edges[edge_id].is_connected()})

def get_state_view(request):
    query = request.GET
    view_id = query.get('view_id')
    return JsonResponse({'parameters':
        scenario.dataviews.dataviews[view_id].get_parameters()})

def get_state_mission(request):
    query = request.GET
    aircraft_id = query.get('aircraft_id')
    mission_id = int(query.get('mission_id'))
    return JsonResponse(scenario.aircrafts[aircraft_id].missions[mission_id]
            .to_dict())

def get_state_current_missions(request):
    time.sleep(2)
    query = request.GET
    aircraft_id = query.get('aircraft_id')
    status = scenario.aircrafts[aircraft_id].current_mission_status()
    if status is None:
        res = JsonResponse({'aircraft': aircraft_id,
            'current_mission_time_left': -1,
                             'missions': []})
    else:
        res = JsonResponse({'aircraft': aircraft_id,
            'current_mission_time_left': status['current_mission_time_left'],
                             'missions': [m.to_dict() 
                                 for m in status['missions']]})
    return res
