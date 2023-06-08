import os
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import json
from django.http import HttpResponse
from . import utilService
from . import queryService
from . import analyseService


def index(request):
    context = {'msg': 'Congratulation! API is ok', 'doc': 'https://hic.bioaimed.com', 'author': '@nkul'}
    print(os.getcwd())
    return render(request, 'test.html', context)


@csrf_exempt
def generate_session(request):
    id = utilService.generate_session()
    return HttpResponse(json.dumps({
        "data": id
    }))


@csrf_exempt
def query(request):
    data = queryService.query(request)
    return HttpResponse(json.dumps({
        "data": data
    }))


@csrf_exempt
def query_gene_locus(request):
    data = queryService.query_locus_by_gene_name(request)

    return HttpResponse(json.dumps({
        "data": data
    }))


@csrf_exempt
def analyse_single(request):
    data = analyseService.analyse_single(request)
    return HttpResponse(json.dumps({
        "data": data
    }))


@csrf_exempt
def analyse_switch(request):
    data = analyseService.analyse_switch(request)
    return HttpResponse(json.dumps({
        "data": data
    }))


@csrf_exempt
def gene_variant(request):
    data = queryService.gene_variant(request)
    return HttpResponse(json.dumps({
        "data": data
    }))
