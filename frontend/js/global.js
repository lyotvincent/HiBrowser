export var live_browser = new Map(); // id:hic-browser object
export var live_igv_browser = new Map(); // id : igv-browser obj
export var cursor = false;
export var min_chromosome = 53331; // 放大选中的区域，最小值
export var gene_locus_range = 425660;
export var inter_locus_range = 27306240; // 同一条染色体，两个位点的交互的分辨率
export var intra_locus_range = 32000000; // 不 同 染色体，两个位点的交互的分辨率


export function getFileExt(filename){
  return filename.substring(filename.lastIndexOf(".") + 1);
}

export function guid  () {
  return ("0000" + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4);
}

export function swap(x,y){
  x = x + y;
  y = x - y;
  x = x - y;
  return [x,y];
}

export function formatLocus(x){
  if (x > 1e6){
    x = (x / 1e6).toFixed(2);
    x = x + ' Mb';
  }else if (x > 1e4){
    x = (x / 1e3).toFixed(2);
    x = x + ' Kb';
  }else{
    x = x.toFixed(0) + 'bp';
  }
  return x;
}

export function parseLocus(x){
  try{
    x = x.split(':');
    let chr = x[0];
    let scales = x[1];
    scales = scales.replaceAll(',', '');
    scales = scales.split('-');
    let x_start = parseInt(scales[0]);
    let x_end = parseInt(scales[1]);
    return [chr, x_start, x_end];
  }catch(error){
    return undefined
  }
}


export function generate_a_locus(chrx,xs,xe){
  xs = Number(xs).toLocaleString();
  xe = Number(xe).toLocaleString();
  let cor = chrx + ':' + xs + '-' + xe;
  return cor;
}
export function generate_locus(chrx,xs,xe,chry, ys, ye){
  let cor = generate_a_locus(chrx,xs,xe) + ' ' + generate_a_locus(chry, ys, ye);
  return cor;
}


export function get_hic_species(gene_id){
  if(gene_id === 'hg38' || gene_id === 'GRCh38' || gene_id === 'hg19' || gene_id === 'GRCh37') return 'human';
  if (gene_id === 'mm10' || gene_id === 'GRCm38') return 'mouse';
  return 'unknow';

}

export function ShowBodyCover(){
  $(`body`).css('overflow','hidden');
}

export function HideBodyCover(){
  $(`body`).css('overflow','');
}

export function del_from_arr(a,b){
  a = a.filter(item => item != b);
  return a;
}

export function isFile(object) {
  if(!object) {
      return false;
  }
  return typeof object !== 'function' &&
      (object instanceof File ||
          (object.name !== undefined &&  typeof object.slice === 'function' && typeof object.arrayBuffer === 'function'))
}

export function getNameAndExt(url){
  if(isFile(url)){
    let ext = getFileExt(url.name); 
    return [url.name, ext];
  }
  let site = url.lastIndexOf("\/");
  let name = url.substring(site + 1, url.length);
  let ext = getFileExt(name);
  return [name, ext];
}

export const container = document.getElementById("app-container");
export const table_header = ['id', 'name', 'locus', 'enhancer', 'promoter', 'super_enhancer', 'strand',  'TF', 'target', 'diseases'];



const download_svg_icon = `
<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 488.658 488.658" style="enable-background:new 0 0 488.658 488.658;" xml:space="preserve">
          <path d="M225.485,317.756c-21-23-42.8-45.1-67.4-64.3c-7.4-5.8-16.2-8-22.1-1.1c-5.4,6.3-5,15.3,1.1,22.8
            c11,13.4,21.9,27,34.3,39.1c19.9,19.4,41,37.6,61.6,56.4c0.6,1,1.2,1.9,1.8,2.9v0.1c3.1,4.8,9.6,6.2,14.4,3.1l4.8-3.1
            c41.9-27.1,72.7-66.8,109.2-100c1.7-1.5,1.7-6.5,0.7-9c-1.9-5-6.8-5.9-12.1-5.1c-17.2,2.7-32.5,11.6-45.7,23
            c-15.8,13.7-31.7,27.2-47.2,41.3c1.2-14.4,2.1-28.8,2-43.2c-0.4-32.2-2.4-64.4-3.7-96.6c11.5-57.7,4.9-116.8,7.3-175.2
            c0.1-2.6-3.4-6.7-5.8-8c-4.9-2.5-9,0.8-12.1,5.7c-10.3,16.3-14.8,36.1-16,56.2c-2.9,48.5-7.3,97-4,145.7c-0.4,6-0.8,12.1-1.1,18.1
            C224.085,256.956,223.585,287.456,225.485,317.756z"/>
          <path d="M214.685,450.756c-6.3-0.4-12.6-0.8-18.9-1.1c-40-1.7-80-2.2-119.8,1.9c-11.3,1.2-20.7,5.8-19.9,14.8
            c0.8,8.3,8.8,14.4,20.4,15.3c20.9,1.7,41.9,3.6,62.8,3.4c33.7-0.4,67.3-2.4,101-3.7c60.3,11.5,122.1,4.9,183.1,7.3
            c2.7,0.1,7-3.4,8.3-5.8c2.7-4.9-0.8-9-6-12.1c-17-10.3-37.7-14.8-58.8-16C316.385,451.956,265.685,447.556,214.685,450.756z"/>
        </svg>`
const upload_svg_icon = `<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 488.858 488.858" style="enable-background:new 0 0 488.858 488.858;" xml:space="preserve">
<path d="M63.023,18.002c17,10.3,37.7,14.8,58.8,16c50.7,2.9,101.3,7.3,152.3,4c6.3,0.4,12.6,0.8,18.9,1.1c40,1.7,80,2.2,119.8-1.9
  c11.3-1.2,20.7-5.8,19.9-14.8c-0.8-8.3-8.8-14.4-20.4-15.3c-20.9-1.8-41.9-3.7-62.9-3.5c-33.7,0.4-67.3,2.4-101,3.7
  c-60.3-11.5-122-4.9-183.1-7.3c-2.7-0.1-7,3.4-8.3,5.8C54.323,10.702,57.823,14.902,63.023,18.002z"/>
<path d="M330.723,235.402c7.4,5.8,16.2,8,22.1,1.1c5.4-6.3,5-15.3-1.1-22.8c-11-13.4-21.9-27-34.3-39.1
  c-19.9-19.4-41-37.6-61.6-56.4c-0.6-1-1.2-1.9-1.8-2.9v-0.1c-3.1-4.8-9.6-6.2-14.4-3.1l-4.8,3.1c-41.9,27.1-72.7,66.8-109.2,100
  c-1.7,1.5-1.7,6.5-0.7,9c1.9,5,6.8,5.9,12.1,5.1c17.2-2.7,32.5-11.6,45.7-23c15.8-13.7,31.7-27.2,47.2-41.3
  c-1.2,14.4-2.1,28.8-2,43.2c0.4,32.2,2.4,64.4,3.7,96.6c-11.5,57.7-4.9,116.8-7.3,175.2c-0.1,2.6,3.4,6.7,5.8,8
  c4.9,2.5,9-0.8,12.1-5.7c10.3-16.3,14.8-36.1,16-56.2c2.9-48.5,7.3-97,4-145.7c0.4-6,0.8-12.1,1.1-18.1c1.3-30.4,1.9-60.9,0-91.2
  C284.323,194.102,306.123,216.202,330.723,235.402z"/>
</svg>`;
const color_svg_icon = `
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
          viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">
            <path d="M111.574,177.625c-32.352,0-58.671,23.201-58.671,51.718c0,28.517,26.319,51.718,58.671,51.718
              c32.352,0,58.671-23.201,58.671-51.718C170.245,200.826,143.926,177.625,111.574,177.625z M111.574,261.061
              c-21.323,0-38.671-14.229-38.671-31.718c0-17.489,17.348-31.718,38.671-31.718c21.323,0,38.671,14.229,38.671,31.718
              C150.245,246.832,132.897,261.061,111.574,261.061z"/>
            <path d="M207.858,271.642c-27.685,0-50.207,19.945-50.207,44.462c0,24.517,22.522,44.463,50.207,44.463
              c27.684,0,50.206-19.945,50.206-44.463C258.064,291.588,235.542,271.642,207.858,271.642z M207.858,340.567
              c-16.656,0-30.207-10.975-30.207-24.463c0-13.488,13.551-24.462,30.207-24.462s30.206,10.973,30.206,24.462
              S224.513,340.567,207.858,340.567z"/>
            <path d="M341.174,278.444c-24.767,0-44.916,17.911-44.916,39.928c0,22.016,20.149,39.928,44.916,39.928
              c24.766,0,44.916-17.912,44.916-39.928C386.09,296.356,365.941,278.444,341.174,278.444z M341.174,338.3
              c-13.738,0-24.916-8.94-24.916-19.928c0-10.988,11.178-19.928,24.916-19.928s24.916,8.939,24.916,19.928
              S354.912,338.3,341.174,338.3z"/>
            <path d="M430.052,221.308c-20.683,0-37.51,15.064-37.51,33.58c0,18.516,16.827,33.58,37.51,33.58
              c20.682,0,37.51-15.064,37.51-33.58C467.562,236.372,450.735,221.308,430.052,221.308z M430.052,268.468
              c-9.491,0-17.51-6.219-17.51-13.58c0-7.361,8.019-13.58,17.51-13.58c9.491,0,17.51,6.219,17.51,13.58
              C447.562,262.249,439.543,268.468,430.052,268.468z"/>
            <path d="M419.948,176.364c0-15.724-14.69-28.516-32.748-28.516s-32.749,12.792-32.749,28.516
              c0,15.724,14.691,28.516,32.749,28.516S419.948,192.088,419.948,176.364z M387.2,184.88c-7.514,0-12.749-4.488-12.749-8.516
              s5.235-8.516,12.749-8.516c7.513,0,12.748,4.488,12.748,8.516S394.713,184.88,387.2,184.88z"/>
            <path d="M314.585,250.216c4.329-3.43,5.057-9.72,1.626-14.048c-3.431-4.328-9.722-5.057-14.048-1.625
              c-3.702,2.933-8.032,5.965-12.871,9.011c-4.674,2.942-6.078,9.116-3.136,13.79c1.901,3.019,5.15,4.674,8.473,4.674
              c1.82,0,3.663-0.497,5.317-1.539C305.395,257.05,310.319,253.597,314.585,250.216z"/>
            <path d="M482.379,163.832c-18.29-22.642-44.789-42.533-76.632-57.524c-26.779-12.607-49.884,3.944-72.226,19.95
              c-18.447,13.216-37.522,26.881-60.063,26.881c-10.327,0-20.905-1.149-31.595-3.001c-5.442-1.149-9.289-1.829-10.682-2.066
              c-15.909-3.379-31.969-8.013-47.747-12.579c-46.493-13.453-90.407-26.158-121.274-2.802C22.075,163.023,0,202.019,0,242.494
              C0,288.13,27.224,330.71,76.656,362.39C124.71,393.185,188.402,410.145,256,410.145s131.29-16.96,179.344-47.755
              C484.776,330.71,512,288.13,512,242.494C512,215.021,501.758,187.82,482.379,163.832z M424.553,345.55
              C379.68,374.308,319.82,390.145,256,390.145S132.32,374.308,87.447,345.55C43.953,317.677,20,281.077,20,242.494
              c0-34.061,19.259-67.393,54.228-93.855c8.421-6.372,19.055-8.858,31.21-8.858c20.86,0,46.191,7.33,72.438,14.924
              c19.836,5.74,40.1,11.595,60.391,15.124c9.505,2.026,23.989,5.529,38.27,10.598c27.584,9.791,43.006,21.373,42.312,31.776
              c-0.368,5.511,3.801,10.276,9.312,10.644c0.227,0.016,0.452,0.023,0.676,0.023c5.219,0,9.615-4.051,9.968-9.334
              c1.169-17.516-11.796-32.634-38.574-45.069c16.896-5.868,31.52-16.335,44.94-25.949c22.259-15.946,36.682-25.353,52.059-18.113
              C456.571,152.339,492,196.486,492,242.494C492,281.077,468.047,317.677,424.553,345.55z"/>
          </svg>`

const check_svg_icon = `<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<!-- Uploaded to SVGRepo https://www.svgrepo.com -->
<title>ic_fluent_checkbox_checked_24_regular</title>
<desc>Created with Sketch.</desc>
<g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
    <g id="ic_fluent_checkbox_checked_24_regular" fill="#212121" fill-rule="nonzero">
        <path d="M18.25,3 C19.7687831,3 21,4.23121694 21,5.75 L21,18.25 C21,19.7687831 19.7687831,21 18.25,21 L5.75,21 C4.23121694,21 3,19.7687831 3,18.25 L3,5.75 C3,4.23121694 4.23121694,3 5.75,3 L18.25,3 Z M18.25,4.5 L5.75,4.5 C5.05964406,4.5 4.5,5.05964406 4.5,5.75 L4.5,18.25 C4.5,18.9403559 5.05964406,19.5 5.75,19.5 L18.25,19.5 C18.9403559,19.5 19.5,18.9403559 19.5,18.25 L19.5,5.75 C19.5,5.05964406 18.9403559,4.5 18.25,4.5 Z M10,14.4393398 L16.4696699,7.96966991 C16.7625631,7.6767767 17.2374369,7.6767767 17.5303301,7.96966991 C17.7965966,8.23593648 17.8208027,8.65260016 17.6029482,8.94621165 L17.5303301,9.03033009 L10.5303301,16.0303301 C10.2640635,16.2965966 9.84739984,16.3208027 9.55378835,16.1029482 L9.46966991,16.0303301 L6.46966991,13.0303301 C6.1767767,12.7374369 6.1767767,12.2625631 6.46966991,11.9696699 C6.73593648,11.7034034 7.15260016,11.6791973 7.44621165,11.8970518 L7.53033009,11.9696699 L10,14.4393398 L16.4696699,7.96966991 L10,14.4393398 Z" id="🎨Color"></path>
    </g>
</g>
</svg>`


const uncheck_svg_icon = `<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<!-- Uploaded to SVGRepo https://www.svgrepo.com -->
<title>ic_fluent_checkbox_unchecked_24_regular</title>
<desc>Created with Sketch.</desc>
<g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
    <g id="ic_fluent_checkbox_unchecked_24_regular" fill="#212121" fill-rule="nonzero">
        <path d="M5.75,3 L18.25,3 C19.7687831,3 21,4.23121694 21,5.75 L21,18.25 C21,19.7687831 19.7687831,21 18.25,21 L5.75,21 C4.23121694,21 3,19.7687831 3,18.25 L3,5.75 C3,4.23121694 4.23121694,3 5.75,3 Z M5.75,4.5 C5.05964406,4.5 4.5,5.05964406 4.5,5.75 L4.5,18.25 C4.5,18.9403559 5.05964406,19.5 5.75,19.5 L18.25,19.5 C18.9403559,19.5 19.5,18.9403559 19.5,18.25 L19.5,5.75 C19.5,5.05964406 18.9403559,4.5 18.25,4.5 L5.75,4.5 Z" id="🎨Color"></path>
    </g>
</g>
</svg>`

export const svg_icons = {
  download:download_svg_icon,
  upload:upload_svg_icon,
  color: color_svg_icon,
  check:check_svg_icon,
  uncheck:uncheck_svg_icon
};

export function getQueryVariable(variable){
  let query = window.location.search.substring(1);
  let vars = query.split("&");
  for (let i = 0; i < vars.length; i++) {
      let pair = vars[i].split("=");
      if(pair[0] == variable){
          return pair[1];
      }
  }
  return undefined;
}

const accelerate_domain = 'https://hic-1256812583.cos.accelerate.myqcloud.com';
/*
ext[0] : fa
ext[1] : fai
ext[2] : cytobandURL,
ext[3] : ref url
*/
export const mm10_ext = [
  accelerate_domain + "/mouse/Mus_musculus.GRCm39.dna.primary_assembly.fa",
  accelerate_domain + "/mouse/Mus_musculus.GRCm39.dna.primary_assembly.fa.fai",
  accelerate_domain + "/mouse/mouse_cytoBand.txt",
  accelerate_domain + "/mouse/mouse_refGene.txt.gz"
]

export const mm39_ext = [
  accelerate_domain + "/mm39/mm39.fasta",
  accelerate_domain + "/mm39/mm39.fasta.fai",
  accelerate_domain + "/mm39/cytoBandIdeo.txt",
  accelerate_domain + "/mm39/refGene.txt.gz"
]

export const hg19_ext = [
  accelerate_domain + "/human/Homo_sapiens_assembly19.fasta",
  accelerate_domain + "/human/Homo_sapiens_assembly19.fasta.fai",
  accelerate_domain + "/human/human_cytoBandIdeo.txt",
  accelerate_domain + "/human/human_refGene.txt.gz"
]

export const hg38_ext = [
  accelerate_domain + "/hg38/hg38.fasta",
  accelerate_domain + "/hg38/hg38.fasta.fai",
  accelerate_domain + "/hg38/cytoBandIdeo.txt",
  accelerate_domain + "/hg38/refGene.txt.gz"
]

export var sample_map = new Map();
sample_map.set('A549', accelerate_domain + '/sample_hg38/A549.hic');
sample_map.set('K562', accelerate_domain + '/sample_hg38/K562.hic');
sample_map.set('KBM7', accelerate_domain + '/sample_hg38/KBM-7.hic');
sample_map.set('Panc1', accelerate_domain + '/sample_hg38/panc1.hic');
sample_map.set('SKNMC', accelerate_domain + '/sample_hg38/SK_N_MC.hic');
sample_map.set('GM12878', accelerate_domain + '/sample_hg38/GM12878.hic');
sample_map.set('human-sample1', accelerate_domain + '/human/4DNFI1E6NJQJ.hic');
sample_map.set('human-sample2', accelerate_domain + '/human/4DNFICSTCJQZ.hic');
sample_map.set('mouse-sample1', accelerate_domain + '/mouse/mouse.hic');



export var sample_track = new Map();
sample_track.set('tad', accelerate_domain + '/human/human_domain.txt');
sample_track.set('loop',  accelerate_domain + '/human/human_loop.txt');
sample_track.set('ab', accelerate_domain + '/human/MCF7_ab.bedGraph ');
sample_track.set('annotation', accelerate_domain + '/track/annotation/Homo_sapiens.GRCh38.94.chr.gff3.gz');
sample_track.set('wig', accelerate_domain + '/human/H3H4k20me1.bigWig');
sample_track.set('alignment','');
sample_track.set('variant', accelerate_domain + '/track/variant/nstd186.GRCh38.variant_call.vcf.gz');
sample_track.set('seg', accelerate_domain + '/track/seg/GBM-TP.seg.gz');
sample_track.set('mut','');
sample_track.set('interact', accelerate_domain + '/human/human_loop.bedpe');
sample_track.set('gwas', accelerate_domain + '/track/gwas/gwas_sample.gwas');
sample_track.set('arc','');
sample_track.set('junction','');
sample_track.set('auto', accelerate_domain + '/track/auto/case1.bed.gz');

export var sample_track_index = new Map();
sample_track_index.set('annotation', accelerate_domain + '/track/annotation/Homo_sapiens.GRCh38.94.chr.gff3.gz.tbi');
sample_track_index.set('alignment','');
sample_track_index.set('variant',  accelerate_domain + '/track/variant/nstd186.GRCh38.variant_call.vcf.gz.tbi');
sample_track_index.set('mut','');
sample_track_index.set('arc','');
sample_track_index.set('junction','');
sample_track_index.set('auto', accelerate_domain + '/track/auto/case1.bed.gz.tbi');