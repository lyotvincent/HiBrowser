import json
import numpy as np


def load_data(name):
    return


def get_chr(k):
    k = k.split('_')[0]
    if not k.startswith('chr'):
        k = 'chr' + k
    return k


def get_box(_track, v):
    arr = []
    res = []
    for t in v:
        if _track == 'tad':
            arr.append((t['x2'] - t['x1'])//1e3)
        else:
            arr.append((t['y1'] - t['x1'])//1e3)
    arr = np.asarray(arr)
    res.append(float(np.min(arr)))
    res.append(float(np.percentile(arr, 25)))
    res.append(float(np.median(arr)))
    res.append(float(np.percentile(arr, 75)))
    res.append(float(np.percentile(arr, 95)))
    return res


def get_idx(seq):
    return [x for x, y in sorted(enumerate(seq), key=lambda x: int(x[1]) if x[1].isdigit() else ord(x[1]))]


def get_res(_track, _feature, _feature_k, _has_chr):
    res = {}
    categories = []
    boxes = []
    nums = []
    _idx = get_idx(_feature_k)
    for idx in _idx:
        k = _feature_k[idx]
        if _has_chr:
            k = 'chr' + k
        k = k + '_' + k
        v = _feature[k]
        k = get_chr(k)
        categories.append(k)
        nums.append(len(v))
        box_item = get_box(_track, v)
        boxes.append(box_item)

    res['categories'] = categories
    res['boxes'] = boxes
    res['nums'] = nums
    return res


def get_ab(v):
    total_length = 0
    length_a = 0
    length_b = 0
    for o in v:
        s = o['start'] // 1e3
        e = o['end'] // 1e3
        val = o['value']
        total_length += e - s
        if val < 0:
            length_b += e - s
        else:
            length_a += e - s
    length_a = length_a / total_length
    length_b = length_b / total_length

    return [length_a, length_b]


def get_ab_res(_track, _feature, _feature_k, _has_chr):
    res = {}
    categories = []
    a = []
    b = []
    _idx = get_idx(_feature_k)
    for idx in _idx:
        k = _feature_k[idx]
        k = str(k)
        if _has_chr:
            k = 'chr' + k
        v = _feature[k]
        k = get_chr(k)
        categories.append(k)
        ab = get_ab(v)
        a.append(ab[0])
        b.append(ab[1])

    res['categories'] = categories
    res['a'] = a
    res['b'] = b
    return res


"""
_feature_k shi feature zi dian de key,qu chu [chr]
"""


def get_feature_k(_feature):
    _l = len(_feature)
    _feature_k = []
    _has_chr = False
    for _k in _feature.keys():
        _k = _k.split('_')[0]
        if _k.startswith('chr'):
            _k = _k[3:]
            if _k == '' or _k is None:
                continue
            _has_chr = True
        if _k == '' or _k is None:
            continue
        _feature_k.append(_k)
    return _has_chr, _feature_k


def deal_feature(_track, _feature):
    _has_chr, _feature_k = get_feature_k(_feature)
    if _track == 'ab':
        res = get_ab_res(_track, _feature, _feature_k, _has_chr)
    else:
        res = get_res(_track, _feature, _feature_k, _has_chr)
    return res


def analyse_single(request):
    data = json.loads(request.body)
    track = data["track"]
    feature = data["feature"]
    res = deal_feature(track,feature)
    # feature is a dict
    return res


def obj_to_list(v):
    arr = []
    for item in v:
        s = item['start'] // 1e3
        e = item['end'] // 1e3
        arr.append([s, e])
    return arr


'''
return 
{
'total':[aa,ab,ba,bb],
'categories1':[]

'nums':[[],[],[],[]]
}
'''


def get_switch(v1, v2):
    aa = 0
    ab = 0
    ba = 0
    bb = 0
    for i in range(len(v1)):
        o1 = v1[i]
        o2 = v2[i]
        if o1['value'] > 0:
            if o2['value'] > 0:
                aa += 1
            else:
                ab += 1
        else:
            if o2['value'] > 0:
                bb += 1
            else:
                ba += 1
    return aa, ab, ba, bb


def get_ab_switch_res(feature1, feature2, _feature_k, _has_chr):
    res = {}
    categories = []
    nums = []
    nums_aa = []
    nums_ab = []
    nums_ba = []
    nums_bb = []
    _idx = get_idx(_feature_k)
    for idx in _idx:
        k = _feature_k[idx]
        k = str(k)
        if _has_chr:
            k = 'chr' + k
        v1 = feature1[k]
        v2 = feature2[k]
        k = get_chr(k)
        categories.append(k)
        switch = get_switch(v1, v2)
        nums_aa.append(switch[0])
        nums_aa.append(switch[1])
        nums_aa.append(switch[2])
        nums_aa.append(switch[3])
    nums.append(nums_aa)
    nums.append(nums_ab)
    nums.append(nums_ba)
    nums.append(nums_bb)
    res['categories'] = categories
    res['nums'] = nums
    return res


def deal_ab_switch(feature1, feature2):
    _has_chr, _feature_k = get_feature_k(feature1)
    res = get_ab_switch_res(feature1, feature2, _feature_k, _has_chr)
    return res


def analyse_switch(request):
    data = json.loads(request.body)
    track = data["track"]
    feature1 = data["feature1"]
    feature2 = data["feature2"]
    res = deal_ab_switch(feature1, feature2)
    print(res)
    return res
