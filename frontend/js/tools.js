import hic from "./browser/juicebox.esm.js";
import {AlertSingleton} from './browser/igv-widgets.js'
import {live_browser,live_igv_browser,
   parseLocus,inter_locus_range,
   intra_locus_range,gene_locus_range, 
   get_hic_species,ShowBodyCover,svg_icons ,
   getQueryVariable
  } from "./global.js"


function get_selected_id(){
  return hic.getCurrentBrowser().id;
}

/*===============================guide=============================================*/
function showCrosshairs(e){
  let x = e.clientX, y = e.clientY;
  let point_off = 0;
  let hic_root = $('.hic-root');
  let b_w = $(hic_root[1]).offset().left  - $(hic_root[0]).offset().left

  let scrollerHeight = $(document).scrollTop();
  // console.log(scrollerHeight);
  document.getElementById('cursor-guide-x').style.top = y - point_off + scrollerHeight+ 'px';
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
function go_and_draw_1(locus,name, b){
  // console.log(name);
  let [chr, s, e] = parseLocus(locus); // 基因的位置
  let _id = b.id;
  if(live_igv_browser.has(_id)){
    let igv_b = live_igv_browser.get(_id);
    // if(chr.startsWith())
    let features = [
      {
        chr: chr,
        start: s - 5000,
        end: e + 5000,
        name: `${chr}:${s}-${e}`
      }
    ]
    igv_b.loadROI([
      {
          name: `[${name}]`,
          features: features,
          indexed: false,
          color: "rgba(184, 166, 255, 0.44)",
          // isUserDefined:true,
      }]
    );
    browser_goto_locus(`${chr}:${s}-${e}`, b);
    return;
  }
  let data = chr + '\t' + (s - 5000) + '\t' + (e + 5000) + '\t' + chr + '\t' + (s - 5000) + '\t' + (e + 5000) + '\t69,132,1' ;
  let gap = e - s;
  s -= parseInt(gene_locus_range / 4); // 浏览器的位置
  e += parseInt(gene_locus_range * 0.75 - gap);
  let cor = chr + ':' + Number(s).toLocaleString() + '-' + Number(e).toLocaleString()
  let config = {
    "name":`[${name}] ${chr}:${s}-${e}`,
    "data":data,
    "autoscale": true,
    "displayMode": "COLLAPSED",
    "track_type": "fragment"
  }
  b.loadTrackDatas([config])
  browser_goto_locus(cor, b);
}

function go_and_draw_2(locus1, locus2, b){
  let [chrx,xs,xe] = parseLocus(locus1);
  let [chry,ys,ye] = parseLocus(locus2);
  let left = Math.min(xs, ys);
  let right = Math.max(xe, ye);
  let data;
  let xgap = xe - xs;
  let ygap = ye - ys;
  let range;
  if (chrx === chry){
    range = intra_locus_range;
    data = chrx + '\t' + (left - 5000) + '\t' + (right + 5000) + '\t' + chry + '\t' + (left  - 5000) + '\t' + (right + 5000); + '\t0,0,0'
  }else{
    range = inter_locus_range;
    data = chrx + '\t' + (xs - 5000) + '\t' + (xe + 5000) + '\t' + chry + '\t' + (ys  - 5000) + '\t' + (ye + 5000); + '\t0,0,0'
  }
  xs -= range / 4;
  xe += range * 0.75 - xgap;
  ys -= range / 4;
  ye += range * 0.75 - ygap;
  let cor = chrx + ':' + Number(xs).toLocaleString() + '-' + Number(xe).toLocaleString() + ' ' + chry + ':' + Number(ys).toLocaleString() + '-' + Number(ye).toLocaleString();
  console.log(data);
  let config = {
    "name": 'Arcs',
    "data":data,
    "autoscale": true,
    "displayMode": "COLLAPSED",
    'track_type':'fragment'
  }
  b.loadTrackDatas([config])
  browser_goto_locus(cor);
}

window.drawCanvas1 = function(a, name, b){
  $(`body`).css('overflow','');
  if(!b || b === undefined){
    b = hic.getCurrentBrowser();
  }
  go_and_draw_1(a[0],name[0], b);
}

window.drawCanvas2 = function(a, name, b){
  $(`body`).css('overflow','');
  if(!b || b === undefined){
    b = hic.getCurrentBrowser();
  }
  let [chrx,xs,xe] = parseLocus(a[0]);
  let [chry,ys,ye] = parseLocus(a[1]);
  let _id = b.id;
  if(live_igv_browser.has(_id) && chrx == chry){
    let _igv_b = live_igv_browser.get(_id)
    createBedpe(a, name, _igv_b);
  }else{
    go_and_draw_2(a[0], a[1], b);
  }
}


window.drawCanvas3 = function(a, name, b){
  $(`body`).css('overflow','');
  if (a.length == 1) {
    drawCanvas1(a[0], name[0], b);
    return;
  }
  else if (a.length == 2){
    drawCanvas2(a, name.slice(0, 2), b);
  } 
  else{
    if(!b || b === undefined){
      b = hic.getCurrentBrowser();
    }
    let _id = b.id;
    if(live_igv_browser.has(_id)){
      let _igv_b = live_igv_browser.get(_id)
      createBedpe(a, name, _igv_b);
    }else{
      drawCanvas1(a[0], name, b);
    }
  }
}


window.RemoveBodyOverflow = function(){
  $(`body`).css('overflow','');
}

// a =[locus1,locus2], name = [name1,name2]
window.drawCanvas = function(a, name, b){
  alert('Something goes wrong!')
  $(`body`).css('overflow','');
}

async function createBedpe(a, name, b){
  let s = 'chr1\tx1\tx2\tchr2\t\y1\ty2\tcREs\n';
  let [base_chr, base_s, base_e] = parseLocus(a[0]);
  for(let i = 1;i < a.length; i ++){
    let [ano_chr, ano_s, ano_e] = parseLocus(a[i]);
    s += base_chr + '\t' + base_s + '\t' + (base_s + 1000) + '\t' + ano_chr + '\t' + ano_s  + '\t' + (ano_s + 1000) + '\t' + name[i] +'\n';
  }
  let blob = new Blob([s]);
  let url = window.URL.createObjectURL(blob);
  console.log(url);
  let config = {
    "track_type": "one_to_all_interact",
    "type": "interact",
    "url":url,
    "name":"all_interact",
    "arcOrientation":false,
    "height":100,
    "color":"rgb(255,44,28)",
    "format":"bedpe"
  }
  // b = live_igv_browser.values().next().value;
  // console.log(b)
  b.removeTrackByName('all_interact');
  b.loadTrackList([config]);
  browser_goto_locus(a[0]);
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
  if(hic['isDiag']) $(`#display-mode-${browser.id}`).click();
  if(hic['normalization'] !== undefined) browser.setNormalization(hic['normalization']);
  await wait(1.5);
  browser.isForce =  hic['isForce'];
  if(hic['isSync']) $(`#sync_browser_${browser.id}`).click();
  
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

$(`#delete_igv`).click(() => {
  let _id = get_selected_id();
  if(live_igv_browser.has(_id)){
    let b = live_igv_browser.get(_id);
    b.clearROIs();
  }
})