let ids = undefined;
let pos = undefined;
let lis = undefined;
let pre = 0;

function getSections(){
    return $('section[id]').map(function() { return this.id;}).get();
}

function getPos(ids){
    let pos = [];
    for(let i = 0; i < ids.length; i ++){
        let id = ids[i];
        let top = $(`#${id}`).offset().top;
        pos.push(top);
    }
    return pos;
}

function checkIndex(val){
    if(pos === undefined) pos = getPos(ids);
    let i = 0;
    for(; i < pos.length; i ++){
        if(pos[i] > val){
            break;
        }
    }
    if(i === 0) return 0;
    return i - 1;
}

function showMenu(idx){
    let li = $(lis[idx]);
    li.addClass('active');
    li.siblings().removeClass('active');
}

$(document).ready(function(){
    lis = $('.bs-docs-sidenav li');
    ids = getSections();
    $(window).scroll( function() {
        let w = window.innerWidth;
        if(w <= 1000) return;
        let scrolled_val = $(document).scrollTop().valueOf() + 200;
        let left = checkIndex(scrolled_val);
        if(left !== pre){
            pre = left;
            showMenu(left);  
        }
    });
    $(window).resize( ()=>{
        pos = undefined;
    });
})

