import hic from "./browser/juicebox.esm.js";
import {AlertSingleton} from './browser/igv-widgets.js'
import {
  live_browser, container,
  getFileExt,getNameAndExt, 
  mm10_ext, mm39_ext, hg19_ext, hg38_ext,
  sample_map,} from "./global.js"



//============================Load A MAP======================================
$("[name = 'local-contact-map']").on("change", async function (e) {
  const file = ($(this).get(0).files)[0];
  $(this).val("");
  $(this).blur();
  loadHiC(file, 'contact-map');
  return;
})

$('#load-A-sample > a').on('click', async function(){
  let value = $(this).attr('value');
  let url = sample_map.get(value);
  await loadHiC(url, 'contact-map');
  $(this).blur();
  return;
});


$("#load-A-btn").on('click' ,async function(){
  let  url = $(`#load-A-url`).val();
  url = url.trim();
  $(this).blur();
  if(url === undefined || url.length < 1){
    AlertSingleton.present(`No url input`);
  }else{
    await loadHiC(url, 'contact-map');
  }
  $('#load-A-modal').modal('hide');
  return;
})

//============================Load B MAP======================================
$("[name = 'local-control-map']").on("change", async function (e) {
  const file = ($(this).get(0).files)[0];
  $(this).val("");
  $(this).blur();
  await loadHiC(file, 'control-map');
  return;
})

$("#load-B-btn").on('click' ,async function(){
  let url = $(`#load-B-url`).val();
  url = url.trim();
  $(this).blur();
  await loadHiC(url, 'control-map');
  $('#load-B-modal').modal('hide');
  return;
})

$('#load-B-sample > a').on('click', async function(){
  let value = $(this).attr('value');
  let url = sample_map.get(value);
  await loadHiC(url, 'control-map');
  $(this).blur();
  return;
});

//============================CLONE======================================
window.cloneBrowser = async function(){
  let old = hic.getCurrentBrowser();
  let new_browser = await hic.createBrowser(container, {});
  live_browser.set(new_browser.id,new_browser);
  if(old.dataset != undefined && old.dataset.url!==undefined){
    let url = old.dataset.url;
    const [name, ext] = getNameAndExt(url);
    const isControl = ('control-map' === 'contact-map');
    await new_browser.loadHicFile({'url':url, name, isControl})

  }
  return new_browser;
}

$("[name = 'hic-clone']").on('click',async function(e) {
  cloneBrowser();
  layer.msg('success');
})


//============================Load REF GENEOME======================================
function GetFromFiles(file,ext){
  for(let i = 0; i < file.length; i ++){
    let element = file[i].name;
    let extname = getFileExt(element);
    if(extname === ext){
      return file[i];
    }
  }
  return undefined;
}

$("[name = 'local-ref-gene']").on("change", async function (e) {
  let file = ($(this).get(0).files);
  let ext = new Array(4); // fasta,fai,txt,gz
  let  b = hic.getCurrentBrowser();
  if (b.dataset == undefined){
    AlertSingleton.present('Load HiC map first!');
    $(this).val("");
    return false;
  }

  if(file.length < 3){
    AlertSingleton.present('Please select .fasta , .fai and .tar.gz file. A cytoband file(.txt) is optional');
    $(this).val("");
    return;
  }

  ext[0] = GetFromFiles(file,'fasta');
  if(ext[0] === undefined){
    ext[0] = GetFromFiles(file,'fa');
  }

  if(ext[0] === undefined){
    AlertSingleton.present('Please select .fasta or .fa file');
    $(this).val("");
    return;
  }

  ext[1] = GetFromFiles(file,'fai');
  if(ext[1] === undefined){
    AlertSingleton.present('Please select .fai file');
    $(this).val("");
    return;
  }
  ext[2] = GetFromFiles(file,'txt');
  ext[3] = GetFromFiles(file,'gz');
  if(ext[3] === undefined){
    AlertSingleton.present('Please select refGene file[.txt.gz]');
    $(this).val("");
    return;
  }
  let loading = layer.load(1, {
    shade: [0.5,'#fff'] 
  });
  let res = await initIGV(ext);
  layer.close(loading);
  if(res) layer.msg('success');
  $(this).val("");
})

$(`#load-hg19-ref`).on('click', async function(){
  $(this).blur();
  let loading = layer.load(1, {
    shade: [0.5,'#fff'] 
  });
  let genomeId = hic.getCurrentBrowser().genome.id;
  if(genomeId != 'hg19' && genomeId != 'GRCh37') layer.msg(`NOTE: The reference genome of Hi-C is ${genomeId}, which does not match the loaded genome hg19`);
  let res = await initIGV(hg19_ext);
  layer.close(loading);
  if(res) layer.msg('success');
})

$(`#load-hg38-ref`).on('click', async function(){
  $(this).blur();
  let loading = layer.load(1, {
    shade: [0.5,'#fff'] 
  });
  let genomeId = hic.getCurrentBrowser().genome.id;
  if(genomeId != 'hg38' && genomeId != 'GRCh38') layer.msg(`NOTE: The reference genome of Hi-C is ${genomeId}, which does not match the loaded genome hg38`);
  let res = await initIGV(hg38_ext);
  layer.close(loading);
  if(res) layer.msg('success');
})


$(`#load-mm10-ref`).on('click', async function(){
  $(this).blur();
  let loading = layer.load(1, {
    shade: [0.5,'#fff'] 
  });
  let genomeId = hic.getCurrentBrowser().genome.id;
  if(genomeId != 'mm10' && genomeId != 'GRCm38') layer.msg(`NOTE: The reference genome of Hi-C is ${genomeId}, which does not match the loaded genome mm10`);
  let res = await initIGV(mm10_ext);
  layer.close(loading);
  if(res) layer.msg('success');
})

$(`#load-mm39-ref`).on('click', async function(){
  $(this).blur();
  let loading = layer.load(1, {
    shade: [0.5,'#fff'] 
  });
  let genomeId = hic.getCurrentBrowser().genome.id;
  if(genomeId != 'mm39' && genomeId != 'GRCm39') layer.msg(`NOTE: The reference genome of Hi-C is ${genomeId}, which does not match the loaded genome mm39`);
  let res = await initIGV(mm39_ext);
  layer.close(loading);
  if(res) layer.msg('success');
})


//============================Load A TRACK======================================
function loadTrack_with_url(track_type,  track_url, track_index_url){
  let res;
  if (track_type === "loop" || track_type === "tad"){
    res = LoadHiCTrack(track_type, track_url);
  }
  else{
    res = LoadIGVTrack(track_type, track_url, track_index_url);
  }
  return res;
}

function loadTrack_with_file(track_type, file, idxfile){
  let res;
  if (track_type === "loop" || track_type === "tad"){
    res = LoadHiCTrack(track_type, file);
  }
  else{
    res = LoadIGVTrack(track_type, file, idxfile);
  }
  return res;
}

function resetModal(){

  // 还原选择的文件
  $('#upload-track-input').val("");
  $('#upload-track-idx-input').val("");

  // 还原文字
  $('#button-like-select-track').text("Select a Track File");
  $('#button-like-select-track-idx').text("Select a Track Index File");

  // 还原url
  $('#track-url').val("");
  $('#track-index-url').val("");
}

$("[name = 'load-track-button']").on("click", async function (e) {
  let type = $('#track-select-input').attr('track');
  if(type === undefined){
    layer.msg('please select track type!');
    return;
  }
  let file = ($('#upload-track-input').get(0).files)[0];
  let idxfile = ($('#upload-track-idx-input').get(0).files)[0];
  let res;
  if(file){
    res = loadTrack_with_file(type, file, idxfile);
  }else{
    let track_url = $('#track-url').val();
    let track_index_url = $('#track-index-url').val();
    if(track_url === undefined) {
      layer.msg('no file or url!')
      return;
    }
    res = loadTrack_with_url(type, track_url, track_index_url);
  }
  if(res) layer.msg('sucess');

  $('#load-track-modal').modal('hide');
  resetModal();
})