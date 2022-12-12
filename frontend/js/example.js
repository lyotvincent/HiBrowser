const case_one = '100010';
const case_two = '100020';
const case_three = '100030';
import {getQueryVariable, ShowBodyCover} from "./global.js"

let example_id = getQueryVariable('example');
switch(example_id){
    case case_one:
        load_case_one();
        break
    case case_two:
        load_case_two()
        break
    case case_three:
        load_case_three();
        break;
    default:
        load_case_default();
        break;
}

function loadJsonAndHtml(json_path, html_path){
    $.getJSON(json_path, async function(data){
        await restoreSessions(data);
    })
    ShowBodyCover();
    layer.open({
        type: 2,
        skin: 'ana-iframe',
        title: 'Example tutorial',
        shadeClose: true,
        maxmin:true,
        area: [ window.innerWidth * 0.8 + 'px',window.innerHeight * 0.9+ 'px'],
        shade: [0.2, '#393D49'],
        content: html_path,
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
}
async function load_case_one(){
    loadJsonAndHtml('js/config/100010.json', '100010.html')
}

function load_case_two(){
    loadJsonAndHtml('js/config/100020.json', '100020.html')
}

function load_case_three(){
    loadJsonAndHtml('js/config/100030.json', '100030.html')
}

function load_case_default(){
    console.log('do not load case');
}