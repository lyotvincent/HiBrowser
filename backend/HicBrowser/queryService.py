import json
import os
import sqlite3
from . import disease

'''
data:
{
    'type': 'Locus',
    'val': 'value'
}
return:
{
    'locus': '',
    'gene': ' ',
    'disease' : [],
    'enhancer' : [],
    'super enhancer': []
}
'''

db = os.path.dirname(__file__) + '/hic.db'
const_loop_range = 1e5 # 100kb


def get_enhancer_by_gene(gene):
    conn = sqlite3.connect(db)
    cursor = conn.cursor()
    sql = "select chrom, txStart, txEnd from enhancer where gene like '%{}%' ".format(gene)
    cursor.execute(sql)
    enhancer_logs = cursor.fetchall()
    enhancer_info = ''
    for enhancer_log in enhancer_logs:
        enhancer_info += enhancer_log[0] + ':' + str(enhancer_log[1]) + '-' + str(enhancer_log[2]) + ','
    conn.commit()
    conn.close()
    return enhancer_info[:-1]


def get_super_enhancer_by_gene(gene):
    conn = sqlite3.connect(db)
    cursor = conn.cursor()
    sql = "select  chrom, txStart, txEnd from superEnhancer where cloestactivegene like '%{}%' ".format(gene)
    cursor.execute(sql)
    super_enhancer_logs = cursor.fetchall()
    super_enhancer_info = ''
    for super_enhancer_log in super_enhancer_logs:
        super_enhancer_info += super_enhancer_log[0] + ':' + str(super_enhancer_log[1]) + '-' + str(super_enhancer_log[2]) + ','
    conn.commit()
    conn.close()
    return super_enhancer_info[:-1]


def get_genes_by_name(name):
    conn = sqlite3.connect(db)
    cursor = conn.cursor()
    # get gene info
    sql = "select name1, chrom, strand, txStart, txEnd, name2 ,count(distinct name2) from refGene where name2 like '%{}%' group by  name2".format(
        name)
    cursor.execute(sql)
    # ('NM_001136131', 'chr21', '-', 26174731, 26465317, 'APP', 1)
    gene_logs = cursor.fetchall()
    conn.commit()
    conn.close()
    return gene_logs


def get_disease_by_genes(q_genes):
    names = ','.join(map(str, q_genes.keys()))
    diseases = disease.query_disease_by_gene(names)
    if diseases is None:
        return None
    d_infos = {}
    for d in diseases:
        if type(d) != dict:
            continue
        g_name = d['gene_symbol']
        idx = q_genes[g_name]
        if idx in d_infos:
            d_infos[idx] += d['disease_name'] + ','
        else:
            d_infos[idx] = d['disease_name'] + ','
    return d_infos


def get_gene_by_disease_ids(q_disease):
    ids = ','.join(q_disease)
    genes = disease.query_gene_by_disease(ids)
    if genes is None:
        return None
    gene_infos = []
    for gene in genes:
        gene_info = {}
        if type(gene) != dict:
            continue
        else:
            gene_info['gene_name'] = gene['gene_symbol']
            gene_info['disease_name'] = gene['disease_name']
            gene_infos.append(gene_info)
    return gene_infos


def get_disease_id_by_name(name):
    conn = sqlite3.connect(db)
    cursor = conn.cursor()
    sql = "select distinct diseaseId from diseaseAttributes where diseaseName like '%{}%' ".format(name)
    cursor.execute(sql)
    conn.commit()
    logs = cursor.fetchall()
    conn.close()
    return logs


def get_promoter_by_gene(gene):
    conn = sqlite3.connect(db)
    cursor = conn.cursor()
    sql = "select  chrom, txStart, txEnd, mode from epd where gene like '%{}%' ".format(gene)
    cursor.execute(sql)
    promoter_logs = cursor.fetchall()
    promoter_info = ''
    for promoter_log in promoter_logs:
        promoter_info += promoter_log[0] + ':' + str(promoter_log[1]) + '-' + str(
            promoter_log[2]) + ','
    conn.commit()
    conn.close()
    return promoter_info[:-1]


def get_tf_target_by_gene(name):
    tf_target = {}
    conn = sqlite3.connect(db)
    cursor = conn.cursor()
    sql = "select *, count(distinct Target) from TRRUST where TF='{}' group by Target".format(name)
    cursor.execute(sql)
    targets = cursor.fetchall()
    target_info = ''
    for target in targets:
        if target[2] == 'Activation':
            mode = '+'
        elif target[2] == 'Repression':
            mode = '-'
        else:
            mode = '?'
        target_info += target[1] + "({})".format(mode) + ','
    target_info = target_info[:-1]
    tf_target['target'] = target_info
    sql = "select *, count(distinct TF) from TRRUST where Target='{}' group by TF".format(name)
    cursor.execute(sql)
    tfs = cursor.fetchall()
    tf_info = ''
    for tf in tfs:
        if tf[2] == 'Activation':
            mode = '+'
        elif tf[2] == 'Repression':
            mode = '-'
        else:
            mode = '?'
        tf_info += tf[0] + "({})".format(mode) + ','
    tf_info = tf_info[:-1]
    tf_target['TF'] = tf_info
    conn.commit()
    conn.close()
    return tf_target


def get_gene_locus_by_name(name):
    conn = sqlite3.connect(db)
    cursor = conn.cursor()
    sql = "select chrom, txStart, txEnd from refGene where name2='{}'".format(name)
    cursor.execute(sql)
    locus = ''
    logs = cursor.fetchall()
    if len(logs) >= 1:
        log = logs[0]
        locus = log[0] + ':' + format(log[1], ',') + '-' + format(log[2], ',')
    conn.commit()
    conn.close()
    return locus


def generate_res(gene_logs):
    res = []
    genes = {}
    for idx, gene_log in enumerate(gene_logs):
        card = dict()
        card['id'] = gene_log[0]
        card['locus'] = gene_log[1] + ':' + format(gene_log[3], ',') + '-' + format(gene_log[4], ',')
        card['strand'] = gene_log[2]
        card['name'] = gene_log[5]
        # get enhancer info
        card['enhancer'] = get_enhancer_by_gene(gene_log[5])
        card['promoter'] = get_promoter_by_gene(gene_log[5])
        card['super_enhancer'] = get_super_enhancer_by_gene(gene_log[5])
        genes[gene_log[5]] = idx
        card['diseases'] = ''
        tf_target = get_tf_target_by_gene(gene_log[5])
        card['TF'] = tf_target['TF']
        card['target'] = tf_target['target']
        res.append(card)
    disease_infos = get_disease_by_genes(genes)
    if disease_infos is not None:
        for k in disease_infos.keys():
            res[k]['diseases'] = disease_infos[k][:-1]
    return res


# 8:1-131,738,871
def parse_locus(locus):
    locus = locus.split(':')
    ch = locus[0]
    if ch[0] != 'c':
        ch = 'chr' + ch
    scales = locus[1].split('-')
    s = scales[0].replace(',', '')
    s = int(s)
    e = scales[1].replace(',', '')
    e = int(e)
    return ch, s, e


'''
1. Cha xun gei ding fan wei shi fou shi yi ge ji yin de nei bu [get_external_gene]
2. Cha xun gei ding fan wei nei bu shi fou you ji yin [get_internal_gene]
3. Cha xun gei ding fan wei shi shi fou he ji yin zuo jiao cha [get_left_cross_gene]
4. Cha xun gei ding fan wei shi shi fou he ji yin you jiao cha [get_right_cross_gene]

he bing: chrome = chr and txStart <= x_e and txEnd >= x_s
'''


def get_external_gene(chr_x, x_s, x_e):
    conn = sqlite3.connect(db)
    cursor = conn.cursor()
    sql = "select name1, chrom, strand, txStart, txEnd, name2, count(distinct name2) from refGene where chrom='{}' and txStart <= {} and txEnd >= {} group by name2".format(chr_x, x_s, x_e)
    cursor.execute(sql)
    logs = cursor.fetchall()
    conn.commit()
    conn.close()
    return logs


def get_internal_gene(chr_x, x_s, x_e):
    conn = sqlite3.connect(db)
    cursor = conn.cursor()
    sql = "select name1, chrom, strand, txStart, txEnd, name2, count(distinct name2) from refGene where chrom='{}' and txStart >= {} and txEnd <= {} group by name2".format(chr_x, x_s, x_e)
    cursor.execute(sql)
    logs = cursor.fetchall()
    conn.commit()
    conn.close()
    return logs


def get_left_cross_gene(chr_x, x_s, x_e):
    conn = sqlite3.connect(db)
    cursor = conn.cursor()
    sql = "select name1, chrom, strand, txStart, txEnd, name2, count(distinct name2) from refGene where chrom='{}' and txStart >= {} and txStart <= {} and txEnd >= {} group by name2".format(chr_x, x_s, x_e, x_e)
    cursor.execute(sql)
    logs = cursor.fetchall()
    conn.commit()
    conn.close()
    return logs


def get_right_cross_gene(chr_x, x_s, x_e):
    conn = sqlite3.connect(db)
    cursor = conn.cursor()
    sql = "select name1, chrom, strand, txStart, txEnd, name2,count(distinct name2) from refGene where chrom='{}' and txStart <= {} and txEnd <= {} group by name2".format(chr_x, x_s, x_e)
    cursor.execute(sql)
    logs = cursor.fetchall()
    conn.commit()
    conn.close()
    return logs


def get_left_close_gene(chr_x, x_s, x_e):
    conn = sqlite3.connect(db)
    cursor = conn.cursor()
    sql = "select name1, chrom, strand, txStart, txEnd, name2, count(distinct name2) from refGene where chrom='{}' and txEnd < {} and txEnd > {} group by name2".format(chr_x, x_s, x_s - const_loop_range)
    print(sql)
    cursor.execute(sql)
    logs = cursor.fetchall()
    conn.commit()
    conn.close()
    return logs


def get_right_close_gene(chr_x, x_s, x_e):
    conn = sqlite3.connect(db)
    cursor = conn.cursor()
    sql = "select name1, chrom, strand, txStart, txEnd, name2, count(distinct name2) from refGene where chrom='{}' and txStart > {} and refGene.txStart < {} group by name2".format(chr_x, x_e, x_e + const_loop_range)
    cursor.execute(sql)
    logs = cursor.fetchall()
    conn.commit()
    conn.close()
    return logs


# si ge cha xun de he bing sql
def get_cross_gene_by_locus(chr_x, x_s, x_e):
    conn = sqlite3.connect(db)
    cursor = conn.cursor()
    sql = "select name1, chrom, strand, txStart, txEnd, name2, count(distinct name2) from refGene where chrom='{}' and txStart <= {} and txEnd >= {} group by name2".format(chr_x, x_e, x_s)
    cursor.execute(sql)
    logs = cursor.fetchall()
    conn.commit()
    conn.close()
    return logs


def query_by_gene(q_val):
    gene_logs = get_genes_by_name(q_val)
    res = generate_res(gene_logs)
    return res


def query_by_disease(q_val):
    res = []
    disease_ids = []
    disease_logs = get_disease_id_by_name(q_val)
    for disease_log in disease_logs:
        disease_ids.append(disease_log[0])
    gene_diseases = get_gene_by_disease_ids(disease_ids)
    for gene_disease in gene_diseases:
        card = {}
        g_name = gene_disease['gene_name']
        gene_logs = get_genes_by_name(g_name)
        if len(gene_logs) < 1:
            continue
        gene_log = gene_logs[0]
        card['id'] = gene_log[0]
        card['locus'] = gene_log[1] + ':' + format(gene_log[3], ',') + '-' + format(gene_log[4], ',')
        card['strand'] = gene_log[2]
        card['name'] = gene_log[5]
        card['enhancer'] = get_enhancer_by_gene(gene_log[5])
        card['promoter'] = get_promoter_by_gene(gene_log[5])
        card['super_enhancer'] = get_super_enhancer_by_gene(gene_log[5])
        card['diseases'] = gene_disease['disease_name']
        tf_target = get_tf_target_by_gene(gene_log[5])
        card['TF'] = tf_target['TF']
        card['target'] = tf_target['target']
        res.append(card)
    return res



def query_by_locus(chr_x, x_s, x_e):
    genes = []
    c_logs = get_cross_gene_by_locus(chr_x, x_s, x_e)
    genes += c_logs
    # cha zhao zuo he you ji yin
    if len(genes) < 1:
        l_logs = get_left_close_gene(chr_x, x_s, x_e)
        r_logs = get_right_close_gene(chr_x, x_s, x_e)

        genes += l_logs
        genes += r_logs
    if len(genes) > 0:
        res = generate_res(genes)
    else:
        res = None
    return res


def query(request):
    res = None
    data = json.loads(request.body)
    q_type = data['type']
    q_val = data['val']
    if q_type == 'Locus':
        # valid locus
        q_val = q_val.split(' ')
        if len(q_val) >= 1:
            chr_x, x_s, x_e = parse_locus(q_val[0])
            res = query_by_locus(chr_x, x_s, x_e)
        else:
            pass
    elif q_type == 'Gene':
        res = query_by_gene(q_val)
    elif q_type == 'Disease':
        res = query_by_disease(q_val)
    else:
        pass
    return res


def query_locus_by_gene_name(request):
    data = json.loads(request.body)
    name = data['name']
    locus = get_gene_locus_by_name(name)
    return locus
