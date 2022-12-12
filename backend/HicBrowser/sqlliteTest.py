import hicstraw
import json
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
import sqlite3

const_loop_range = 1e5


def query():
    conn = sqlite3.connect('./hic.db')
    cursor = conn.cursor()
    sql = "select * from TRRUST where Target = '{}'".format('TP53')
    cursor.execute(sql)
    logs = cursor.fetchall()
    for log in logs:
        print(log)


hic ='/home/klstftz/Desktop/BrowserTestFile/human.hic'

bedHiC = '/home/klstftz/Desktop/BrowserTestFile/human_1_100kb.bed'


result = hicstraw.straw('observed', 'KR', hic, '1', '1', 'BP', 100000)

