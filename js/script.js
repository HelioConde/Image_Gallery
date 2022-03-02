
var dir = './img/'; // Pasta Minhas imagens

var num = '50' // Limite a mostrar
var i = -1;
let checkedBox = 0;
let scroll = 0;

window.onload = function () {
    loop()
    function loop() {
        i++;
        let img = new Image();
        img.src = './img/' + i + ".jpg";
        img.onload = function () {
            document.getElementsByClassName('boxSelect')[0].innerHTML += "<div><input name='Imagem " + i + "' class='checkBox' type='checkbox' onchange='selecionar(" + i + ")'><img onmouseup='select(" + i + ")' class='img" + i + "' src='./img/" + i + ".jpg'/></div>";
            loop();
        }
        img.onerror = function () {
            return;
        }
    }
}

function select(e) {
    document.getElementsByClassName('boxView')[0].innerHTML = "<img id='img" + e + "' src='" + dir + e + ".jpg'/>"
    document.getElementById('view').innerHTML = "<div onmouseup='closed()'><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 512'><!--! Font Awesome Pro 6.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d='M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z'/></svg></div><img id='img" + e + "' src='" + dir + e + ".jpg'/>"
}

function selecionar(e) {
    document.getElementById('result').innerHTML = document.querySelectorAll("[class='checkBox']:checked").length + " Imagens selecionadas";
}
function scrollChage(valor) {
    var sc = document.getElementsByClassName("boxSelect")[0];
    let scLog = '';
    let scroll = '';
    if (valor == 'left') {
        scroll = 200;
        scLog = sc.scrollLeft = sc.scrollLeft + scroll;

        if (scLog > document.getElementsByClassName("boxSelect")[0].scrollLeft) {
            scroll = scroll - 200;
        }
    } else {
        scroll = 200;
        scLog = sc.scrollLeft = sc.scrollLeft - scroll;
        if (scLog < document.getElementsByClassName("boxSelect")[0].scrollLeft) {
            scroll = scroll + 200;
        }
    }
}

function viewImg() {
    document.getElementById('view').style.display = "block";
}

function closed() {
    document.getElementById('view').style.display = "none";
}