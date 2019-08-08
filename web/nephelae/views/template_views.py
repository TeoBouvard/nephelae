from django.shortcuts import render


def cloud_data(request):
    return render(request, 'cloud_data.html')


def raw_data(request):
    return render(request, 'raw_data.html')


def commands(request):
    return render(request, 'commands.html')


def map(request):
    return render(request, 'map.html')


def preview(request):
    return render(request, 'preview.html')


def profiles(request):
    return render(request, 'profiles.html')


def sections(request):
    return render(request, 'sections.html')


def simulation(request):
    return render(request, 'simulation.html')


def settings(request):
    return render(request, 'settings.html')
