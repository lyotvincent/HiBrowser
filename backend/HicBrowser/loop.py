import json
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
import sqlite3

const_loop_range = 1e4


def analysis_loop_type(request):
    body = json.load(request.body)
    c = body['chr']
    s = int(body['s'])
    e = int(body['e'])
    conn = sqlite3.connect('./hic.db')
    cursor = conn.cursor()
    # query closest gene
    sql = "select * from refGene where chrom = '{}' and (txStart <= {} and txStart >= {}) or (txEnd <={} and txEnd >= {})".\
        format(
            c,
            s + const_loop_range,
            s - const_loop_range,
            s + const_loop_range,
            s - const_loop_range)
    cursor.execute(sql)
    logs = cursor.fetchall()
    for log in logs:
        print(log)

    '''
    query if have gene 1000b
    query if belong to enhancer
    query if belong to super enhancer
    '''
    # analysis start
