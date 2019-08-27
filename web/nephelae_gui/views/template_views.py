from django.shortcuts import render


def render_template(request, template_name):
    return render(request, template_name)
