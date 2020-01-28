from django.http import JsonResponse, HttpResponse

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


def discover_maps(request):
    return JsonResponse(hypercube.discover_maps(), safe=False)

def discover_wind(request):
    return JsonResponse(hypercube.discover_wind())

# Returns the center of an horzontal slice
def get_center_of_horizontal_slice(request):
    time_value = float(request.GET.get('time'))
    altitude_value = float(request.GET.get('altitude'))
    variable = request.GET.get('variable')
    min_x = float(request.GET.get('min_x'))
    max_x = float(request.GET.get('max_x'))
    min_y = float(request.GET.get('min_y'))
    max_y = float(request.GET.get('max_y'))
    threshold = float(request.GET.get('threshold'))
    return JsonResponse(data = hypercube.get_center_of_horizontal_slice(
            variable, time_value, altitude_value, threshold,
            x0=min_x, x1=max_x, y0=min_y, y1=max_y))

def get_contour_of_horizontal_slice(request):
    time_value = float(request.GET.get('time'))
    altitude_value = float(request.GET.get('altitude'))
    variable = request.GET.get('variable')
    min_x = float(request.GET.get('min_x'))
    max_x = float(request.GET.get('max_x'))
    min_y = float(request.GET.get('min_y'))
    max_y = float(request.GET.get('max_y'))
    threshold = float(request.GET.get('threshold'))
    return JsonResponse(data = hypercube.get_contour_of_horizontal_slice(
            variable, time_value, altitude_value, threshold,
            x0=min_x, x1=max_x, y0=min_y, y1=max_y))

def get_bounding_boxes_of_horizontal_slice(request):
    time_value = float(request.GET.get('time'))
    altitude_value = float(request.GET.get('altitude'))
    variable = request.GET.get('variable')
    min_x = float(request.GET.get('min_x'))
    max_x = float(request.GET.get('max_x'))
    min_y = float(request.GET.get('min_y'))
    max_y = float(request.GET.get('max_y'))
    threshold = float(request.GET.get('threshold'))
    return JsonResponse(data = hypercube.get_bounding_boxes_of_horizontal_slice(
            variable, time_value, altitude_value, threshold,
            x0=min_x, x1=max_x, y0=min_y, y1=max_y))

def get_volume_of_selected_cloud(request):
    time_value = float(request.GET.get('time'))
    altitude_value = float(request.GET.get('altitude'))
    variable = request.GET.get('variable')
    min_x = float(request.GET.get('min_x'))
    max_x = float(request.GET.get('max_x'))
    min_y = float(request.GET.get('min_y'))
    max_y = float(request.GET.get('max_y'))
    threshold = float(request.GET.get('threshold'))
    c1 = float(request.GET.get('c1'))
    c2 = float(request.GET.get('c2'))
    return JsonResponse(data = hypercube.get_volume_of_selected_cloud(
            variable, time_value, altitude_value, c1, c2, threshold,
            x0=min_x, x1=max_x, y0=min_y, y1=max_y))

# Get sensor data with sample positions
def get_sensor_data(request):

    # Parse request parameters, get variables as array and as single value to factor code
    start = (0 if request.GET.get('start') is None else
        int(request.GET.get('start')))
    end = (None if request.GET.get('end') is None else int(request.GET.get('end')))
    uav_ids = [int(item) for item in request.GET.getlist('uav_id[]')]
    step = (-1 if request.GET.get('step') is None else int(request.GET.get('step')))
    variables = request.GET.getlist('variables[]')

    # filling response
    data = {}
    for uav_id in uav_ids:
        data[uav_id] = {}
        for variable in variables:
            data[uav_id][variable] = {'positions':[], 'values': []}
    
    for key in scenario.displayedViews:
        for sample in scenario.dataviews[key][-start:end:step]:
            try:
                data[int(sample.producer)][sample.variableName]['positions']\
                    .append(sample.position.data.tolist())
                data[int(sample.producer)][sample.variableName]['values']\
                    .append(sample.data[0])
            except KeyError:
                pass

    return JsonResponse({'data':data})


def get_sample_at_time(request):
    """
    Returns a sensor values at a specific time for reqiuested variables and
    aircrafts.
    """

    variables = request.GET.getlist('variables[]')
    uavs = request.GET.getlist('uav_id[]')
    at_time = float(request.GET.get('at_time'))

    data = {}
    for variable in variables:
        for uav_id in uavs:
            message = database[variable, str(uav_id)][float(at_time)][0].data
            if not uav_id in data.keys():
                data[uav_id] = dict()
            data[uav_id][message.variableName] = {
                    'positions': [message.position.data.tolist()],
                    'values': [message.data],
            }
    return JsonResponse(data)

# Get sections/map sliders bounds, bad design for now ..
def mesonh_box(request):
    return JsonResponse(hypercube.box(), safe=False)


# Update MesoNH hyperslabs
def get_section(request):
    time_value = float(request.GET.get('time'))
    altitude_value = float(request.GET.get('altitude'))
    variable = request.GET.get('variable')
    min_x = float(request.GET.get('min_x'));
    max_x = float(request.GET.get('max_x'));
    min_y = float(request.GET.get('min_y'));
    max_y = float(request.GET.get('max_y'));
    data = hypercube.get_horizontal_slice(variable, time_value, altitude_value,
            x0=min_x, x1=max_x, y0=min_y, y1=max_y)
    if data[0] is not None:
        retour = [data[0].tolist(), data[1].tolist(), data[2].tolist()]
    else:
        retour = [[],[],[]]
    response = JsonResponse({
        'axes': hypercube.axes(),
        'x_axis': retour[1],
        'y_axis': retour[2],
        'data': retour[0]
    })

    return response

def update_cloud_data(request):
    # Only there to give something to the unused cloud_data page
    data = {}
    return JsonResponse(data)

def send_update_wind(request):
    query = request.GET
    new_wind = [float(query.get('east_wind')), float(query.get('north_wind'))]
    windMap.set_wind(new_wind)
    return HttpResponse(status=204)

def wind_data(request, variable_name):

    # Parse request parameters
    query = request.GET

    time_value = float(query.get('time'))
    altitude_value = float(query.get('altitude'))

    map_bounds = {
        'east': float(query.get('map_bounds[east]')),
        'west': float(query.get('map_bounds[west]')),
        'south': float(query.get('map_bounds[south]')),
        'north': float(query.get('map_bounds[north]'))
    }

    origin = [
        float(query.getlist('origin[]')[0]),
        float(query.getlist('origin[]')[1])
    ]


    data = hypercube.get_wind(variable_name, time_value, altitude_value, map_bounds, origin)
    return JsonResponse(data, safe=False)


def get_dataviews_parameters(request):
    
    output = {}
    for key in scenario.dataviews.keys():
        parameters = scenario.dataviews[key].get_parameters()
        if len(parameters) > 0:
            output[key] = parameters
    return JsonResponse(output)


def set_dataview_parameters(request):
    query = request.GET;

    viewName = query.get('dataview_name')
    params = {}
    for key in query:
        if key == 'dataview_name':
            continue
        params[key.split('parameter_')[1]] = float(query.get(key))
    
    try:
        scenario.dataviews[viewName].set_parameters(**params)
    except KeyError as e:
        print('No view with name ', key)
    return JsonResponse({'status':'ok'})
    

