import hic from "./juicebox.esm.js";
import igv from "./igv.esm.js"
import { AlertSingleton } from './igv-widgets.js'
import {
  live_browser, live_igv_browser, 
  container, isFile, 
  getNameAndExt, getQueryVariable, 
  sample_track, sample_track_index, 
  parseLocus
} from "./global.js"

console.log('==========>initialize the browser viewer start');

const browser0 = await hic.init(container, {
});
const browser1 = await hic.createBrowser(container, {});
const browser2 = await hic.createBrowser(container, {});



live_browser.set(browser0.id, browser0);
live_browser.set(browser1.id, browser1);
live_browser.set(browser2.id, browser2);

await browser0.reset();

console.log('==========>initialize the browser viewer end');
AlertSingleton.init(container) // 弹窗
//箭头函数没有this指针！！！
$(document).ready(function () {
  $('[data-toggle="tooltip"]').tooltip();
  let example_id = getQueryVariable('example');
  if (example_id === undefined) {
    let restore = localStorage.getItem('Restore');
    if (restore == 1) {
      let sesseion = localStorage.getItem('session');
      if (sesseion !== undefined && sesseion !== null && sesseion !== 'undefined') {
        restoreSessions(sesseion);
      }
    }
  }

  let track_type = document.querySelector('.track-type');
  track_type.onclick = function () {
    track_type.classList.toggle('open');
  }

  let opt_div = $('#track-option >div');
  $.each(opt_div, function () {
    $(this).on('click', function () {
      let text = $(this).text();
      let type = $(this).attr('value');
      $('#track-select-input').attr('placeholder', text);
      $('#track-select-input').attr("track", type);
      if (sample_track.has(type)) {
        console.log(sample_track.get(type))
        $('#track-url').val(sample_track.get(type));
      } else {
        $('#track-url').val("");
      }
      if (sample_track_index.has(type)) {
        $('#track-index-url').val(sample_track_index.get(type));
      } else {
        $('#track-index-url').val("");
      }

    })
  })

  $('#upload-track-input').on('change', function () {
    const file = ($(this).get(0).files)[0];
    if (file === undefined) {
      $('#button-like-select-track').text("Select a Track File");
    } else {
      $('#button-like-select-track').text(file.name);
    }
  })

  $('#upload-track-idx-input').on('change', function () {
    const file = ($(this).get(0).files)[0];
    if (file === undefined) {
      $('#button-like-select-track-idx').text("Select a Track Index File");
    } else {
      $('#button-like-select-track-idx').text(file.name);
    }
  })



});

$('#delete_panel_button').on('click', function (e) {
  //console.log(live_browser);
  let id = $('#delete_panel').val();
  live_browser.delete(id)
  if (live_igv_browser.has(id)) {
    igv.removeBrowser(live_igv_browser.get(id));
  }
  live_igv_browser.delete(id);
  $('#delete_panel').val("");
})




window.getAllBrowser = function () {
  return [live_browser, live_igv_browser];
}

window.getSelectId = function () {
  return hic.getCurrentBrowser().id;
}


window.removeIGV = function (browser) {
  if (browser === undefined) return;
  igv.removeBrowser(browser);
}



//---------------session 相关------
function build_track_2d(track2ds) {
  let track2ds_config = [];
  for (let track2d of track2ds) {
    let config = track2d.config;
    if (config === undefined || isFile(config.url)) continue;
    track2ds_config.push(config);
  }
  return track2ds_config;
}

function build_session(b) {
  let session = {};
  let dataset = b.dataset;
  if (dataset === undefined || dataset.url === undefined) return undefined;
  let hic = {};
  hic['contact'] = dataset.url;
  if (b.controlUrl !== undefined) hic['control'] = b.controlUrl;
  hic['locus'] = get_goto_input();
  hic['isDiag'] = b.isDiag;
  hic['isSync'] = b.isSync;
  hic['isForce'] = b.isForce;
  if (b.normalization !== undefined) hic['normalization'] = b.normalization;

  let _id = 'd3-iframe-' + b.id;
  let frameId = document.getElementById(_id);
  if (frameId !== undefined && frameId !== null) {
    frameId = frameId.getElementsByTagName("iframe")[0].id;
    let d3 = $('#' + frameId)[0].contentWindow.get3dFile();
    if (d3 !== undefined) hic['d3'] = d3;
  }
  session['hic'] = hic;
  let track2ds = b.tracks2D;
  let track2ds_config = build_track_2d(track2ds);
  if (track2ds_config.length > 0) session['track2d'] = track2ds_config;

  let id = b.id;
  let igv_browser = live_igv_browser.get(id);
  if (igv_browser === undefined) return session;


  let ref = igv_browser.config.reference;
  let fasta = ref['fastaURL'];
  if (isFile(fasta)) return session;

  session['fa'] = ref['fastaURL'];
  session['fai'] = ref['indexURL'];
  session['cytoband'] = ref['cytobandURL'];

  let tracks = igv_browser.trackViews;
  let tracks_config = [];
  for (let track of tracks) {
    let config = track.track.config;
    if (config === undefined || config.url === undefined) continue;
    if (config.track_type === 'refseq') {
      session['ref'] = config.url;
    } else {
      tracks_config.push(config);
    }
  }
  if (tracks_config.length > 0) session['track'] = tracks_config;
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

window.createSession = function () {
  let browsers = hic.getAllBrowsers();
  let sessions = [];
  for (let b of browsers) {
    let session = build_session(b);
    if (session !== undefined) sessions.push(session);
  }
  if (sessions.length === 0) return undefined;
  return sessions;
}


window.saveSession = function () {
  let sessions = createSession();
  if (sessions.length > 0) {
    const path = hic.getCurrentBrowser().id + '-session.json';
    const data = URL.createObjectURL(new Blob([JSON.stringify(sessions)], { type: "application/octet-stream" }));
    download(path, data);
  } else {
    layer.msg('For security reasons, the browser prohibits reading your computer files,<br> and all local files cannot be saved in session', {
      time: 0 //不自动关闭
      , btn: ['get']
      , yes: function (index) {
        layer.close(index);
      }
    });
  }
}

window.get_goto_input = function () {
  let _id = hic.getCurrentBrowser().id;
  return $(`#hic-chromosome-goto-container-${_id} >input`).val();
}

window.loadHiC = async function (url, type, selected_browser) {
  const [name, ext] = getNameAndExt(url);
  if (ext != "hic") {
    AlertSingleton.present('.hic file is supported');
    return;
  }
  const isControl = ('control-map' === type);
  if (selected_browser === undefined) {
    selected_browser = hic.getCurrentBrowser();
  }
  if (isControl) {
    if (selected_browser.dataset === undefined) {
      AlertSingleton.present(`${type} must be loaded and selected before loading Conrtol map`);
      return;
    }
    await selected_browser.loadHicControlFile({ 'url': url, name, isControl }).then(
      res => { },
      err => {
        console.log(err);
        AlertSingleton.present('read file fail.');
      }
    )
  } else {
    selected_browser.reset();
    await selected_browser.loadHicFile({ 'url': url, name, isControl }).then(
      res => {
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

const appleCrayonPalette = [
  '#f6cacc', '#f1a7a9', '#ec8385', '#e66063', '#e35053', '#FF0000', '#d02224', '#bd1f21', '#ac1c1e', '#9c191b',
  '#ffedd8', '#f3d5b5', '#e7bc91', '#d4a276', '#bc8a5f', '#a47148', '#8b5e34', '#6f4518', '#603808', '#583101',
  '#fff75e', '#fff056', '#ffe94e', '#ffe246', '#ffda3d', '#ffd53e', ' #fecf3e', '#fdc43f', '#fdbe39', '#fdb833',
  '#b7efc5', '#92e6a7', '#6ede8a', '#4ad66d', '#2dc653', '#25a244', '#208b3a', '#1a7431', '#155d27', '#10451d',
  '#3fc1c0', '#20bac5', '#00b2ca', '#04a6c2', '#0899ba', '#0f80aa', '#16679a', '#1a5b92', '#1c558e', '#1d4e89',
  '#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5', '#2196f3', '#1e88e5', '#1976d2', '#1565c0', '#0d47a1',
  '#dec9e9', '#dac3e8', '#d2b7e5', '#c19ee0', '#b185db', '#a06cd5', '#9163cb', '#815ac0', '#7251b5', '#6247aa',
  '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#6E6E6E', '#495057', '#343a40', '#212529'
]

function getRandomColor() {
  let randomNum = Math.floor(Math.random() * 8);
  return appleCrayonPalette[randomNum * 10 + 9];
}

window.updateIGV = async function(id, type, status){
    if(live_igv_browser.has(id)){
      let b = live_igv_browser.get(id);
      switch(type){
        case 'Gear':
          b.config.hideGear = status;
          break;
        case 'Ruler':
          b.config.hideRuler = status;
          break;
        case 'Ideogram':
          b.config.hideIdeogram = status;
          break;
        case 'Sequence':
          b.config.hideSequence = status;
          break;
        case 'Scroll':
          b.config.hideScroll = status;
          break;
        default:
          break;
      }
      // await b.repaintViews();
    }else{
      return;
    }
}

window.initIGV = async function (ext) {
  let _id = hic.getCurrentBrowser().id;
  let _config = hic.getCurrentBrowser().config;
  if (live_igv_browser.has(_id)) {
    let _igv = live_igv_browser.get(_id);
    igv.removeBrowser(_igv)
    live_igv_browser.delete(_id);
  }
  const igv_container = document.getElementById("igv-" + _id);
  let locus = $('#hic-chromosome-goto-container-' + _id + ' input').val().split(' ')[0];
  const options = {
    hideIdeogram: _config.hideIdeogram,
    hideRuler: _config.hideRuler,
    hideSequence: _config.hideSequence,
    hideGear: _config.hideGear,
    hideScroll: _config.hideScroll,
    id: _id,
    locus: locus,
    showCenterGuideButton:false,
    showChromosomeWidget:false,
    showControls:false,
    showCursorTrackingGuideButton: false,
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
          "searchable": false,
          "height": 100,
          'color': getRandomColor(),
          "displayMode": "EXPANDED",
          "track_type": "refseq",
        }
      ]
    },
  }
  //console.log(options);
  const new_igv_browser = await igv.createBrowser(igv_container, options); // 必须使用await，否则返回的是个promise
  new_igv_browser.hic = hic.getCurrentBrowser();
  live_igv_browser.set(_id, new_igv_browser);
  return true;
}

window.LoadHiCTrack = function (track_type, url, browser) {
  if (browser === undefined) browser = hic.getCurrentBrowser();
  if (browser.dataset === undefined) {
    AlertSingleton.present('Load HiC data first');
    return false;
  };
  let config = {
    "track_type": track_type,
    "name": getNameAndExt(url)[0],
    "header": {
      "Request Method": "GET"
    },
    "url": url,
    "autoscale": true,
    "color": getRandomColor(),
    "height": 100,
    "displayMode": "Expand"
  };
  browser.loadTracks([config]);
  return true;
}

window.LoadIGVTrack = async function (track_type, url, idx_url = undefined) {
  let _id = hic.getCurrentBrowser().id;
  if (!live_igv_browser.has(_id)) {
    AlertSingleton.present('Load ref Genome first');
    return false;
  }
  let b = live_igv_browser.get(_id);
  let config;
  if (track_type === "ab") {
    config = {
      "type": "wig",
      "height": 50,
      "color": "rgb(2, 132, 1)",
      "url": url,
      "indexURL": idx_url,
      "name": getNameAndExt(url)[0],
      "track_type": track_type,
    }
  } else if (track_type === 'auto') {
    config = {
      "url": url,
      "indexURL": idx_url,
      "name": getNameAndExt(url)[0],
      "track_type": track_type,
      "height": 100,
    }
  } else if (track_type === 'seg') {
    config = {
      "type": track_type,
      "url": url,
      "indexURL": idx_url,
      "name": getNameAndExt(url)[0],
      "track_type": track_type,
      "height": 200,
      'displayMode': 'Fill'
    }
  }
  else {
    config = {
      "type": track_type,
      "url": url,
      "indexURL": idx_url,
      "name": getNameAndExt(url)[0],
      "track_type": track_type,
      "color": getRandomColor(),
      "height": 100
    }
  }

  b.loadTrackList([config]);
  return true;
}

window.browser_shift = function(dx){
  let b = hic.getCurrentBrowser();
  b.shiftPixels(dx, dx);
}

window.igv_shift = function(_id, dx){
  if (!live_igv_browser.has(_id)) return;
  let b = live_igv_browser.get(_id);
  b.IGVShift(dx);
 
}

window.browser_goto_locus = function (locus, b, is_igv) {
  if (!b || b === undefined) {
    b = hic.getCurrentBrowser();
  }
  let d = b.isDiag;
  if (d) {
    locus = locus.split(' ');
    locus = locus[0] + ' ' + locus[0];
  }
  b.gotoLocus(locus, is_igv);
}


window.igv_goto_locus = function (locus, _id) {
  //console.log('igv goto:', locus);
  if (!live_igv_browser.has(_id)) return;
  let b = live_igv_browser.get(_id);
  if (locus === 'ALL' || locus === 'all' || locus === 0 || locus === '0' || typeof locus === 'number') {
    b.goto(locus);
    return;
  }
  locus = locus.split(' ')[0];
  let [chr, s, e] = parseLocus(locus)
  // b.IGVShift(3);
  b.goto(chr, s, e);

}

/**
 * 
 * @param {*} id : browser id 
 * @param {*} x : locus x
 * @param {*} y : locus y
 * @param {*} ignore : ignore msg
 * @returns 
 */
window.call3d = function (id, x, y, ignore = false, ismove = false) {
  let _id = 'd3-iframe-' + id;
  if (document.getElementById(_id) === null || document.getElementById(_id) === undefined) {
    // 没有打开3d 页面
    if (!ignore) {
      layer.msg('No 3D model loaded!');
    }
    return;
  }
  let frameId = document.getElementById(_id).getElementsByTagName("iframe")[0].id;
  $('#' + frameId)[0].contentWindow.goto(x, y, ismove);
}
//Gene promoters’ coordinates were downloaded from the EPDnew database (https://epd.vital-it.ch/human/human_database.php). 

function dom_2_canvas() {
  var canvas2 = document.createElement("canvas");
  let _id = `#${hic.getCurrentBrowser().id}-content-container`;
  let _canvas = document.querySelector(_id);
  var w = parseInt(window.getComputedStyle(_canvas).width) + 500;
  var h = parseInt(window.getComputedStyle(_canvas).height) + 500;
  //将canvas画布放大若干倍，然后盛放在较小的容器内，就显得不模糊了
  canvas2.width = w * 2;
  canvas2.height = h * 2;
  canvas2.style.width = w + "px";
  canvas2.style.height = h + "px";
  var context = canvas2.getContext("2d");
  context.scale(2, 2);
  html2canvas(_canvas, { canvas: canvas2 }).then(function (canvas) {
    //document.querySelector(".down").setAttribute('href', canvas.toDataURL());
    download("test.png", canvas.toDataURL());
  });
}

$("[name = 'export']").on('click', async function (e) {
  dom_2_canvas();
  layer.msg('success');
})