import {table_header, parseLocus} from "../global.js"
import {api_url} from '../setting.js'


// 全局的table data
let table_data = undefined;

class Table_bs {
  constructor($box) {
    let _init_bit = false;
    let _box = $box;

    this.init = function () {
      _box.addClass('table-responsive');
      let html = '';
      html += '<table class="table table-bordered " style="text-align: center; ">';
      html += '<thead>';
      html += '</thead>';
      html += '<tbody>';
      html += '</tbody>';
      html += '</table>';
      _box.append($(html));
      _init_bit = true;
    };
    this.load = function (option) {

      if (!_init_bit) {
        this.init();
      }

      // 表头
      let thead = option.colNames;

      let html_thead = '';
      html_thead += '<tr>';
      for (let i = 0; i < thead.length; i++) {
        html_thead += `<td title="${thead[i]}">${thead[i]}</td>`;
      }
      html_thead += '</tr>';

      _box.find('thead').append($(html_thead));

      // 表身
      let tbody = option.data;
      let html_tbody = '';
      for (let i = 0; i < tbody.length; i++) {
        let buff = tbody[i];
        html_tbody += '<tr>';
        for (let j = 0; j < option.colNames.length; j++) {
          let v = buff[option.colNames[j]];
          if (v === undefined || v === '') {
            html_tbody += `<td></td>`;
          }
          else {
            if (option.colNames[j] === 'id') {
              html_tbody += `<td><a href="https://www.ncbi.nlm.nih.gov/gene/?term=${v}" target="_blank"><i class="fa fa-external-link"></i> ${v}</a></td>`;
            }
            else if (option.colNames[j] === 'locus') {
              html_tbody += `
              <td>
                <button 
                    type="button" 
                    class="search_goto_button" 
                    data-toggle="tooltip" 
                    data-placement="top" 
                    title = "${v}" 
                    onclick="goto(${i})">
                  <i class="fa fa-hand-o-right"></i>
                </button>
              </td>`;
            }
            else if (option.colNames[j] === 'strand') {
              html_tbody += `<td data-toggle="tooltip" data-placement="top" title = "${v}">${v}</td>`;
            }
            else {
              html_tbody += `<td data-toggle="tooltip" data-placement="top" title = "${v}" onclick="ShowDetails('${option.colNames[j]}',${i})">${v}</td>`;
            }
          }
        }
        html_tbody += '</tr>';
      }
      _box.find('tbody').append($(html_tbody));
    };
  }
}

function write_table(){
  $('#result-table').children().remove();
  let t = new Table_bs($('#result-table'));
  let option = {
    colNames: table_header,
    data:table_data
  };
  t.load(option);
}

$('#search-btn').on('click',function(e){
  let val = document.getElementById('search-input').value;
  val = val.trim();
  let search_type = document.querySelector('.text01').value;
  if(search_type === "") {
    layer.msg('please select the type');
    return
  }
  if(val === ""){
    layer.msg('please input search val');
    return
  }
  if(search_type === 'Locus'){
    // valid search-input
    let bak = val.split(' ');
    let [chrx,xs,xe] = parseLocus(bak[0]);
    // console.log(xs,xe)

    if(xe - xs < 4999){
      layer.msg('Invalid Input: Too short interval. Minimun range is 5,000(5kb ~ as the min size of resolution can be viewed in the browser!)');
      return;
    }
    if(xe - xs >= 5 *1e6){
      layer.msg('Invalid Input: Too long interva. Maximun range is 5,000,000(5Mb ~ as the twice of max size of a TAD reported by previous work!)');
      return;
    }
  }
  let loading = layer.load(1, {
    shade: [0.5,'#fff'] 
  });
  $.ajax({
    type: "post",
    url:api_url + '/query',
    dataType: 'json',
    data: JSON.stringify({'type':search_type,'val': val}),
    contentType: 'application/json',
    success: function(data){
      // console.log(data)
      table_data = data.data
      layer.close(loading);
      if (search_type == 'Gene'){
        document.querySelector('.show-arcs').classList.add('hidden');
      }else{
        document.querySelector('.show-arcs').classList.remove('hidden');
      }
      write_table();

    },
    error: function(err){
      layer.close(loading);
      console.log(err);
    }
  })
})


function get_gene_variant(gene){
  let v_info;
  $.ajax({
    type: "post",
    url:api_url + '/genev',
    dataType: 'json',
    async:false,
    data: JSON.stringify({'gene':gene}),
    contentType: 'application/json',
    success: function(data){
      v_info = data.data.variants;
    },
    error: function(err){
      console.log(err);
    }
  })
  return v_info;
}

function generate_pop_html(title, idx){
  idx = parseInt(idx)
  let data = table_data[idx][title]
  data = data.split(',')
  let _html = `<div class="res_list">`
  if(title === 'diseases'){
    for (let d of data){
      _html += `
      <div class = "res_item">
        <span title='${d}'>${d}</span>
      </div>`
    }
  }else if (title === 'name'){
    alert('Loading gene associated Variants, please wait about 2 seconds!');
    let gene_variant = get_gene_variant(data)[0];
    for(let rs of gene_variant){
      _html += `
        <div class = "res_item">
          <a title='${rs}' href = 'https://www.ncbi.nlm.nih.gov/snp/${rs}' target='_blank'>${rs}</a>
        </div>`
    }
  }
  else{
    for (let d of data){
      _html += `
      <div class = "res_item">
        <span title = '${d}'>${d}</span>
        <div class="goto" title = "view this Locus in browser" onclick="goto1('${d}','${title}')"><i class="fa fa-level-up"></i></div>
        <div class="goto" title = "view the contact of this and origin gene in browser" onclick="goto2(${idx}, '${d}','${title}')"><i class="fa fa-code-fork"></i></div>
      </div>`
    }
  }

  _html += `</div>`
  return _html
}

window.ShowDetails = function(title, idx){
  let _html = generate_pop_html(title, idx);
  layer.open({
    type: 1,
    title: title,
    skin: 'pop-class', //加上边框
    area: ['420px', '240px'], //宽高
    content: _html
  });
  $(this).blur();
}

window.goto = function(idx){
  let data = table_data[idx];
  let locus = data['locus'];
  // let [base_chr, base_s, base_e] = parseLocus(locus);
  let loci = [locus];
  let names = [data['name']];

  for(let key of ['TF', 'enhancer', 'promoter', 'super_enhancer', 'target']){
    let key_data = data[key].split(',');
    for(let o of key_data){
      if(o == '' || o.length == 0) continue
      let to = removeBrack(o);
      //let [to_chr, to_s, to_e] = parseLocus(to);
      //if(to_chr != base_chr) continue;
      loci.push(to);
      names.push(`[${key}]${o}`)
    }
  }
  parent.drawCanvas3(loci, names);
  let index = parent.layer.getFrameIndex(window.name); //先得到当前iframe层的索引
  parent.layer.min(index);
}



function removeBrack(str){
  let index = str.indexOf("(");
  if(index == -1) return str;
  let index2 = str.indexOf(")");
  return str.substring(index + 1, index2)
}

/*
传1个坐标： 画一个点
传2个坐标： 画一个框， 或者 一个弧线
传2个及以上个坐标： 画弧线

*/
window.goto1 = function(locus, title){
  locus = removeBrack(locus)
  parent.drawCanvas1([locus],[title]);
  let index = parent.layer.getFrameIndex(window.name); //先得到当前iframe层的索引
  parent.layer.min(index);
}

window.goto2 = function(idx, locus2,title){
  let locus1 = table_data[idx]['locus']
  locus2 = removeBrack(locus2)
  parent.drawCanvas2([locus1,locus2],[table_data[idx]['name'],locus2, title])
  let index = parent.layer.getFrameIndex(window.name); //先得到当前iframe层的索引
  parent.layer.min(index);
}


function createBedpe(){
  let s = 'chr1\tx1\tx2\tchr2\t\y1\ty2\tname\n';
  for(let idx = 0; idx < table_data.length; idx ++){
    let _data = table_data[idx];
    let cREs1 = _data['name'];
    let [base_chr, base_s, base_e] = parseLocus(_data['locus']);
    for(let key of ['TF', 'enhancer', 'promoter', 'super_enhancer', 'target']){
      let key_data = _data[key].split(',');
      for(let o of key_data){
        if(o == '' || o.length == 0) continue
        let to = removeBrack(o);
        let [to_chr, to_s, to_e] = parseLocus(to);
        s += `${base_chr}\t${base_s}\t${base_s + 1000}\t${to_chr}\t${to_s}\t${to_s + 1000}\t${cREs1}-[${key}]${o}\t1\n`;
      }
    }
  }
  let blob = new Blob([s]);
  let url = window.URL.createObjectURL(blob);
  // console.log(url);
  return [url, table_data[0]['locus']];
}

window.ShowArcs = function(){
  let _id = parent.getSelectId();
  let [_, live_igv_browser] =  parent.getAllBrowser();
  // console.log(live_igv_browser)
  if(!live_igv_browser.has(_id)){
    alert('No Gene Browser Loaded!'); 
    return;
  }
  let [url, base_locus] = createBedpe();
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
  
  let b = live_igv_browser.get(_id);
  b.removeTrackByName('all_interact');
  b.loadTrackList([config]);
  parent.browser_goto_locus(base_locus);
  let index = parent.layer.getFrameIndex(window.name); //先得到当前iframe层的索引
  parent.layer.min(index);
  parent.RemoveBodyOverflow();
}

window.ShowROI = function(){
  let locus = document.querySelector('#search-input').value;
  if(locus == undefined || locus == ''){
    alert('No Locus Input');
    return;
  }
  let _id = parent.getSelectId();
  let [_, live_igv_browser] =  parent.getAllBrowser();
  // console.log(live_igv_browser)
  if(!live_igv_browser.has(_id)){
    alert('No Gene Browser Loaded!'); 
    return;
  }
  let [chr, s, e] = parseLocus(locus);
  let b = live_igv_browser.get(_id);
  let features = [
    {
      chr:`chr${chr}`,
      start: s - 5000,
      end: e + 5000,
      name: `${chr}:${s}-${e}`
    }
  ]
  b.loadROI([
    {
      name:  `${chr}:${s}-${e}`,
      features: features,
      indexed: false,
      color: "rgba(184, 166, 255, 0.44)",
      // isUserDefined:true
    }
  ]);
  parent.browser_goto_locus(locus);
  alert('success');
}