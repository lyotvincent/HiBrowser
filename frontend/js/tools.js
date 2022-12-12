import hic from "./juicebox.esm.js";
import {AlertSingleton} from './igv-widgets.js'
import {live_browser,live_igv_browser, swap, formatLocus,
   parseLocus,min_chromosome,inter_locus_range,
   intra_locus_range,gene_locus_range,generate_locus, 
   get_hic_species,ShowBodyCover,svg_icons , generate_a_locus,
   getQueryVariable
  } from "./global.js"


function get_selected_id(){
  return hic.getCurrentBrowser().id;
}

function get_canvas_size(){
  let _id = get_selected_id();
  let w = $(`#${_id}-viewport`).width();
  let h = $(`#${_id}-viewport`).height();
  return [w, h];
}


/*===============================guide=============================================*/
function showCrosshairs(e){
  let x = e.clientX, y = e.clientY;
  let point_off = 7;
  let hic_root = $('.hic-root');
  let b_w = $(hic_root[1]).offset().left  - $(hic_root[0]).offset().left
  document.getElementById('cursor-guide-x').style.top = y - point_off + 'px';
  document.getElementById('cursor-guide-y').style.left = x - point_off + 'px';
  document.getElementById('cursor-guide-y1').style.left = x - point_off + b_w + 'px';
  document.getElementById('cursor-guide-y2').style.left = x - point_off - b_w + 'px';
}

$('#cursor-guide').on('click',async function(e){
  if($(this).hasClass('active')){
    $(this).removeClass('active')
    $('#cursor-guide-x').remove();
    $('#cursor-guide-y').remove();
    $('#cursor-guide-y1').remove();
    $('#cursor-guide-y2').remove();
    document.removeEventListener('mousemove',showCrosshairs)

  }else{
    $(this).addClass('active');
      let ox = document.createElement('div');
      ox.className = "hic-cursor-x";
      ox.id = "cursor-guide-x";
      document.getElementById('app-container').appendChild(ox);
      let oy = document.createElement('div');
      let oy1 = document.createElement('div');
      let oy2 = document.createElement('div');
      oy.className = "hic-cursor-y";
      oy1.className = "hic-cursor-y";
      oy2.className = "hic-cursor-y";
      oy.id = "cursor-guide-y";
      oy1.id = "cursor-guide-y1";
      oy2.id = "cursor-guide-y2";
      document.getElementById('app-container').appendChild(oy);
      document.getElementById('app-container').appendChild(oy1);
      document.getElementById('app-container').appendChild(oy2);
      document.addEventListener('mousemove',showCrosshairs)
  }
})


/*===============================search=============================================*/
// a =[locus1,locus2], name = [name1,name2]
window.drawCanvas = function(a, name, b){
  if(!b || b === undefined){
    b = hic.getCurrentBrowser();
  }
  if (a.length === 1){
    let [chr, s, e] = parseLocus(a[0]); // 基因的位置
    let data = chr + '\t' + s + '\t' + e + '\t' + chr + '\t' + s + '\t' + e + '\t69,132,1' ;
    let gap = e - s;
    s -= parseInt(gene_locus_range / 4); // 浏览器的位置
    e += parseInt(gene_locus_range * 0.75 - gap);
    let cor = chr + ':' + Number(s).toLocaleString() + '-' + Number(e).toLocaleString()
    let config = {
      "name":name[0],
      "data":data,
      "autoscale": true,
      "displayMode": "COLLAPSED",
      "track_type": "fragment"
    }
    b.loadTrackDatas([config])
    browser_goto_locus(cor, b);
  }else{
    let [chrx,xs,xe] = parseLocus(a[0]);
    let [chry,ys,ye] = parseLocus(a[1]);
    let data = chrx + '\t' + xs + '\t' + xe + '\t' + chry + '\t' + ys + '\t' + ye; + '\t0,0,0'
    let xgap = xe - xs;
    let ygap = ye - ys;
    let range;
    if (chrx === chry){
      range = intra_locus_range;
    }else{
      range = inter_locus_range;
    }
    xs -= range / 4;
    xe += range * 0.75 - xgap;
    ys -= range / 4;
    ye += range * 0.75 - ygap;
    let cor = chrx + ':' + Number(xs).toLocaleString() + '-' + Number(xe).toLocaleString() + ' ' + chry + ':' + Number(ys).toLocaleString() + '-' + Number(ye).toLocaleString();
    
    let config = {
      "name":name[0] + '___' + name[1],
      "data":data,
      "autoscale": true,
      "displayMode": "COLLAPSED"
    }
    b.loadTrackDatas([config])
    browser_goto_locus(cor);
  }
  $(`body`).css('overflow','');
}

function openSearch(){
  ShowBodyCover();
  let data = [1,2,3];
  layer.open({
    type: 2,
    skin: 'search-iframe',
    title: 'Search by Locus,Gene,Disease',
    shadeClose: true,
    maxmin: true, //开启最大化最小化按钮
    area: [ window.innerWidth*0.9 + 'px',window.innerHeight*0.85 + 'px'],
    shade: [0.2, '#393D49'],
    content: 'search.html',
    end:function(){
      $(`body`).css('overflow','');
    },
    min:function(){
      $(`body`).css('overflow','');
    },
    restore: function() { //点击还原后的回调函数
      $(`body`).css('overflow','hidden');
    },
    success:function (layero,index){
      let iframeWin = window[layero.find('iframe')[0]['name']];//获取子页面的对象
      iframeWin.child(data) // 向子页面传值
    }
  });
}

$('#browser-search').on('click', async function(e){ 
  let selected_browser = hic.getCurrentBrowser();
  if (selected_browser.dataset === undefined){
    AlertSingleton.present('Load HiC map first');
    return
  }
  let genomeId = selected_browser.genome.id;
  if(get_hic_species(genomeId) !== 'human'){
    layer.msg('The query function currently only supports humans.</br>Current file does not appear to be human species', {
      time: 0 //不自动关闭
      ,btn: ['Go', 'Close'],
      btnAlign: 'c'
      ,btn1: function(index){
        layer.close(index);
        openSearch();
      }
      ,btn2:function(index){
        layer.close(index);
      }
    });
    return;
  }
  openSearch();
})


/*=============================3d model===============================================*/
function open3D(_id){
  let w = window.innerWidth;
  let name;
  if(hic.getCurrentBrowser().dataset !==  undefined){
    name = hic.getCurrentBrowser().dataset.name;
  }else{
    name = "3d model"
  }
  w = w * 0.2;
  layer.open({
    type: 2,
    skin: 'd3-iframe',
    title: name,
    id: _id,
    shadeClose: true,
    resize: false,
    zIndex:5,
    maxmin: true, //开启最大化最小化按钮
    area: [ w + 'px', w + 'px'],
    shade: 0,
    content: '3d.html'
  });
}

$(`#3Ddisplay`).on('click',function(e){
  if(hic.getCurrentBrowser().dataset === undefined){
    AlertSingleton.present('load hic map first! You can use the separate page we provide, if you only want to display 3D model.');
    return;
  }
  let _id = 'd3-iframe-' + get_selected_id();
  if(document.getElementById(_id) !== null){
    //restore;
  }else{
    open3D(_id);
  }
})

/*============================================================================*/
$(`#analyse`).on('click', e =>{
  ShowBodyCover();
  layer.open({
    type: 2,
    skin: 'ana-iframe',
    title: 'Analyse',
    shadeClose: true,
    maxmin: true, //开启最大化最小化按钮
    area: [ window.innerWidth * 0.8 + 'px',window.innerHeight * 0.9+ 'px'],
    shade: [0.2, '#393D49'],
    content: 'analyse.html',
    end: function(){
      $(`body`).css('overflow','');
    },
    min:function(){
      $(`body`).css('overflow','');
    },
    restore: function() { //点击还原后的回调函数
      $(`body`).css('overflow','hidden');
    }
  });
})

/*============================================================================*/
function get_locus(x0,y0,x1,y1,w){
  let locus = get_goto_input();
  if(x0 > x1){
    [x0,x1] = swap(x0,x1);
  }
  if(y0 > y1){
    [y0,y1] = swap(y0,y1);
  }
  locus = locus.split(' ');
  let [chrx, xs, xe] = parseLocus(locus[0])
  let pixel_size = (xe - xs) / w;
  let x = (x1 - x0) * pixel_size;
  let y = (y1 - y0) * pixel_size;
  
  x = formatLocus(x);
  y = formatLocus(y);
  
  return {x, y}
}

// pixel to locus
function calc_locus(box_start_x,box_start_y,box_end_x,box_end_y){
  let locus = get_goto_input();
  locus = locus.split(' ');
  let [chrx, current_xs, current_xe] = parseLocus(locus[0]);
  let [chry, current_ys, current_ye] = parseLocus(locus[1]);
  let [w,h] = get_canvas_size();
  let pixel_size = (current_xe - current_xs) / w;
  let new_xs = parseInt(current_xs + pixel_size * box_start_x);
  let new_xe = parseInt(current_xs + pixel_size * box_end_x);
  let new_ys = parseInt(current_ys + pixel_size * box_start_y);
  let new_ye = parseInt(current_ys + pixel_size * box_end_y);
  return [chrx, new_xs, new_xe, chry, new_ys, new_ye]

}

// right menu
window.cal = function(box_start_x,box_start_y,box_end_x,box_end_y){
  let [chrx, new_xs, new_xe, chry, new_ys, new_ye] = calc_locus(box_start_x,box_start_y,box_end_x,box_end_y);
  let cor;
  if(hic.getCurrentBrowser().isDiag){
     cor = generate_locus(chrx, new_ys, new_ye, chry, new_ys, new_ye)
  }else{
     cor = generate_locus(chrx, new_xs, new_xe, chry, new_ys, new_ye)
  }
  navigator.clipboard.writeText(cor); 
  layer.msg(cor + ('(The clipboard has been written!)'));
  return
}

window.esc = function(){
  let selected_browser_id = get_selected_id();
  $('#canvas_right_menu').remove();
  let canvas = $(`#glass_canvas_${selected_browser_id} >canvas`)
  canvas.get(0).height = canvas.get(0).height;
}

window.goto = function(box_start_x,box_start_y,box_end_x,box_end_y){
  let [chrx, new_xs, new_xe, chry, new_ys, new_ye] = calc_locus(box_start_x,box_start_y,box_end_x,box_end_y)
  if (new_xe - new_xs <= min_chromosome || new_ye - new_ys <= min_chromosome){
    layer.msg('You cannot view smaller arease because of the resolution of your HiC file');
    return
  }
  let scales = Math.max(new_xe - new_xs, new_ye - new_ys);
  let new_locus = generate_locus(chrx, new_xs, new_xs + scales, chry, new_ys, new_ys + scales);
  browser_goto_locus(new_locus);
  esc();
  return

}

window.highlight = function(){
  $('#canvas_right_menu').remove();
}

window.display3d = function(box_start_x,box_start_y,box_end_x,box_end_y){
  if(hic.getCurrentBrowser().isDiag){
    box_start_x = box_start_y;
    box_end_x = box_end_y;
  }
  let [chrx, new_xs, new_xe, chry, new_ys, new_ye] = calc_locus(box_start_x,box_start_y,box_end_x,box_end_y);
  let x = generate_a_locus(chrx, new_xs, new_xe);
  let y = generate_a_locus( chry, new_ys, new_ye);
  call3d(get_selected_id(), x,y,false,false);
  esc();
  return
}

function generate_canvas_right_menu(ofx,ofy,box_start_x,box_start_y,box_end_x,box_end_y){
  let _html = $(`
    <ul class="canvas_right_menu" id="canvas_right_menu">
      <li onclick="cal(${box_start_x},${box_start_y},${box_end_x},${box_end_y})">Get Coordinate</li>
      <li onclick="goto(${box_start_x},${box_start_y},${box_end_x},${box_end_y})">Goto selected Aera</li>
      <li onclick="display3d(${box_start_x},${box_start_y},${box_end_x},${box_end_y})">Display in 3D model</li>
      <li onclick="highlight()">Highlight</li>
      <li onclick="esc()">Cancel</li>
    </ul>
  `)
  $('body').append(_html);
  $(_html).css('display','block');
  $(_html).css('left',ofx + box_end_x + 'px');
  if(hic.getCurrentBrowser().isDiag){
    $(_html).css('top', box_end_y +  'px');
  }else{
    $(_html).css('top', ofy + box_end_y +  'px');
  }
  
}

function createROI(){
  let selected_browser_id = get_selected_id();
  let b = hic.getCurrentBrowser();
  let selected_div = $(`#${selected_browser_id}-viewport`);
  let w = selected_div.width();
  let h = selected_div.height();
  let offx = selected_div.offset().left;
  let offy = selected_div.offset().top;
  let div = $(`<div style="position: absolute; left:39px;height:${h}px;width:${w}px" id="glass_canvas_${selected_browser_id}"></div>`);
  let canvas = $(`<canvas width="${w}" height="${h}" style="background: rgba(255, 255, 155, 0);z-index=1;cursor:cell">`);
  div.append(canvas);
  selected_div.after(div);
  // 创建完glass canvas后，要旋转
  if(b.isDiag === true){
    showGlassDiag();
  }


  let [origin_x, origin_y] = [0, 0];
  let [box_start_x, box_start_y] = [0, 0];
  let [box_end_x, box_end_y] = [0, 0];
  let ctx = canvas.get(0).getContext('2d');
  canvas.on('mousedown', (e) => {
    $('#canvas_right_menu').remove();
    box_start_x = e.offsetX;
    box_start_y = e.offsetY;
    if (0 === e.button){
      document.onmousemove=function(e){
        box_end_x = e.offsetX;
        box_end_y = e.offsetY;
        if (box_end_x <= origin_x) {
            box_end_x = origin_x
        }
        if (box_end_x >= w) {
            box_end_x = w;
        }
        if (box_end_y <= origin_y) {
            box_end_y = origin_y
        }
        if (box_end_y >= h) {
            box_end_y = h;
        }
       
        canvas.get(0).height = canvas.get(0).height;
        
        ctx.font = '20px Arial';
        
        let {x,y} = get_locus(box_start_x,box_start_y,box_end_x,box_end_y,w);
        if(b.isDiag){
          if(box_end_y = box_end_x){
            box_end_y = box_end_x;
          }
          ctx.fillStyle = `#404d5833`;
          ctx.fillRect(box_start_y, box_start_y, box_end_y - box_start_y, box_end_y - box_start_y);
        }
        else{
        // -10 是字体大小 -80 是字体个数长度
          ctx.fillText(x + ', ' + y, box_start_x + (box_end_x - box_start_x) / 2 - 80, box_start_y + ( box_end_y - box_start_y) / 2 + 10);
          ctx.fillStyle = `#404d5833`;
          ctx.fillRect(box_start_x, box_start_y, box_end_x-box_start_x, box_end_y-box_start_y);
        }
        return false;
      };
      // 松开鼠标
      document.onmouseup=function(e){
        box_end_x = e.offsetX;
        box_end_y = e.offsetY;
        if (box_end_x <= origin_x) {
            box_end_x = origin_x
        }
        if (box_end_x >= w) {
            box_end_x = w;
        }
        if (box_end_y <= origin_y) {
            box_end_y = origin_y
        }
        if (box_end_y >= h) {
            box_end_y = h;
        }
        
        if (box_start_x == box_end_x || box_start_y == box_end_y) {
          canvas.get(0).height = canvas.get(0).height;
          document.onmousemove=null;
          document.onmouseup=null;
          //阻止默认事件
          return false;
        }


        canvas.get(0).height = canvas.get(0).height;
        ctx.font = '20px Arial';
        let {x,y} = get_locus(box_start_x,box_start_y,box_end_x,box_end_y,w);
        // -10 是字体大小
        // -60 是字体个数长度
        if(b.isDiag){
          if(box_end_y = box_end_x){
            box_end_y = box_end_x;
          }
          ctx.fillStyle = `#404d5833`;
          ctx.fillRect(box_start_y, box_start_y, box_end_y - box_start_y, box_end_y - box_start_y);
        }
        else{
          ctx.fillText(x + ', ' + y, box_start_x + (box_end_x - box_start_x) / 2 - 80, box_start_y + ( box_end_y - box_start_y) / 2 + 10);
          ctx.fillStyle = `#404d5833`;
          ctx.fillRect(box_start_x, box_start_y, box_end_x-box_start_x, box_end_y-box_start_y);
        }
        generate_canvas_right_menu(offx,offy,box_start_x,box_start_y,box_end_x,box_end_y);
        e.preventDefault();
        document.onmousemove=null;
        document.onmouseup=null;
        //阻止默认事件
        return false;
    }
    }
  })

}

$('#ROI').on('click', function(e){
  let selected_browser = hic.getCurrentBrowser();
  let selected_browser_id = selected_browser.id;
  if (selected_browser.dataset === undefined){
    AlertSingleton.present('Load HiC map first');
    return
  }
  if(selected_browser.state.chr1 === 0){
    AlertSingleton.present('select chromosome first');
    return
  }
  if($(this).hasClass('active')){
    $(this).removeClass('active');
    $(`#glass_canvas_${selected_browser_id}`).remove();
    $(`#canvas_right_menu`).remove();
    return;
  }
  $(this).addClass('active');
  createROI();
})

/*============================================================================*/
$('#browser-zoom-in').on('click',async function(e){
  let selected_browser_id = get_selected_id();
  let cur_locus = get_goto_input();
  if (cur_locus === ""){
    if (live_igv_browser.has(selected_browser_id)){
      live_igv_browser.get(selected_browser_id).zoomIn();
      return;
    }
    return;
  }
  if(cur_locus === 'All'){
    browser_goto_locus('1');
  }else{
    let xy = cur_locus.split(' ');
    let [chrx, xs, xe] = parseLocus(xy[0]);
    let [chry, ys, ye] = parseLocus(xy[1]);
    let xns = xs + parseInt((xe - xs) / 4);
    let xne = xe - parseInt((xe - xs) / 4);
    let yns = ys + parseInt((ye - ys) / 4);
    let yne = ye - parseInt((ye - ys) / 4);
    let new_loc = generate_locus(chrx,xns,xne,chry, yns, yne);
    browser_goto_locus(new_loc);
  }
})

/*============================================================================*/
$('#browser-zoom-out').on('click',async function(e){
  let selected_browser_id = get_selected_id();
  let cur_locus = get_goto_input();
  if (cur_locus === 'All') return;
  if (cur_locus === ''){
    if (live_igv_browser.has(selected_browser_id)){
      live_igv_browser.get(selected_browser_id).zoomOut();
      return;
    }
    return;
  }
  let xy = cur_locus.split(' ');
  let [chrx, xs, xe] = parseLocus(xy[0]);
  let [chry, ys, ye] = parseLocus(xy[1]);
  let xns = xs - parseInt((xe - xs) / 2);
  if (xns < 1) xns = 1;
  let xne = xe + parseInt((xe - xs) / 2);
  let yns = ys - parseInt((ye - ys) / 2);
  if (yns < 1) yns = 1;
  let yne = ye + parseInt((ye - ys) / 2);
  let new_loc = generate_locus(chrx,xns,xne,chry, yns, yne);
  browser_goto_locus(new_loc);
})

/*============================================================================*/
function showDiag(browser){
  // 修改状态
  browser.isDiag = true;
  let _id = browser.id;

  // 旋转iewport
  let viewport = $(`#${_id}-viewport`);
  let ow = viewport.width();
  viewport.css('transform','rotate(315deg)');
  viewport.css('clip-path','polygon(0 0, 100% 100%, 100% 0%)');
  viewport.css('background','transparent');
  viewport.css('margin-left','20px');


  //.hic-browser-div
  $('.hic-browser-div').css('padding-bottom','135px');


  // 隐藏axis
  $(`#${_id}-y-axis`).hide();
  $(`#${_id}-x-axis`).hide();

  // 缩小canvas
  let canvas = $(`#${_id}-viewport > canvas`);
  canvas.css('transform','scale(0.707)'); // 根号2 分之1

    // 将igV div往上提
  let igv_div = $(`#igv-${_id}`);
  igv_div.css('margin-top',`${-ow / 2}px`);
  igv_div.css('padding-bottom',`${-ow / 2}px`);


  //修改locus
  let locus = get_goto_input();
  locus = locus.split(' ');
  locus = locus[0] + ' ' + locus[0];
  browser_goto_locus(locus);
}

function hideDiag(browser){
// 修改状态
  browser.isDiag = false;
  let _id = browser.id;

  // 旋转iewport
  let viewport = $(`#${_id}-viewport`);
  let ow = viewport.width();
  viewport.css('transform','');
  viewport.css('clip-path','');
  viewport.css('background','');
  viewport.css('margin-left','');


  //.hic-browser-div
  $('.hic-browser-div').css('padding-bottom','');

  $(`#${_id}-y-axis`).show();
  $(`#${_id}-x-axis`).show();

  let canvas = $(`#${_id}-viewport > canvas`);
  canvas.css('transform',''); 

  let igv_div = $(`#igv-${_id}`);
  igv_div.css('margin-top',`15px`);
  igv_div.css('padding-bottom',``);
}

function showGlassDiag(){
  let _id = get_selected_id();
  // 旋转iewport
  let glass_div = $(`#glass_canvas_${_id}`);
  glass_div.css('transform','rotate(315deg)');
  glass_div.css('clip-path','polygon(0 0, 100% 100%, 100% 0%)');
  glass_div.css('background','transparent');
  glass_div.css('margin-left','5px');
  // 缩小canvas
  let canvas = $(`#glass_canvas_${_id} > canvas`);
  canvas.css('transform','scale(0.707)'); // 根号2 分之1
}

function hideGlassDiag(){
  let _id = get_selected_id();
  // 旋转iewport
  let glass_div = $(`#glass_canvas_${_id}`);
  glass_div.css('transform','');
  glass_div.css('clip-path','');
  glass_div.css('background','');
  glass_div.css('margin-left','');
  // 缩小canvas
  let canvas = $(`#glass_canvas_${_id} > canvas`);
  canvas.css('transform',''); // 根号2 分之1
}

function browser_diag_show(browser){
  if(browser.dataset === undefined){
    AlertSingleton.present('Load HiC map first');
    return;
  }
  let locus = get_goto_input();
  let _id = browser.id;
  if(locus === 'All' || locus === 'all'){
    AlertSingleton.present('select chromosome first');
    return;
  }
  showDiag(browser);
  if($(`#glass_canvas_${_id}`).length > 0){
    showGlassDiag();
  }
  $(`#browser-rotate`).addClass('active');
}

function browser_diag_hide(browser){
  hideDiag(browser);
  let _id = browser.id;
  if($(`#glass_canvas_${_id}`).length > 0){
    hideGlassDiag();
  }
  $(`#browser-rotate`).removeClass('active');
}

$(`#browser-rotate`).on('click', function(e){
  let browser = hic.getCurrentBrowser();
  if($(this).hasClass('active')){
    browser_diag_hide(browser);
  }else{
    browser_diag_show(browser);
  }
});


window.toggleColor = function(e){
  let cp = $(`.color_picks`);
  cp.toggleClass('detail');
}


let chart_colors = [
  '#456ab2','#7d936b','#a1518c','#e997bd','#2ca35e',
  '#f477d9','#6833fc','#5eca31','#ef09e7','#7d49d3',
  '#2bde03','#8cae31','#163a0b','#da9d6f','#61597e',
  '#8e0a0f','#b221d4','#254b14','#a51f25','#a3369f',
  '#e8cae8','#716598','#bdd00d','#84d3a4'
];
window.modifyChartColors = function(that){
  let val = $(that).val();
  let id = $(that).attr('id');
  id = id.split('_')[1];
  id = parseInt(id);
  chart_colors[id] = val;
}

window.toggleRestore = function(that){
  let check = $(that).attr('check');
  localStorage.setItem('Restore', (check === "0" ? "1" : "0"));
  $(that).attr('check', (check === "0" ? "1" : "0"));
  let icon = $(that).children()[1];
  $(icon).children().remove();
  if(check === "1"){
    $(icon).append(svg_icons.uncheck);
  }else{
    $(icon).append(svg_icons.check);
    layer.msg('You have enabled the restore function, <br> please use the widget <b>Refresh</b> instead of F5 or refresh button of your browser', {
      time: 0 //不自动关闭
      ,btn: ['get']
      ,yes: function(index){
        layer.close(index);
      }
    });
  }
}

window.toggleForce = function(that){
  let check = $(that).attr('check')
  $(that).attr('check', (check === "0" ? "1" : "0"));
  let icon = $(that).children()[1];
  $(icon).children().remove();
  if(check === "1"){
    $(icon).append(svg_icons.uncheck);
    hic.getCurrentBrowser().isForce = false;
  }else{
    $(icon).append(svg_icons.check);
    hic.getCurrentBrowser().isForce = true;
  }
}

window.getChartColors = function(){
  return chart_colors;
}



window.wait = function(seconds){
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000);
  })
}

async function restoreOneSession(sesseion, browser){
  let hic = sesseion['hic'];
  await loadHiC(hic['contact'], 'contact-map', browser);
  if(hic['control'] !== undefined) await loadHiC(hic['control'], 'control-map', browser);
  browser.parseGotoInput(hic['locus']);
  await wait(2);
  if(hic['isDiag']) browser_diag_show(browser);
  if(hic['normalization'] !== undefined) browser.setNormalization(hic['normalization']);
  await wait(1.5);
  browser.isForce =  hic['isForce'];
  if(hic['isSync']){
    $(`#sync-${browser.id}`).click();
  }
  
  let track2d = sesseion['track2d'];
  if (track2d !== undefined){
    for(let t of track2d){
      if(t.url !== undefined){
        LoadHiCTrack(t.track_type, t.url, browser)
      }else{
        browser.loadTrackDatas([t])
      }
      
    }
  }
  let ref = sesseion['ref'];
  if(ref !== undefined){
    let ext = [];
    ext.push(sesseion['fa']);
    ext.push(sesseion['fai']);
    ext.push(sesseion['cytoband']);
    ext.push(sesseion['ref']);
    await initIGV(ext);
    let track = sesseion['track'];
    if(track !== undefined){
      for(let t of track){
        if(t.url.startsWith('http')){
          LoadIGVTrack(t.track_type, t.url, t.indexURL)
        }
      }
    }
  };
  if(hic['d3'] !== undefined){
    let _id = 'd3-iframe-' + browser.id;
    open3D(_id);
    await wait(1);
    let frameId = document.getElementById(_id).getElementsByTagName("iframe")[0].id;
      $('#'+frameId)[0].contentWindow.loadD3FromUrl(hic['d3']);
  }
  return;
}

window.restoreSessions = async function(sessions){
  layer.msg("We are fetching data from the data-hub, which will depend on your network status and be expected to take 60s. Please wait patiently",{time:15000});
  let loading = layer.load(1, {
    shade: [0.5,'#fff'] 
  });
  try {
    let browsers = hic.getAllBrowsers();
    for(let i = 0; i < sessions.length; i ++){
      let session = sessions[i];
      let b;
      if(i >= browsers.length){
        b = await cloneBrowser();
        wait(1);
      }else{
        b = browsers[i];
      }
      hic.setCurrentBrowser(b);
      await restoreOneSession(session, b);
    }
  } catch (error) {
    console.log(error);
  }
  layer.close(loading);
}


window.uoloadSeesion = function(that){
  let file = ($(that).get(0).files)[0];
  if(file === undefined) return;
  const reader = new FileReader();
  reader.onload = () =>{
    let res = reader.result
    res = JSON.parse(res)
    restoreSessions(res);
  }
  reader.readAsText(file);
  $(this).val(''); // 不添加无法上传新文件
  $(this).blur();
}




/*============================================================================*/

function generate_setting_html(){
  let status = hic.getCurrentBrowser().isForce;
  let restore = localStorage.getItem('Restore');
  if(restore === undefined) restore = "0";
 
  let color_picks = `
  <div class = "color_picks">
  `;
  for(let i = 0; i < 25; i ++){
    let t = `
    <input class="color-input1" id='chart_${i}' type="color" value="${chart_colors[i]}" onchange="modifyChartColors(this)">
    `
    color_picks += t;
  }
  color_picks += `</div>`

  let _html = 
  `
  <div class="setting-container">
    <div class="session">
    <label class="button-like-file-select-1" >
      <span>upload session</span>
      <span class="icon-folder">
        ${svg_icons.upload}
      </span>
      <input type="file" accept=".json" style="display: none;" onchange="uoloadSeesion(this)">
    </label>
    <label class="button-like-file-select-1" onclick="saveSession()">
      <span>save session</span>
      <span class="icon-folder">
        ${svg_icons.download}
      </span>
    </label>
    </div>
    <div class="colorsetting">
      <label class="button-like-file-select"  onclick="toggleColor()">
        <span>color setting</span>
        <span class="icon-folder">
          ${svg_icons.color}
        </span>
      </label>
      ${color_picks}
    </div>
    <div class="checksetting">
      <label class="button-like-file-select-1" check=${restore} onclick="toggleRestore(this)">
        <span>restore refresh</span>
        <span class="icon-folder">
          ${(restore === "1" ? svg_icons.check : svg_icons.uncheck)}
        </span>
      </label>
      <label class="button-like-file-select-1" check=${(status === true ? "1" : "0")} onclick="toggleForce(this)">
        <span>force sync</span>
        <span class="icon-folder">
          ${(status === true ? svg_icons.check : svg_icons.uncheck)}
        </span>
      </label>
    </div>
  </div>
    `
  
  return _html;
}
function openSetting(){
  ShowBodyCover();
  layer.open({
    id: "iframe-setting",
    type: 1,
    title: "setting",
    skin: 'ana-iframe',
    area: ['520px', '340px'], //宽高
    content: generate_setting_html(),
    end: function(){
      $(`body`).css('overflow','');
    },
  });
}
$('#setting').on('click', () =>{
  console.log(live_browser);
  console.log(live_igv_browser);
  openSetting();
})


/*============================================================================*/
$('#back-to-top').click( e=> {
  $('html, body').animate({
      scrollTop: 0
  }, 500);
});

$(`#browser-refresh`).click(() => {
  let restore = localStorage.getItem('Restore');
  let example_id = getQueryVariable('example');
  if(example_id===undefined && restore == 1){
    let session = createSession();
    localStorage.setItem('session', JSON.stringify(session));
  }
  location.reload();
})