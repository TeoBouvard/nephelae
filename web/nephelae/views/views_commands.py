from django.http import HttpResponseNotFound, HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render


# Rendering of empty pages
def commands(request):
    return render(request, 'commands.html')