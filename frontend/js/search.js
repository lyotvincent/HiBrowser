import {api_url,table_header, parseLocus} from "./global.js"


function get_gene_locus_by_name(name){
  let locus = '';
  $.ajax({
    type: "post",
    url:api_url + '/getGeneLocus',
    dataType: 'json',
    data: JSON.stringify({'name':name}),
    contentType: 'application/json',
    async:false, // 同步
    success: function(res){
      locus = res.data
    },
    error: function(err){
      console.log(err);
    }
  })
  return locus;
}

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
              html_tbody += `<td>
            <button type="button" class="search_goto_button" data-toggle="tooltip" data-placement="top" title = "${v}" onclick="goto1('${buff['name']}', '${buff['locus']}')"><i class="fa fa-hand-o-right"></i></button>
            </td>`;
            }
            else if (option.colNames[j] === 'name' || option.colNames[j] === 'strand') {
              html_tbody += `<td data-toggle="tooltip" data-placement="top" title = "${v}">${v}</td>`;
            }
            else {
              html_tbody += `<td data-toggle="tooltip" data-placement="top" title = "${v}" onclick="ShowDetails(this,'${option.colNames[j]}','${buff['name']}' ,'${buff['locus']}')">${v}</td>`;
            }
          }
        }
        html_tbody += '</tr>';
      }
      _box.find('tbody').append($(html_tbody));
    };
  }
}

function write_table(res){
  $('#result-table').children().remove();
  let t = new Table_bs($('#result-table'));
  let option = {
    colNames: table_header,
    data:res.data
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
      layer.close(loading);
      write_table(data);
    },
    error: function(err){
      layer.close(loading);
      console.log(err);
    }
  })
})


function generate_pop_html(data, title, name, locus){
  data = data.split(',');
  let _html = `<div class="res_list">`
  if(title === 'enhancer' || title === 'super_enhancer' || title === 'promoter'){
    for (let d of data){
      _html += `
      <div class = "res_item">
        <span>${d}</span>
        <div class="goto" title = "view this gene in browser" onclick="goto1('${name}','${d}')"><i class="fa fa-level-up"></i></div>
        <div class="goto" title = "view the contact of this and origin gene in browser" onclick="goto2('${name}','${d}','${locus}')"><i class="fa fa-code-fork"></i></div>
      </div>`
    }
  }
  else if(title === 'TF' || title === 'target'){
    for (let d of data){
      _html += `
      <div class = "res_item">
        <span>${d}</span>
        <div class="goto" title = "view this gene in browser" onclick="goto1('${name}','${d}')"><i class="fa fa-level-up"></i></div>
        <div class="goto" title = "view the contact of this and origin gene in browser" onclick="goto2('${name}','${d}','${locus}')"><i class="fa fa-code-fork"></i></div>
      </div>`
    }
  }
  // disease
  else{
    for (let d of data){
      _html += `
      <div class = "res_item">
        <span>${d}</span>
      </div>`
    }
  }
  
  
  
  _html += `</div>`
  return _html
}

window.ShowDetails = function(that, title, name, locus){
  let data = $(that).attr('title')
  let _html = generate_pop_html(data, title, name, locus)
  layer.open({
    type: 1,
    title: title,
    skin: 'pop-class', //加上边框
    area: ['420px', '240px'], //宽高
    content: _html
  });
  $(that).blur();
}


window.goto1 = function(name, locus){
  let loading = layer.load(1, {
    shade: [0.5,'#fff'] 
  });
  // locus可能是基因
  // 判断是基因还是locus
  if(locus.lastIndexOf(':') === -1){
    // 先根据基因查询坐标
    let suff = locus.indexOf('(');
    locus = locus.substring(0, suff);
    locus = get_gene_locus_by_name(locus);
    if(locus === ''){
      layer.msg('No such Gene')
      layer.close(loading);
      return
    }
  }
  // 前往地址
  parent.drawCanvas([locus],[name]);
  layer.close(loading);
  let index = parent.layer.getFrameIndex(window.name); //先得到当前iframe层的索引
  parent.layer.min(index);
}

window.goto2 = function(name1, locus1, locus2){
  let name2= locus2;
  let loading = layer.load(1, {
    shade: [0.5,'#fff'] 
  });
  if(locus1.lastIndexOf(':') === -1){
    // 先根据基因查询坐标
    let suff = locus1.indexOf('(');
    locus1 = locus1.substring(0, suff);
    locus1 = get_gene_locus_by_name(locus1);
    if(locus1 === ''){
      layer.msg('No such Gene')
      layer.close(loading);
      return
    }
  }
  // locus2 一定是地址
  parent.drawCanvas([locus1,locus2],[name1,name2])
  layer.close(loading);
  let index = parent.layer.getFrameIndex(window.name); //先得到当前iframe层的索引
  parent.layer.min(index);
}


