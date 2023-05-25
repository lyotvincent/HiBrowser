import hic from "./juicebox.esm.js";
import igv from "./igv.esm.js"
import {AlertSingleton} from './igv-widgets.js'
import {live_browser,live_igv_browser, container, isFile, getNameAndExt, getQueryVariable, sample_track, sample_track_index} from "./global.js"

console.log('==========>initialize the browser viewer start');

const browser0 = await hic.init(container, {});
const browser1 = await hic.createBrowser(container, {});
const browser2 = await hic.createBrowser(container, {});

live_browser.set(browser0.id,browser0);
live_browser.set(browser1.id,browser1);
live_browser.set(browser2.id,browser2);
await browser0.reset();
console.log('==========>initialize the browser viewer end');
AlertSingleton.init(container) // 弹窗
//箭头函数没有this指针！！！
$(document).ready(function(){
  $('[data-toggle="tooltip"]').tooltip();
  let example_id = getQueryVariable('example');
  if(example_id === undefined){
    let restore = localStorage.getItem('Restore');
    if(restore == 1){
      let sesseion = localStorage.getItem('session');
      if(sesseion !== undefined && sesseion !== null && sesseion !== 'undefined'){
        restoreSessions(sesseion);
      } 
    }
  }

  let track_type = document.querySelector('.track-type');
    track_type.onclick = function(){
      track_type.classList.toggle('open');
    }
    
    let opt_div = $('#track-option >div');
    $.each(opt_div,function(){
      $(this).on('click',function(){
        let text = $(this).text();
        let type = $(this).attr('value');
        $('#track-select-input').attr('placeholder',text);
        $('#track-select-input').attr("track",type);
        if(sample_track.has(type)){
          console.log(sample_track.get(type))
          $('#track-url').val(sample_track.get(type));
        }else{
          $('#track-url').val("");
        }
        if(sample_track_index.has(type)){
          $('#track-index-url').val(sample_track_index.get(type));
        }else{
          $('#track-index-url').val("");
        }
        
      })
    })

    $('#upload-track-input').on('change',function(){
      const file = ($(this).get(0).files)[0];
      if(file === undefined){
        $('#button-like-select-track').text("Select a Track File");
      }else{
        $('#button-like-select-track').text(file.name);
      }
    })

    $('#upload-track-idx-input').on('change',function(){
      const file = ($(this).get(0).files)[0];
      if(file === undefined){
        $('#button-like-select-track-idx').text("Select a Track Index File");
      }else{
        $('#button-like-select-track-idx').text(file.name);
      }
    })



});

$('#delete_panel_button').on('click',function (e){
  //console.log(live_browser);
  let id = $('#delete_panel').val();
  live_browser.delete(id)
  if (live_igv_browser.has(id)){
    igv.removeBrowser(live_igv_browser.get(id));
  }
  live_igv_browser.delete(id);
  $('#delete_panel').val("");
})




window.getAllBrowser = function(){
  return [live_browser, live_igv_browser];
}

window.removeIGV = function(browser){
  if(browser === undefined) return;
  igv.removeBrowser(browser);
}



//---------------session 相关------
function build_track_2d(track2ds){
  let track2ds_config = [];
  for(let track2d of track2ds){
    let config = track2d.config;
    if(config === undefined || isFile(config.url)) continue;
    track2ds_config.push(config);
  }
  return track2ds_config;
}

function build_session(b){
  let session = {};
  let dataset = b.dataset;
  if(dataset === undefined || dataset.url === undefined) return undefined;
  let hic = {};
  hic['contact'] =  dataset.url;
  if(b.controlUrl !== undefined) hic['control'] = b.controlUrl;
  hic['locus'] = get_goto_input();
  hic['isDiag'] = b.isDiag;
  hic['isSync'] = b.isSync;
  hic['isForce'] = b.isForce;
  if(b.normalization !== undefined) hic['normalization'] = b.normalization;

  let _id = 'd3-iframe-' + b.id;
  let frameId = document.getElementById(_id);
  if(frameId !== undefined && frameId !== null){
    frameId = frameId.getElementsByTagName("iframe")[0].id;
    let d3 = $('#'+frameId)[0].contentWindow.get3dFile();
    if(d3 !== undefined) hic['d3'] = d3;
  }
  session['hic'] = hic;
  let track2ds = b.tracks2D;
  let track2ds_config = build_track_2d(track2ds);
  if(track2ds_config.length > 0) session['track2d'] = track2ds_config;

  let id = b.id;
  let igv_browser = live_igv_browser.get(id);
  if(igv_browser === undefined) return session;


  let ref = igv_browser.config.reference;
  let fasta = ref['fastaURL'];
  if(isFile(fasta)) return session;

  session['fa'] = ref['fastaURL'];
  session['fai'] = ref['indexURL'];
  session['cytoband'] = ref['cytobandURL'];

  let tracks = igv_browser.trackViews;
  let tracks_config = [];
  for(let track of tracks){
    let config = track.track.config;
    if(config === undefined || config.url === undefined) continue;
    if(config.track_type === 'refseq'){
      session['ref'] = config.url;
    }else{
      tracks_config.push(config);
    }
  }
  if(tracks_config.length > 0) session['track'] = tracks_config;
  return session;
}

function download(filename, data) {
  const element = document.createElement('a');
  element.setAttribute('href', data);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

window.createSession = function(){
  let browsers = hic.getAllBrowsers();
  let sessions = [];
  for(let b of browsers){
    let session = build_session(b);
    if(session !== undefined)  sessions.push(session);
  }
  if(sessions.length === 0) return undefined;
  return sessions;
}


window.saveSession = function(){
  let sessions = createSession();
  if(sessions.length > 0){
    const path = hic.getCurrentBrowser().id + '-session.json'; 
    const data = URL.createObjectURL(new Blob([JSON.stringify(sessions)], {type: "application/octet-stream"}));
    download(path, data);
  }else{
    layer.msg('For security reasons, the browser prohibits reading your computer files,<br> and all local files cannot be saved in session', {
      time: 0 //不自动关闭
      ,btn: ['get']
      ,yes: function(index){
        layer.close(index);
      }
    });
  }
}

window.get_goto_input = function(){
  let _id = hic.getCurrentBrowser().id;
  return $(`#hic-chromosome-goto-container-${_id} >input`).val();
}

window.loadHiC = async function(url, type, selected_browser){
  const [name, ext] = getNameAndExt(url);
  if(ext != "hic"){
    AlertSingleton.present('.hic file is supported');
    return;
  }
  const isControl = ('control-map' === type);
  if(selected_browser === undefined){
    selected_browser = hic.getCurrentBrowser();
  }
  selected_browser = hic.getCurrentBrowser();
  if(isControl){
    if (selected_browser.dataset === undefined){
      AlertSingleton.present(`${type} must be loaded and selected before loading Conrtol map`);
      return;
    }
    await selected_browser.loadHicControlFile({'url':url, name, isControl}).then(
      res => {},
      err => {
        console.log(err);
        AlertSingleton.present('read file fail.');
      }
    )
  }else{
    selected_browser.reset();
    await selected_browser.loadHicFile({'url':url, name, isControl}).then(
      res =>{
      },
      err => {
        console.log(err);
        selected_browser.reset();
        AlertSingleton.present('read file fail.');
        return
      }
    );
    // $('#hic-control-map-dropdown').removeClass('disabled');
    $('#dropdown-b-map').removeClass('disabled');
  }
  return;
}

function getRandomColor() {
  let letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}


window.initIGV = async function (ext){
  let _id = hic.getCurrentBrowser().id;
  if(live_igv_browser.has(_id)){
    let _igv = live_igv_browser.get(_id);
    igv.removeBrowser(_igv)
    live_igv_browser.delete(_id);
  }
    const igv_container = document.getElementById("igv-" + _id);
    let locus = $('#hic-chromosome-goto-container-' + _id + ' input').val().split(' ')[0];
    const options =  {
        id: _id,
        locus: locus,
        reference: {
          "name": getNameAndExt(ext[0])[0],
          "fastaURL": ext[0],
          "indexURL": ext[1],
          "cytobandURL": ext[2],
          "tracks": [
            {
              "name": "Refseq Genes",
              "url": ext[3],
              "indexed": false,
              "searchable":true,
              "height":100,
              "displayMode": "Expand",
              "track_type": "refseq",
            }
          ]
        },
      }
    const new_igv_browser = await igv.createBrowser(igv_container, options); // 必须使用await，否则返回的是个promise
    live_igv_browser.set(_id,new_igv_browser);
  return true;
}

window.LoadHiCTrack = function(track_type, url, browser){
  if(browser === undefined) browser = hic.getCurrentBrowser();
  if(browser.dataset === undefined){
    AlertSingleton.present('Load HiC data first');
    return false;
  };
  let config = {
    "track_type": track_type,
    "name": getNameAndExt(url)[0],
    "header":{
      "Request Method":"GET"
    },
    "url":url,
    "autoscale": true,
    "color":getRandomColor(), 
    "height":100,
    "displayMode": "Expand"
  };
  browser.loadTracks([config]);
  return true;
}

window.LoadIGVTrack = async function(track_type, url, idx_url = undefined){
  let _id = hic.getCurrentBrowser().id;
  if(! live_igv_browser.has(_id)){
    AlertSingleton.present('Load ref Genome first');
    return false;
  }
  let b = live_igv_browser.get(_id);
  let config;
  if(track_type === "ab"){
    config = {
      "type": "wig",
      "height":50,
      "color":"rgb(2, 132, 1)",
      "url" : url,
      "indexURL": idx_url,
      "name" : getNameAndExt(url)[0],
      "track_type": track_type,
      "displayMode": "Expand"
    }
  }else if(track_type === 'auto'){
    config = {
      "url" : url,
      "indexURL": idx_url,
      "name" : getNameAndExt(url)[0],
      "track_type": track_type,
      "color":getRandomColor(), 
      "height":100,
      "displayMode": "Expand"
    }
  }
  else{
    config = {
      "type": track_type,
      "url" : url,
      "indexURL": idx_url,
      "name" : getNameAndExt(url)[0],
      "track_type": track_type,
      "color":getRandomColor(), 
      "height":100,
      "displayMode": "Expand"
    }
  }

  b.loadTrackList([config]);
  return true;
}

window.browser_goto_locus = function(locus,b){
  if(!b || b === undefined){
    b = hic.getCurrentBrowser();
  }
  let d = b.isDiag;
  if(d){
    locus = locus.split(' ');
    locus = locus[0] + ' ' + locus[0];
  }
  b.gotoLocus(locus);
}

/**
 * 
 * @param {*} id : browser id 
 * @param {*} x : locus x
 * @param {*} y : locus y
 * @param {*} ignore : ignore msg
 * @returns 
 */
 window.call3d = function(id,x,y,ignore = false,ismove = false){
  let _id = 'd3-iframe-' + id;
  if(document.getElementById(_id) === null || document.getElementById(_id) === undefined){
    // 没有打开3d 页面
    if(!ignore){
      layer.msg('No 3D model loaded!');
    }
    return;
  }
  let frameId = document.getElementById(_id).getElementsByTagName("iframe")[0].id;
  $('#'+frameId)[0].contentWindow.goto(x,y,ismove);
}
  //Gene promoters’ coordinates were downloaded from the EPDnew database (https://epd.vital-it.ch/human/human_database.php). 