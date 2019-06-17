from django.shortcuts import render
from django.http import HttpRequest, HttpResponse

# Create your views here.

def preview(request):
    return render(request, 'nephelae/preview.html')

def cross_section(request):
    return render(request, 'nephelae/cross_section.html')

def infos(request):
    return render(request, 'nephelae/infos.html')