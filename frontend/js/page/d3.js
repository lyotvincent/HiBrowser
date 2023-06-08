import * as THREE from '../three/three.module.js';
import {OrbitControls} from '../three/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from '../three/CSS2DRenderer.js';
import { parseLocus, getNameAndExt } from '../global.js';


// ===============================全局变量===============================
let g_chr = []; // 记录所有的染色体
let g_bin; 
let g_mesh = new Map(); // chr:mesh
let g_genome;
let g_cor = new Map(); // chr:[] 每个染色体的Vector变量数组
let g_hl_chr;
let d3_file_url = undefined;

let color_fade = 0xefefef;
let color_hl = 0xFF6161;
let color_hl2 = 0x00FFCC;

function clearSession(){
  g_chr = [];
  g_bin = null;
  g_mesh = new Map(); // chr:mesh
  g_genome = null;
  g_cor = new Map();
  d3_file_url = undefined;
}


function getChr(x){
  if(x === 23){
    return 'chrX';
  }
  if (x === 24){
    return 'chrY';
  }
  if(x === 25){
    return 'chrMT';
  }
  return 'chr' + x;
}



// ===============================canvas 变量===============================
let container = document.getElementById('canvas-container');
let width = container.clientWidth;
let height = container.clientHeight;
let scene = new THREE.Scene();
let axes = new THREE.AxesHelper(15);
scene.add(axes);
let camera, renderer, labelRenderer, controls;
// ===============================canvas start===============================


function createCamera(scene){
  let k = width / height; 
  let s = 0.7; // 空间放缩，值越大 看到的范围越大
  let camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);
  camera.position.set(200, 300, 200);
  camera.lookAt(scene.position);
  return camera;
}
camera = createCamera(scene);


renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
renderer.setClearColor(0xffffff); 
container.appendChild(renderer.domElement);

labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(width,height);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
container.appendChild(labelRenderer.domElement);
controls = new OrbitControls(camera,labelRenderer.domElement);
controls.addEventListener('change', render);


function render() {
  renderer.render(scene,camera);
  labelRenderer.render(scene, camera);
}
render();
// ===============================canvas end===============================




// ===============================处理文件===============================
const splitLines = function (string) {
  return string.split(/\n|\r\n|\r/g);
};


// ===============================在canvas上画一条染色体===============================
/**
 * 
 * @param {*} v : array，Vector3
 * @param {*} c : color
 * @param {*} w : linewidth
 * @param {*} chr: line name 
 */
function cline(v,c,w,chr,showlabel){
  let geometry = new THREE.BufferGeometry()
  let curve = new THREE.CatmullRomCurve3(v);
  let points
  try {
    points = curve.getPoints(v.length - 2); // 这里不能是0，原因未知！
  } catch (error) {
    return;
  }
  if(points === undefined) return;
  geometry.setFromPoints(points);
  let material = new THREE.LineBasicMaterial({
    color: c,
    linewidth:w,
  });
  let line = new THREE.Line(geometry, material);

  if(showlabel){
    let labelDiv = document.createElement('div');
    labelDiv.className = 'label';
    labelDiv.textContent = chr;
    labelDiv.style.marginTop = '-1em';
    labelDiv.style.fontSize = '15px';
    labelDiv.style.height = '15px';
    labelDiv.style.width = '50px'
    let label = new CSS2DObject(labelDiv);
    label.name = chr + '-label';
    label.position.copy(curve.getPoint(parseInt(v.length/2)));
    line.add(label);
  }
  g_mesh.set(chr,line); // 全局字典保存 每条染色体的线 
  scene.add(line);
  render();
}


// ==============================生成下拉菜单===============================
function generate_menu(){
  let _html;
  for (let ch of g_chr){
    _html += `<option value="${ch}">${ch}</option>`
  }

  $(`#chrom-1`).children().remove();
  $(`#chrom-1`).append(_html);
  $(`#chrom-2`).children().remove();
  $(`#chrom-2`).append(_html);
};

/**
 * 
 * @param {*} v1 : 参考基因
 * @param {*} v2 : 分辨率 
 * @param {*} v3 : 当前染色体
 * @param {*} v4 : 高亮区域
 */
function generate_info(v1,v2,v3,v4){
  $('#g_id').text(v1);
  $('#bin_size').text(v2);
  $('#cur_chr').text(v3);
  $('#hl').text(v4);

}

// 颜色数组，24条染色体颜色，其中第一个为灰色默认为fade颜色，最后一个为蓝色，默认为选中的颜色
let colors = [
  0xebe7e8,
  0xFF0000,0xFF66FF,0x660099,0x0033FF,0xFFFFCC,0x3A849E,
  0xCC6600,0x66CCCC,0x33CC33,0x660066,0xFFCCFF,0x4996D1,
  0x33CC33,0x9999FF,0xCC33FF,0x99FFFF,0x9966FF,0xECC44C,
  0x33FF33,0x3366CC,0xFF3300,0xFF0000,0x00FFCC,0xAF9C32,
  0x1b82ef
]

function getNormDivid(divid){
  if(divid < 1){
    divid = 1;
  }else if(divid > 1 && divid < 100){
    divid = 10;
  }else if(divid > 100 && divid < 5000){
    divid = 1000;
  }else{
    divid = 10000;
  }
  return divid;
}

// ==============================处理文件===============================
// 分析数组,上传时，已经清除了canvas，并且clear session了！
function deal(res){
  let color;
  const lines = splitLines(res);
  let vertices = [];
  let idx = 0;
  let chr;

  //分析header
  if(! lines[0].startsWith('TITLE')){
    layer.msg('file verfication fails: at line 0');
    return;
  }

  if(! lines[1].startsWith('GENOME')){
    layer.msg('file verfication fails:at line 1');
    return;
  }

  g_genome = lines[1].split('\t')[1];

  if(! lines[2].startsWith('BINSIZE')){
    layer.msg('file verfication fails: at line 2');
    return;
  }
  g_bin = lines[2].split('\t')[1];

  let offset = 0;

  let divid = lines[4].split('\t');
  divid = Math.abs(Number(divid));
  divid = getNormDivid(divid);
  

  //分析每条染色体
  for (let line of lines) {
    if(line.startsWith('CHR')){
      offset = 0;
      idx += 1;
      color = colors[idx];
      if(idx > 1){
        cline(vertices,color,5,chr,true);
        g_cor.set(chr,vertices);
        vertices = []
        color = colors[idx];
        g_chr.push(chr);
      }
      chr = line.split('\t')[1];
      continue;
    }
    line = line.split(',');
    if(line.length === 4){
      if(Number(line[0]) !== offset){
        layer.msg(`file verfication fails: at ${chr} line ${offset}`);
        return;
      }
      offset +=  1;
      // 出现未知的点，将其设置为上一个点的坐标
      if(line[1] === 'nan' || line[2] === 'nan' || line[3] === 'nan'){
        let last_idx = vertices.length - 1;
        let last = vertices[last_idx];
        vertices.push(last);
      }
      else{
        vertices.push(new THREE.Vector3(Number(line[1]) / divid,Number(line[2]) / divid,Number(line[3]) / divid));
      }
    }
  }


  if(vertices.length !== 0){
    cline(vertices,color,5,chr,true);
    g_chr.push(chr);
    g_cor.set(chr,vertices);
  }
  generate_menu();
  generate_info(g_genome,g_bin,"all","all");
}



// ===============================setting button===============================
$('#setting-bar').on('click',function(){
  if($(this).hasClass('active')){
      $(this).removeClass('active');
      $('#setting-menu').css('right','-100%');
  }else{
    $(this).addClass('active');
    $('#setting-menu').css('right','0');
  }
})


// ===============================clear canvas===============================
function dellabel(k){
  let label = scene.getObjectByName(k + '-label');
  if(label) label.parent.remove(label);
}
function clearCanvas(){
  g_mesh.forEach(function(v,k){
    dellabel(k);
    v.geometry.dispose();
    v.material.dispose();
    scene.remove(v);
  })
  render();
  clearSession();
  generate_info('no data load','no data load','no data load','no data load');

};

function delete_line(k){
  let v = g_mesh.get(k);
  if(v === undefined) return;
  v.geometry.dispose();
  v.material.dispose();
  g_mesh.delete(k);
  scene.remove(v);
  render();
}

// ===============================upload=========================================
$('#upload-3d').on('change',function(){
  clearCanvas();
  // 每次上传时，都应该清除canvas
  let file = ($(this).get(0).files)[0];
  let size = file.size;
  if(size > 1e7){
    layer.msg('file is too large, please confirm it');
    return;
  }
  let res;
  document.querySelector('#str-url').setAttribute("placeholder",file.name);
  const reader = new FileReader();
  reader.onload = () =>{
    res = reader.result
    deal(res);
  }
  reader.readAsText(file);
  $(this).val(''); // 不添加无法上传新文件
  $(this).blur();
})


window.loadD3FromUrl = async function(val){
  d3_file_url = val;
  let loading = layer.load(1, {
    shade: [0.5,'#fff'] 
  });
  $.get(val, function(res){
    deal(res);
    layer.close(loading);
  });
}

function on_open_page(){
    let val = "https://hic-1256812583.cos.ap-beijing.myqcloud.com/k562_1.nucle3d"
    let [name, ext] = getNameAndExt(val);
    loadD3FromUrl(val);
    $(`#str-url`).val("")
    $(`#str-url`).attr('placeholder', name);
    $(`#str-url`).blur();
}
on_open_page();

$(`#str-url`).keypress(function(e){
  if(e.which === 13){
    let val = $(this).val();
    let [name, ext] = getNameAndExt(val);
    loadD3FromUrl(val);
    $(this).val("")
    $(this).attr('placeholder', name);
    $(this).blur();
  }
})

// ===============================背景颜色========================================
$("#bg-input").bind('input propertychange change',function(){
  let a = $(this).val()
  renderer.setClearColor(a);
  render();
})


// ===============================染色体颜色=========================================
$('#chrom-color-input').bind('input propertychange change',function(){
  let chr = $(`#chrom-1`).val();
  let c = $(this).val();
  let mesh = g_mesh.get(chr);
  mesh.visible = true;
  mesh.children[0].visible = true;
  mesh.material.color.set(c);
  render();
});


// ===============================染色体宽度=========================================
$('#chrom-width-input').bind('input propertychange change',function(){
  let chr = $(`#chrom-2`).val();
  let c = $(this).val();
  let mesh = g_mesh.get(chr);
  mesh.visible = true;
  mesh.children[0].visible = true;
  mesh.material.linewidth = c;
  render();
});


// ===============================全部和淡化=========================================
function showAll(){
  let idx = 1;
  g_mesh.forEach(function(v,k){
    v.visible = true;
    if(v.children.length > 0){
      v.children[0].visible = true;
    }
    
    v.material.color.set(colors[idx]);
    idx ++;
    v.material.linewidth = 3;
  })
  render();
}

function showOne(chr,c){
  let check = ($(`#hide-input`).is(':checked'));
  if(check) return;
  let mesh = g_mesh.get(chr);
  if(mesh === undefined) return;
  mesh.visible = true;
  if(mesh.children.length > 0){
    mesh.children[0].visible = true;
  }
  mesh.material.color.set(c);
  mesh.material.linewidth = 2;
  render();
}


function hideAll(type){
  if(type === 0){
    // fade
    g_mesh.forEach(function(v,k){
      if(k.startsWith('high')) return;
      v.visible = true;
      if(v.children.length>0){
        v.children[0].visible = false;
      }
      v.material.color.set(colors[0]);
      v.material.linewidth = 1;
    })
  }else{
    //hide
    g_mesh.forEach(function(v,k){
      if(k.startsWith('high')) return;
      v.visible = false;
      if(v.children.length>0){
        v.children[0].visible = false;
      }
    })
  }
  render();
}
$('#fade-input').bind('input propertychange change',function(){
  let check = ($(this).is(':checked'));
  generate_info(g_genome,g_bin,'All','All');
  if(check){
    $('#hide-input').prop('checked',false);
    hideAll(0);
  }else{
    showAll();
  }
});


// ===============================隐藏=========================================
$('#hide-input').bind('input propertychange change',function(){
  let check = ($(this).is(':checked'));
  generate_info(g_genome,g_bin,'All','All');
  if(check){
    $('#fade-input').prop('checked',false);
    hideAll(1);
  }else{
    showAll();
  }
});

// ===============================清除页面=========================================

$(`#clear-mesh`).on('click',function(){
  clearCanvas();
  $(this).blur();
})

$('#sync-input').on('click',function(){
  let check = ($(this).is(':checked'));
  if(check){
    layer.msg(
      'Synchronizing with the HiC browser will use more resources,' + 
      '<br> which may result in slower rendering if your device has limit performance.' + 
      '<br> We suggest that you can use ROI function to locate the area of Interest and its 3D model.' , 
      {
        time: 0 //不自动关闭
        ,btn: ['got it'],
        btnAlign: 'c'
        ,btn1:function(index){
          layer.close(index);
        }
    });
  }
})

// ===============================与HiC browser交互=========================================
window.goto = function(x,y,ismove = false){
  delete_line('highlight');
  delete_line('highlight2');
  let check = ($('#sync-input').is(':checked'));
  if(ismove && !check) return;
  if(typeof x === 'number'){
    showAll();
    generate_info(g_genome,g_bin,'All','All');
    return;
  }
  else{
    
    let [chrx, xs, xe] = parseLocus(x);
    let [chry, ys, ye] = parseLocus(y);
    if(chrx != chry){
      showSegment(chrx, xs, xe, color_hl, "highlight");
      showSegment(chry, ys, ye, color_hl2, "highlight2");
    }else{
      showSegment(chrx, xs, xe);
    }
    
  }
}

/**
 * 
 * @param {*} chr 染色体： chr1
 * @param {*} s 
 * @param {*} e 
 * @returns 
 */
function showSegment(chr, s, e, color = color_hl, name = "highlight"){
  if(g_bin === null){
    return;
  }
  
  if(!chr.startsWith('chr')){
    chr = 'chr' + chr;
  }
  // if(g_hl_chr === null || g_hl_chr === undefined || g_hl_chr !== chr){
  //   hideAll(1);
  // }
  // showOne(chr,color_fade);
  // g_hl_chr = chr;
 

  s = Math.floor(s/g_bin);
  e = Math.ceil(e/g_bin);
  if(e - s <= 1){
    return;
  }

  let chrom_arrs = g_cor.get(chr);
  let v = [];
  for(let i = s; i <= e; i ++){
    v.push(chrom_arrs[i]);
  }
  cline(v,color, 2, name, false);
  generate_info(g_genome,g_bin,chr,s * g_bin + '-' + e * g_bin);
}


window.get3dFile = function(){
  return d3_file_url;
}