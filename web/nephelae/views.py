from django.shortcuts import render
from django.http import HttpRequest, HttpResponse, JsonResponse


def preview(request):
    return render(request, 'nephelae/preview.html')


def cross_section(request):

    # Slider has been moved, return new cross section
    if request.method == 'POST':
        time_percentage = request.POST['time_percentage']
        response = JsonResponse({
            'time': time_percentage
        })
        return response

    # Render HTML template
    elif request.method == 'GET':
        return render(request, 'nephelae/cross_section.html')


def infos(request):
    return render(request, 'nephelae/infos.html')
