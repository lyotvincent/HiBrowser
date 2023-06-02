import {create2bar, createDrilldown, createBoxPlot, createColumn, createStkColumn} from'./chart.js'
import {gene_locus_range, parseLocus} from './global.js'
import { api_url } from './setting.js';


//====================全局变量 start============================
let infos = []; // 从hic浏览器传过来的信息
const dataLabels = {
  enabled: true,
  format: '{point.y}'
};

const tooltip = {
  headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
  pointFormat: '<span style="color:{point.color}">{point.category}</span>: <b>{point.y}</b><br/>'
};
let live_igv_browser = undefined;
let live_hic_browser = undefined;


let info$1 = undefined; // tad:{},loop:{}, ab:{}, ref:
let info$2 = undefined; // tad:{},loop:{}, ab:{}, ref:
let ab$ = undefined;//
let mergeAB$ = undefined; //
let switchAB$ = undefined; // {1:{aa:[],ab:[]}}


//====================data per page============================
let pageNum = 0;
let right_svg = undefined;
let right_com = undefined;
let right_cate = undefined;
let right_track_type = undefined;


let AB2Merged$ = undefined; // 合并后的track只有-1 和 1的abcompartment


//===================2 bar============================
let tad$ = undefined;
let loop$ = undefined;
let tadChange$ = undefined; // {}
let loopChange$ = undefined; // {}
//====================全局变量 end============================


//====================接受父页面，生成左侧信息卡片 start============================

function getAllBrowser(){
  live_igv_browser = undefined;
  live_hic_browser = undefined;
  [live_hic_browser, live_igv_browser] =  parent.getAllBrowser();
}

function hic_browser_info(){
  live_hic_browser.forEach(function(v,k){
    if(v.dataset === undefined) return;
    let info = {};
    info.id = v.id;
    info.name = v.dataset.name;
    
    info.tad = [];
    info.ab = [];
    info.loop = [];
    info.tad = v.findTracks('track_type','tad');
    info.loop = v.findTracks('track_type','loop');
    infos.push(info);
  });
}

function igv_browser_info(){
  for(let info of infos){
    let _id = info.id;
    if(! live_igv_browser.has(_id)) return;
    let igv = live_igv_browser.get(_id);
    info.ab = igv.findTracks("track_type", "ab");
    info.ref = igv.findTracks("track_type", "refseq");
  }
}

function initInfo(){
  getAllBrowser();    
  hic_browser_info();
  igv_browser_info();
  console.log(infos);
}

function generateCard(info,idx){
  let _html = `
    <div class="ana-card">
      <div class="ana-title">
        <span class="ana-file-icon" onclick="moveCard('${idx}','up')"><i class="fa fa-arrow-up"></i></span>
        <span class="ana-file-icon" onclick="moveCard('${idx}','down')"><i class="fa fa-arrow-down"></i></span>
        <input type="text" readonly placeholder="${info.name}">
      </div>
      <div class="ana-tracks">
  `;

  for(let tad of info.tad){
    let _span = `<span><i>TAD</i>${tad.name}</span>`
    _html += _span;
  }

  for(let loop of info.loop){
    let _span = `<span><i>Loop</i>${loop.name}</span>`
    _html += _span;
  }

  for(let ab of info.ab){
    let _span = `<span><i>A/B</i>${ab.id}</span>`
    _html += _span;
  }

  _html += `
    </div>
  </div>
  `
  return _html;
}

function initPageInfo(){
  $('.ana-left').children().remove();
  for(let i = 0; i < infos.length; i ++){
    let _html = generateCard(infos[i], i);
    $('.ana-left').append(_html);
  }
}


//====================接受父页面，生成左侧信息卡片 end============================



function getABFeature(idx = 0){
  let ab = infos[idx].ab[0];
  if (ab === undefined) return undefined;
  let source = ab.featureSource;
  let cache = source.featureCache;
  let feature = cache.allFeatures;
  return feature;
}

function getFeature(idx = 0, track_type = 'tad'){
  let track = infos[idx];
  track = track[track_type][0];
  if(track === undefined) return undefined;
  return track.featureMap;
  
}

function checkAB(){
  return infos.length >= 2 && infos[0].ab.length > 0 && infos[1].ab.length > 0;
}


//====================初始化头两张卡片的信息============================
function ajax$1(idx, track = 'tad'){
  if(infos[idx] === undefined) return;
  let feature;
  if(track === 'tad'){
    let tad = infos[idx].tad[0];
    if(tad === undefined) {
      return;
    }
    feature = tad.featureMap;
  }else if(track === 'loop'){
    let loop = infos[idx].loop[0];
    if(loop === undefined) {
      return;
    }
    feature = loop.featureMap;
  }else{
    let ab = infos[idx].ab[0];
    if(ab === undefined) {
      return;
    }
    try {
      let source = ab.featureSource;
      let cache = source.featureCache;
      feature = cache.allFeatures;
    } catch (error) {
      return;
    }
  }
  
  $.ajax({
    type: "post",
    url:api_url + '/test',
    dataType: 'json',
    data: JSON.stringify({'track': track,'feature': feature}),
    contentType: 'application/json',
    async:false, // 同步
    success: function(res){
      if(idx === 0){
        info$1[track] = res.data;
      }else{
        info$2[track] = res.data;
      }
    },
    error: function(err){
      console.log(err);
    }
  })
}

// 初始化info$1 info$2信息
function initInfo$(){
  info$1 = {};
  info$2 = {};
  for(let i = 0; i < 2; i ++){
    ajax$1(i, 'tad');
    ajax$1(i, 'loop');
    if(!checkAB()){
      ajax$1(i, 'ab');
    }
  }
  console.log('info$1', info$1);
  console.log('info$2', info$2)
}
//====================初始化头两张卡片的信息 end============================



function drilldownDataHelp(){
  let total = ab$.total;
  let sum = 0;
  for(let t of total){
    sum += t;
  }
  let nums = ab$.nums;
  let data1 = [
    {
      "name": "A -> A ",
      "y": total[0] / sum * 100,
      "drilldown": "AA"
    },
    {
      "name": "A -> B ",
      "y": total[1] / sum * 100,
      "drilldown": "AB"
    },
    {
      "name": "B -> A ",
      "y": total[2]/ sum * 100,
      "drilldown": "BA"
    },
    {
      "name": "B -> B ",
      "y": total[3] / sum * 100,
      "drilldown": "BB"
    }
  ];

  let data2 = [];
  let names = ['AA', 'AB', 'BA', 'BB'];
  for(let i  = 0; i < 4; i ++){
    let _data = {
      "name": names[i],
      "id": names[i],
      "data": nums[i],
      "dataLabels":dataLabels,
      "tooltip":tooltip,
      "type":"column",
      "colorByPoint":true,
      events:{
        click:function(event){
          let point = event.point;
          show2DDetail('switch',this.name, point.category, point.options);
        }
      }
    };
    data2.push(_data);
  }
  return [data1, data2]
}

function createDrilldownHelp(){
  let [data1, data2] = drilldownDataHelp();
  let categories = ab$.categories;
  let _id = 'container2';
  $(`#${_id}`).children().remove();
  let config = {
    id: _id,
    title:infos[0].name + ' VS ' + infos[1].name,
    subtitle:'<i>' + infos[0].name + ' to ' + infos[1].name + " Genomic Compartment Switch</i>",
    name1:"TOTAL",
    categories: categories,
    data1:data1,
    data2:data2
  }
  createDrilldown(config);
}


//====================中间三个图表信息============================
async function singleSampleInfo(track = 'tad'){
  let _id = 'container0';
  $(`#${_id}`).children().remove();
  let data = info$1[track];
  if(data === undefined) return;
  let config = {
    id:_id,
    categories: data.categories,
    title: 'Box Plot of Each Chromosome For Size of ' + track.toUpperCase() + '<br> <i style="font-size:10px;"> ' + infos[0].name + '. unit (kb)</i>',
    name: infos[0].name,
    data: data.boxes
  }
  createBoxPlot(config);
  let chart = $(`#${_id}`).highcharts();
  chart.reflow();
}

async function TwoSampleInfo(track = 'tad'){
  let _id = 'container1';
  $(`#${_id}`).children().remove();
  let data1 = info$1[track];
  let data2 = info$2[track];
  

  if(data1 === undefined && data2 === undefined) return;
  let subtitle = '<i style="font-size:10px">For Number of ' + track.toUpperCase() + '</i>';
  if(data1 !== undefined && data2 !== undefined){
    let name1 = infos[0].name;
    let name2 = infos[1].name;
    let config = {
      id: _id,
      title:name1 + ' VS ' + name2,
      subtitle: subtitle,
      name1 : track + '_0',
      name2 : track + '_1',
      data1 : data1.nums,
      data2 : data2.nums,
      categories1: data1.categories,
      categories2: data2.categories
    }
    create2bar(config);
   
  }else{
    let categories = data1 === undefined ? data2.categories : data1.categories;
    let title = data1 === undefined ? infos[1].name : infos[0].name;
    let data = data1 === undefined ? data2.nums : data1.nums;
    let config = {
      id : _id,
      categories: categories,
      title: title,
      subtitle : subtitle,
      name: title,
      data:data

    }
    createColumn(config);
  }
  let chart = $(`#${_id}`).highcharts();
  chart.reflow();
}

async function SwitchInfo(){
  let _id = 'container2';
  $(`#${_id}`).children().remove();
  let data1 = info$1['ab'];
  let data2 = info$2['ab'];
  if(checkAB()){
    if(ab$ === undefined) initAB$();
    createDrilldownHelp();
    $(`#display`).show();
  }else{
    if(data1 === undefined && data2 === undefined) return;
    else{
      let title = 'The Size of A/B Compartment <br/> <i style="font-size:10px"> for ' + (data1 === undefined ? infos[1].name : infos[0].name) + '</i><br/>';
      let config = {
        id : _id,
        categories: data1 === undefined ? data2.categories : data1.categories,
        title: title,
        data1:data1 === undefined ? data2.a : data1.a,
        data2:data1 === undefined ? data2.b : data1.b
      }
      createStkColumn(config);
    }

  }
  let chart = $(`#${_id}`).highcharts();
  chart.reflow();
}


//====================右侧详细信息相关函数============================
/**
 * Switch AB信息统计
 */
function initAB$(){
  ab$ = {};
  let feature1 = getABFeature(0);
  let feature2 = getABFeature(1);
  let categories = [];
  let total = [], total_aa = 0, total_ab = 0, total_ba = 0, total_bb = 0;
  let nums = [], nums_aa = [], nums_ab = [], nums_ba = [], nums_bb = [];
  for(let key in feature1){
    if(key === 'chr') continue;
    categories.push(get_chr(key));
    let v1 = feature1[key], v2 = feature2[key];
    let [aa, ab, ba, bb] = get_switch(v1, v2);
    total_aa += aa, total_ab += ab, total_ba += ba, total_bb += bb;
    nums_aa.push(aa), nums_ab.push(ab), nums_ba.push(ba), nums_bb.push(bb);
  }
  total.push(total_aa, total_ab, total_ba, total_bb);
  nums.push(nums_aa, nums_ab, nums_ba, nums_bb);
  ab$.categories = categories;
  ab$.total = total;
  ab$.nums = nums;
  console.log('ab$', ab$);
}


function get_switch(v1, v2){
  let aa = 0, ab = 0, ba = 0, bb = 0;
  let i = 0, j = 0;
  while(i < v1.length && j < v2.length){
    let o1 = v1[i], o2 = v2[i];
    if(o1 === undefined || o2 === undefined){
      break;
    }
    if(o1.start < o2.start) i ++;
    else if (o1.start > o2.start) j ++;
    else{
      if (o1.value > 0){
        if(o2.value > 0) aa += 1;
        else ab += 1;
      }else{
        if(o2.value < 0) bb += 1;
        else ba += 1;
      }
      i ++;
      j ++;
    }
  }
  while(i < v1.length){
    let o = v1[i];
    if(o === undefined) break;
    if (o.value > 0){
      aa += 1;
    }else{
      bb += 1;
    }
    i ++;
  }
  while(j < v2.length){
    let o = v2[j];
    if(o === undefined) break;
    if (o.value > 0){
      aa += 1;
    }else{
      bb += 1;
    }
    j ++;
  }
  return [aa, ab, ba, bb];
}

function get_chr(k){
  if(!k.startsWith('chr')){
    k = 'chr' + k;
  }
  return k;
}

function mergeRange(v){
  let nv = [];
  let pre = v[0];
  for(let i = 1; i < v.length; i ++){
    //某些软件处理完输出时，会加1
    if(Math.abs(v[i].start - pre.end) <= 1){
      pre.end = v[i].end;
    }else{
      nv.push(pre);
      pre = v[i];
    }
  }
  nv.push(pre);
  return nv;
}

/**
 * 
 * @param {*} cate chr1
 * @param {*} page 0
 * @param {*} name AA、AB、BA、BB
 * 
 * 
 * {
 *    1:{
 *      aa:[],ab:[],ba:[],bb:[]
 * }
 * }
 */
function initSwitch$(){
  switchAB$ = {};
  let ab1 = getABFeature(0);
  let ab2 = getABFeature(1);
  for(let k in ab1){
    if(k === 'chr') continue;
    let v1 = ab1[k], v2 = ab2[k];
    let aa = [], ab = [], ba = [], bb = [];
    let i = 0, j = 0;
    while(i < v1.length && j < v2.length){
      let o1 = v1[i], o2 = v2[i];
      if(o1 === undefined || o2 === undefined) break;
      if(o1.start < o2.start) i ++;
      else if (o1.start > o2.start) j ++;
      else{
        let t = {
          'chr':o1.chr,
          'start':o1.start,
          'end':o1.end
        };
        if(o1.value > 0){
          o2.value > 0 ? aa.push(t) : ab.push(t);
        }else{
          o2.value > 0 ? ba.push(t) : bb.push(t);
        }
        i ++;
        j ++;
      }
    }
    aa = mergeRange(aa);
    ab = mergeRange(ab);
    ba = mergeRange(ba);
    bb = mergeRange(bb);
    switchAB$[k] = {
      "AA":aa,
      "AB":ab,
      "BA":ba,
      "BB":bb 
    };
  }
}


function initMergeAB$(){
  mergeAB$ = {};
  let ab = getABFeature(0);
  if(ab === undefined || ab.length < 1) ab = getABFeature(1);
  for(let k in ab){
    if(k === 'chr') continue;
    let v = ab[k];
    let a = [], b = [];
    for(let i = 0; i < v.length; i ++){
      //这里使用对象拷贝，不要使用原对象，后面需要合并，会更改原始的track;
      let t = {
        'chr':v[i].chr,
        'start':v[i].start,
        'end':v[i].end
      };
      v[i].value > 0 ? a.push(t) : b.push(t);
    }
    a = mergeRange(a);
    b = mergeRange(b);
    mergeAB$[k] = {
      "A":a,
      "B":b
    };
  }
  console.log('mergeAB$', mergeAB$);
}

function insertHtml(_id, _html){
  $(`#${_id}`).html(_html)
}

function clearRight(){
  pageNum = 0;
  right_track_type = undefined;
  right_cate = undefined;
  right_svg = undefined;
  $(`#right-content`).children().remove();
  $(`#right-associate`).children().remove()
}


// k: 1_1  chr1_chr1   1  chr1
// cate:
function checkKey(k, cate){
  let _k = k.split('_')[0];
  let _cate = cate.split('_')[0];
  if(_k.startsWith('chr')) _k = _k.substr(3);
  if(_cate.startsWith('chr')) _cate = _cate.substr(3);
  return _k === _cate;
}


//====================刷新按钮============================
function updateChart(_id){
  if(_id === 'btn0-tad'){
    singleSampleInfo('tad');
  }else if(_id === 'btn0-loop'){
    singleSampleInfo('loop');
  }else if(_id === 'btn1-tad'){
    TwoSampleInfo('tad');
  }else if(_id === 'btn1-loop'){
    TwoSampleInfo('loop');
  }
  return;
}

function updateInfoAndChart(_id){
  if(_id === 're2'){
    initAB$();
    createDrilldownHelp();
  }else{
    initInfo$();
    let id_num = _id.substr(-1);
    let btn = `btn${id_num}-tad`;
    if($('#' + btn).hasClass('active')){
      updateChart(btn);
    }else{
      updateChart(`btn${id_num}-loop`);
    }
  }
  return;
}

function bindBtn(){
  let btn = $('.btn-group > button');
  $.each(btn, function(){
    $(this).click(function(){
      if($(this).hasClass('active')) return;
      else{
        $(this).addClass('active');
        $(this).siblings().removeClass('active');
        let _id = $(this).attr('id');
        updateChart(_id);
      }
    })
  });

  let re = $('.refresh-button');
  $.each(re, function(){
    $(this).click(function(){
      let _id = $(this).attr('id');
      updateInfoAndChart(_id);
    })
  });
}


//==========================页面初始化=========================================
function initArr(){
  //imgAmlify();
  initInfo(); // 加载从父亲传来的信息
  initPageInfo(); // 
}

async function initChart(){
  initInfo$();
  singleSampleInfo(); //加载单个样本信息
  TwoSampleInfo(); // 2个样本信息
  SwitchInfo()
  bindBtn();
}

$(document).ready(function () {
  initArr();
  initChart();
  //a();
});


//==========================图表点击事件相关函数=========================================
window.show2DDetail = function(svg, name, cate, options){
  clearRight();
  right_cate = cate;
  right_svg = svg;
  if(svg === 'switch'){
    showAB(name, cate, options.y);
  }else if(svg === '2bar'){
    show2Bar(name, cate, options);
  }else if(svg === 'box'){
    showBox(name, cate, options);
  }else if(svg === 'column'){
    showCol(name, cate, options);
  }else if(svg === 'stkcolumn'){
    showStkCol(name, cate, options);
  }
}

function getTrack(track_type, cate, page, name){
  if(track_type === undefined || cate === undefined) return undefined;
  let track;
  // AB compartment switch
  if(track_type === 'switch'){
    if(switchAB$  === undefined) initSwitch$();
    for(let k in switchAB$){
      if(checkKey(k, cate)){
        let v = switchAB$[k][name];
        let s  = page * 10;
        return v.slice(s, s + 10);
      }
    }
  }
  // only one AB
  else if(track_type === 'ab'){
    if(mergeAB$  === undefined) initMergeAB$();
    for(let k in mergeAB$){
      if(checkKey(k, cate)){
        let v = mergeAB$[k][name];
        let s  = page * 10;
        return v.slice(s, s + 10);
      }
    }
  }
  // tad or loop or tad_0 or tad_1;
  else{
    let t = track_type.split('_');
    track_type = t[0];
    track = getFeature(0, track_type);
    if(track === undefined || track.length < 1) track = getFeature(1, track_type);
    for(let k in track){
      if(checkKey(k, cate)){
        let v = track[k];
        let s  = page * 10;
        return v.slice(s, s + 10);
      }
    }
  }
  return undefined;

}

function showItem(track_type, data){
  let dom = $('#right-associate');
  dom.children().remove();
  let t = track_type.split('_');
  track_type = t[0];
  for(let d of data){
    let _html;
    if(track_type === 'loop' || track_type === 'tad'){
      if(t.length > 1){
        _html = `
        <div class="item" onclick="getGeneAndChange(this, '${d.chr1}', ${d.x1}, ${d.y2}, '${track_type}')"><span>${d.chr1}:${d.x1}-${d.y2}</span></div>
        `;
      }else{
        _html = `
        <div class="item" onclick="getGene(this, '${d.chr1}', ${d.x1}, ${d.y2})"><span>${d.chr1}:${d.x1}-${d.y1}</span></div>
        `;
      }
    }else{
      _html = `
      <div class="item" onclick="getGene(this, '${d.chr}', ${d.start}, ${d.end})">
        <span>${d.chr}:${d.start}-${d.end}</span>
      </div>
      `;
    }
    _html += `<div class="item-detail"></div>`;
    dom.append(_html);
  }
}

// 只有一个样本 加载ABcompartment
function showStkCol(name, cate, options){
  let track_type = "ab";
  let data = getTrack(track_type, cate, 0, name[0]);
  showItem(track_type, data);
  let num = options.y *100;
  let _html = `&nbsp;&nbsp; There are <b>${num.toFixed(2)}%</b> regions of <b>${cate}</b> being <i>Compartment ${name}</i>,
  The below list shows all of <u>${name} Compartment</u>.
  `
  insertHtml('right-content', _html);

  right_track_type = track_type;
  right_cate = cate;
  right_com = name;
}

//只有一个样本加载了tad或loop
function showCol(name, cate, options){
  let track_type = $('#btn1-tad').hasClass('active') ? 'tad':'loop';
  let track = info$1[track_type];
  if(track===undefined || track.length < 1) track = info$2[track_type];

  let idx = track.categories.indexOf(cate);
  let total = track.nums[idx];
  let _html = `&nbsp;&nbsp; A total of <b>${total}</b> <u>${track_type.toUpperCase()}</u> were found in ${name} on <b>${cate}</b>, 
      The below list shows all of them.
      `
  insertHtml('right-content', _html);
  let data = getTrack(track_type, cate, 0);
  showItem(track_type, data);

  right_track_type = track_type;
  right_cate = cate;
  right_com = name;
}

// 箱线图
function showBox(name, cate, options){
  let track_type = $('#btn0-tad').hasClass('active') ? 'tad':'loop';
  let track = info$1[track_type];
  let idx = track.categories.indexOf(cate);
  let total = track.nums[idx];
  let _html = `&nbsp;&nbsp; A total of <b>${total}</b> <u>${track_type.toUpperCase()}</u> were found in ${name} on <b>${cate}</b>, 
      And the [Maximun, Upper quartile, Median, Lower quartile, Minimum] measurement of ${track_type} size with P-values < 0.05
      are <u>${options.high.toFixed(2)}, ${options.q3.toFixed(2)}, ${options.median.toFixed(2)}, ${options.q1.toFixed(2)}, ${options.low.toFixed(2)}</u> <i>(unit kb)</i>.
      The below list shows all of them.
      `
  insertHtml('right-content', _html);
  let data = getTrack(track_type, cate, 0);
  showItem(track_type, data);

  right_track_type = track_type;
  right_cate = cate;
  right_com = name;
}

//ab转化分析
function showAB(name, cate, y){
  let total = ab$.total;
  let _html = `&nbsp;&nbsp; A total of <b>${total[1] + total[2]}</b>(<i>unit bin</i>) Compartment Switch occured, 
                from ${infos[0].name} to ${infos[1].name}. And there are <b>${total[0] + total[3]}</b>(<i>unit bin</i>) site remain the same.
                Among them, <b>${y}</b>(<i>unit bin</i>) <u>Compartment ${name[0]}</u> to <u>Compartment ${name[1]}</u> occurs in <b>${cate}</b>.
                The below list(<i>consecutive bins have been merged</i>) shows all for ${infos[0].name}.
                `;
  insertHtml('right-content', _html);
  let track_type = "switch";
  let data = getTrack(track_type, cate, 0, name);
  showItem(track_type, data);
  right_track_type = track_type; //ab
  right_cate = cate; // chr1
  right_com = name; // AA
  return;
}

function getRefFeature(){
  let ref = infos[0].ref;
  if (ref === undefined) return undefined;
  ref = ref[0];
  let cache = ref.featureSource.featureCache;
  let feature = cache.allFeatures;
  return feature;
}

function checkName(name1, name2){
  return name1 === name2;
}

function BinSerch(ref, s, e){
  let t_res = [];
  let l = 0, r = ref.length - 1;
  while(l < r){
    let mid = (l + r ) >> 1;
    let o = ref[mid];
    if(o.start > e) r = mid - 1;
    else if(o.end < s) l = mid + 1;
    else break;
  }
  // 从l-r之间遍历搜索
  for(let i = l; i <= r; i ++){
    let o = ref[i];
    if(o.start > s && o.end < e) t_res.push(o);
  }
  //去重
  let res = [];
  let pre = t_res[0];
  for(let i = 1; i < t_res.length; i++){
    let o = t_res[i];
    if(!checkName(pre.name, o.name)){
      res.push(pre);
      pre = o;
    }
  }
  return res;
}

function  generateGene(res){
  let _html = ``;
  if(res === undefined || res.length < 1){
    _html = `
    <div class="nogene">
    There are no genes in this region;
    </div>
    `
    return _html;
  }
  for(let g of res){
    _html += `
    <div class="gene" id = ${g.id}>
      <span>${g.name}</span>
      <span onclick="goBrowser('${g.chr}:${g.start}-${g.end}')">${g.chr}:${g.start}-${g.end}</span>
      <span>${g.strand}</span>
      <span onclick="goNCBI('${g.id}')"></span>
    </div>
    `
  }
  return _html;
}

function Intersection(feature1, feature2, track){
  let i = 0, j = 0;
  let res = [];
  while(i < feature1.length && j < feature2.length){
    let a1 = feature1[i].x1;
    let a2 = track === "tad" ? feature1[i].x2 : feature1[i].y1;
    let b1 = feature2[j].x1;
    let b2 = track === "tad" ? feature2[j].x2 : feature2[j].y1;
    if(b2 >= a1 && a2 >= b1){
      res.push([Math.max(a1, b1), Math.min(a2, b2)]);
    }
    if(b2 < a2) j += 1;
    else i += 1;
  }
  return res;
}

// k: 1 chr1  1_1 chr1_chr1
function getValue(feature, k){
  let t;
  t = k + '_' + k;
  let v;
  v = feature[t];
  if(v !== undefined) return v;
  if(!k.startsWith('chr')){
    t = 'chr' + k + '_chr' + k;
    v = feature[t];
  }
  return v;
}

// v2 : common
function getChange(v1, v2, track){
  let i = 0, j = 0;
  let res = [];
  while(i < v1.length && j < v2.length){
    let a1 = v1[i].x1, a2 = track === 'tad' ? v1[i].x2 : v1[i].y1;
    let b1 = v2[j][0], b2 = v2[j][1];
    if(a1 > b2) j += 1;
    else if(a2 < b1) i += 1;
    else{
      if(a1 !== b1 || a2 !== b2){
        let t = {
          'chr1': v1[i].chr1,
          'x1': a1,
          'x2':a2,
          'y1':b1,
          'y2':b2,
          'type':'change'
        }
        res.push(t);
      }
      i += 1;
      j += 1;
    }
  }
  return res;
}

function initChange$(track){
  let feature1 = getFeature(0, track);
  let feature2 = track === 'tad' ? tad$ : loop$;
  let t = {}
  for(let k in feature1){
    let v1 = feature1[k];
    let v2 = getValue(feature2, k);
    if(v1 === undefined || v2 === undefined){
      t[k] = v1;
    }else{
      t[k] = getChange(v1, v2, track);
    }
  }
  return t;
}

function initCommon$(track){
  let t = {};
  let feature1 = getFeature(0, track);
  let feature2 = getFeature(1, track);
  for(let k in feature1){
    let res;
    let v1 = feature1[k];
    let v2 = getValue(feature2, k);
    if(v1 === undefined || v2 === undefined){
      res = [];
    }else{
      res = Intersection(v1, v2, track);
    }
    t[k] = res;
  }
  return t;
}

/*
// 初始化tad 和 loop 的交集区域
function init2D$(track = 'tad'){
  if(track === 'tad'){
    tad$ = initCommon$(track);
    tadChange$ = initChange$(track);
    console.log(tad$);
    console.log(tadChange$);
  }else{
    loop$ = initCommon$('loop');
    loopChange$ =  initChange$('loop');
    console.log(loop$);
    console.log(loopChange$);
  }
}
*/


// tad和loop对比
function show2Bar(name, cate, options){
  let track_type = name.split('_')[0];
  let data = getTrack(name, cate, 0);
  showItem(name, data);

  right_track_type = name;
  right_cate = cate;
  right_com = name;

  let _html = `&nbsp;&nbsp; A total of <b>${options.y}</b> <u>${track_type.toUpperCase()}</u> were found in ${infos[0].name} on <b>${cate}</b>, 
      The below list shows all of them and you can click to view difference between samples.
      `
  insertHtml('right-content', _html);
  return;
}





function searchGene(chr, s, e){
  let res;
  let ref = getRefFeature();
  if (ref === undefined){
    res = undefined;
  }else{
    for(let k in ref){
      if(checkKey(k, chr)){
        res = BinSerch(ref[k], s, e);
        break;
      }
    }
  }
  return res;
}




//==========================右侧按钮事件===============================
$('#page-next').on('click',function(){
  $(this).blur();
  pageNum += 1;
  let data = getTrack(right_track_type, right_cate, pageNum, right_com);
  if(data=== undefined || data.length === 0) {
    layer.msg('No more data!');
    pageNum -= 1;
    return;
  }
  showItem(right_track_type, data);
})


$('#page-pre').on('click',function(){
  $(this).blur();
  if(pageNum === 0){
    layer.msg('No more data!');
    return;
  }
  pageNum -= 1;
  let data = getTrack(right_track_type, right_cate, pageNum, right_com);
  showItem(right_track_type, data);
})





//==========================display 相关事件===============================
function mergeValue(v){
  let nv = [];
  let pre = v[0];
  for(let i = 1; i < v.length; i ++){
    //某些软件处理完输出时，会加1
    if(v[i].value === pre.value ){
      pre.end = v[i].end;
    }else{
      nv.push(pre);
      pre = v[i];
    }
  }
  nv.push(pre);
  return nv;
}


function getMerge2AB(v1, v2){
  let res = [];
  let i = 0, j = 0;
  while(i < v1.length && j < v2.length){
    let o1 = v1[i], o2 = v2[i];
    if(o1 === undefined || o2 === undefined) break;
    if(o1.start < o2.start) i ++;
    else if(o1.start > o2.start) j ++;
    else{
      let t = {
        chr:o1.chr,
        start: o1.start,
        end: o1.end,
        value:1
      }
      if((o1.value < 0 && o2.value < 0) || (o1.value > 0 && o2.value > 0)){
        t.value = 1;
      }else {
        t.value = -1;
      }
      res.push(t);
      i ++;
      j ++;
    }
  }
  while(i < v1.length){
    let t = {
      chr:v1[i].chr,
      start: v1[i].start,
      end: v1[i].end,
      value:1
    }
    res.push(t);
    i ++;
  }
  res = mergeValue(res);
  return res;
}


function merge2AB(){
  let ab1 = getABFeature(0);
  let ab2 = getABFeature(1);
  AB2Merged$ = {};
  for(let k in ab1){
    let v1 = ab1[k],v2 = ab2[k];
    let res = getMerge2AB(v1, v2);
    AB2Merged$[k] = res;
  }
}

$('#display').on('click', async function(){
  $(this).blur();
  for(let igv of live_igv_browser){
    let t = igv[1].findTracks("track_type", "common_diff");
    if(t.length > 0){
      layer.msg('Switch track has been loaded. <br\> If you want to reload, go to the gene browser and remove it.')
      return;
    }
  }

  if(AB2Merged$ === undefined) merge2AB();
  let s = "";
  for(let k in AB2Merged$){
    let v = AB2Merged$[k];
    for(let o of v){
      if(o === undefined || o.chr === 'chr') continue;
      s += o.chr + '\t' + o.start + '\t' + o.end + '\t' + o.value + '\n';
    }
  }
  let blob = new Blob([s]);
  let url = window.URL.createObjectURL(blob);
  console.log(url);
  let config = {
    "track_type": "common_diff",
    "type": "wig",
    "url":url,
    "name":"switch",
    "height":50,
    "color":"rgb(255,44,28)",
    "altColor":"rgb(160, 159, 160)",
    "format":"bedGraph"
  }
  let _id = parent.getSelectId();
  let b = live_igv_browser.get(_id);
  b.loadTrackList([config]);
  layer.msg('load success, go to the gene browser and view it.')
  return;
})



window.moveCard = function(_id,arrow){
  _id = parseInt(_id);
  if(arrow === 'up'){
    let tmp = infos[_id - 1];
    infos[_id - 1] = infos[_id];
    infos[_id] = tmp;
  }else{
    let tmp = infos[_id + 1];
    infos[_id + 1] = infos[_id];
    infos[_id] = tmp;
  }
  initPageInfo();
}

window.goNCBI = function(id){
  window.open(`https://www.ncbi.nlm.nih.gov/gene/?term=${id}`);
}

window.goBrowser = function(locus){
  
  let [chr, s, e] = parseLocus(locus);
  let gap = e - s;
  s -= parseInt(gene_locus_range / 4); // 浏览器的位置
  e += parseInt(gene_locus_range * 0.75 - gap);
  let cor = chr + ':' + Number(s).toLocaleString() + '-' + Number(e).toLocaleString()
  let b  = live_hic_browser.values().next().value;
  parent.browser_goto_locus(cor, b);
  layer.msg(`The HiC Browser has been located to ${locus}, you can minimize this page and view it.`)
}

//根据chr和端点返回基因
window.getGene = function(that, chr, s, e){
  $(that).toggleClass('detail');
  let _html;
  let next = $(that).next();
  //关闭
  if(next.hasClass('detail')){
    next.removeClass('detail');
    return;
  } 
  next.addClass('detail')
  if(next.children().length > 0) return;
  else{
    let r = searchGene(chr, s, e);
    if(r === undefined){
      _html = `
        <div class="nogene">
          Please load ref Gene First
        </div>
      `;
    }
    else _html = generateGene(r);
    next.append(_html);
    return
  }
}

/**
o {
  chr1 x1 y2 chr2 x2 y2
  s:368 
  e:388
}
 */
function searchAnotherSample(chr, s, e, track, idx){
  let feature = getFeature(idx, track);
  let v = getValue(feature, chr);
  if(v === undefined) return undefined;
  for(let o of v){
    if(o.x1 > e) break;
    // 有交集
    if(s <= o.y2 && e >= o.x1){
      return o;
    }
    else continue;
  }
  return undefined;
}

window.drawCanvas_helper = function(locus){
    let b  = live_hic_browser.values().next().value;
    parent.drawCanvas1(locus,[`compare with ${locus}`], b);
    layer.msg(`The HiC Browser has been located to ${locus}, you can minimize this page and view it.`)

}

window.getGeneAndChange = function(that, chr, s, e, track){
  $(that).toggleClass('detail');
  let _html = "";
  let next = $(that).next();
  //关闭
  if(next.hasClass('detail')){
    next.removeClass('detail');
    return;
  } 
  next.addClass('detail')
  if(next.children().length > 0) return;
  else{
    let t = searchAnotherSample(chr, s, e, track, 1);
    let r = searchGene(chr, s, e);
    if(!t){
      _html = `
      <div class="nocontrast info">
        Unique TAD. <span onclick="drawCanvas_helper('${chr}:${s}-${e}')" style="cursor:pointer"><u>view in hic browser</u></span>
      </div>
      `
    }else{
      let color = ((t.x1 === s && t.y2 === e) ? 'success':'warning');
      _html = `
      <div class="contrast ${color}" onclick="drawCanvas_helper('${t.chr1}:${t.x1}-${t.y2}')">
        <span>${t.chr1}</span>
        <span>${t.x1}</span>
        <span>${t.x2}</span>
        <span>${t.chr2}</span>
        <span>${t.y1}</span>
        <span>${t.y2}</span>
      </div>
      `
    }
    _html += generateGene(r);
    next.append(_html);
    return
  }
}