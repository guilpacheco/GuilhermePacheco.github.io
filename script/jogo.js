var tela = document.querySelector('canvas');
var pincel = tela.getContext('2d');

var corJogador1 = "#FF973D";
var corCabeca1 = "#d17127";
var corJogador2 = "#B76CF0";
var corCabeca2 = "#7c38b1";
var corRastro = "#B86242";

var jogador1 = {
    px: 300,
    py: 360,
    tx: 12,
    ty: 12,
    vx: 4,
    vy: 0
};

var jogador2 = {
    px: 980,
    py: 360,
    tx: 12,
    ty: 12,
    vx: -4,
    vy: 0
};

var rastro1 = [];
var rastro2 = [];

var estadoJogo = "menu";
var jogando = false;

var pts1 = 0;
var pts2 = 0;


var score1 = { px: 530, py: 62 };
var score2 = { px: 700, py: 62 };

var contextoAudio = null;
var volumeGeral = 0.4;
var ganhoGeral = null;
var intervaloMusica = null;
var notaMusica = 0;

var estadoAnterior = "menu";
var jogandoAnterior = false;

function prepararAudio() {
    if (!contextoAudio) {
        contextoAudio = new (
            window.AudioContext || window.webkitAudioContext
        )();

        ganhoGeral = contextoAudio.createGain();
        ganhoGeral.gain.value = volumeGeral;
        ganhoGeral.connect(contextoAudio.destination);
    }

    if (contextoAudio.state === "suspended") {
        contextoAudio.resume();
    }
}

function tocarNota(frequencia, duracao, tipo = "square", volume = 0.2) {
    prepararAudio();

    var oscilador = contextoAudio.createOscillator();
    var ganho = contextoAudio.createGain();

    oscilador.type = tipo;
    oscilador.frequency.value = frequencia;

    ganho.gain.setValueAtTime(volume, contextoAudio.currentTime);
    ganho.gain.exponentialRampToValueAtTime(
        0.001,
        contextoAudio.currentTime + duracao
    );

    oscilador.connect(ganho);
    ganho.connect(ganhoGeral);

    oscilador.start();
    oscilador.stop(contextoAudio.currentTime + duracao);
}


function tocarSom(tipo) {
    if (tipo === "menu") {
        tocarNota(660, 0.08);
    }

    if (tipo === "movimento") {
        tocarNota(220, 0.035, "square", 0.08);
    }

    if (tipo === "colisao") {
        tocarNota(110, 0.25, "sawtooth", 0.25);
    }

    if (tipo === "vitoria") {
        tocarNota(523, 0.12);
        setTimeout(() => tocarNota(659, 0.12), 130);
        setTimeout(() => tocarNota(784, 0.25), 260);
    }
}


function iniciarMusica() {
    prepararAudio();

    if (intervaloMusica !== null) return;

    var notas = [
        262, 330, 392, 330,
        294, 349, 440, 349,
        262, 330, 392, 523,
        440, 392, 330, 294
    ];

    notaMusica = 0;

    intervaloMusica = setInterval(function () {
        tocarNota(notas[notaMusica], 0.13, "square", 0.07);

        notaMusica = (notaMusica + 1) % notas.length;
    }, 180);
}

function pararMusica() {
    clearInterval(intervaloMusica);
    intervaloMusica = null;
    pararMusica();
}


var controleVolume = document.getElementById("volumeGeral");
var textoVolume = document.getElementById("valorVolume");

controleVolume.addEventListener("input", function () {
    volumeGeral = Number(this.value) / 100;

    textoVolume.textContent = this.value + "%";

    if (ganhoGeral) {
        ganhoGeral.gain.setTargetAtTime(
            volumeGeral,
            contextoAudio.currentTime,
            0.02
        );
    }
});


function desenhaAtariArena() {
    pincel.fillStyle = corRastro;
    pincel.fillRect(80, 100, 1120, 16);
    pincel.fillRect(80, 126, 1120, 10);
    pincel.fillRect(80, 604, 1120, 10);
    pincel.fillRect(80, 620, 1120, 16);

    for (let y = 146; y < 604; y += 22) {
        pincel.fillRect(80, y, 14, 12);
        pincel.fillRect(1186, y, 14, 12);
    }
}


function desenhaMenu() {
    pincel.clearRect(0, 0, 1280, 720);


    pincel.fillStyle = "#000000";
    pincel.fillRect(0, 0, 1280, 720);

    desenhaAtariArena();


    pincel.textAlign = "center";
    pincel.fillStyle = "#FFFFFF";
    pincel.font = "48px 'Press Start 2P', monospace";
    pincel.fillText("SURROUND", 640, 245);


    pincel.fillStyle = corRastro;
    pincel.font = "14px 'Press Start 2P', monospace";
    pincel.fillText("ATARI ARCADE GAME", 640, 290);


    pincel.font = "12px 'Press Start 2P', monospace";

    pincel.fillStyle = corJogador1;
    pincel.fillText("JOGADOR 1", 380, 355);
    pincel.fillText("W A S D", 380, 390);

    pincel.fillStyle = corJogador2;
    pincel.fillText("JOGADOR 2", 900, 355);
    pincel.fillText("SETAS", 900, 390);


    pincel.fillStyle = corRastro;
    pincel.fillRect(450, 435, 380, 66);

    pincel.fillStyle = "#FFFFFF";
    pincel.fillRect(458, 443, 364, 50);

    pincel.fillStyle = "#000000";
    pincel.font = "16px 'Press Start 2P', monospace";
    pincel.fillText("JOGAR", 640, 475);


    pincel.fillStyle = "#FFFFFF";
    pincel.font = "10px 'Press Start 2P', monospace";
    pincel.fillText("PRIMEIRO A 5 PONTOS VENCE", 640, 555);

    pincel.textAlign = "left";
}



function desenha() {
    desenhaAtariArena();

    pincel.fillStyle = corJogador1;
    for (let i = 0; i < rastro1.length; i++) {
        pincel.fillRect(
            rastro1[i].x,
            rastro1[i].y,
            jogador1.tx,
            jogador1.ty
        );
    }

    pincel.fillStyle = corJogador2;
    for (let i = 0; i < rastro2.length; i++) {
        pincel.fillRect(
            rastro2[i].x,
            rastro2[i].y,
            jogador2.tx,
            jogador2.ty
        );
    }

    pincel.fillStyle = corCabeca1;
    pincel.fillRect(
        jogador1.px,
        jogador1.py,
        jogador1.tx,
        jogador1.ty
    );

    pincel.fillStyle = corCabeca2;
    pincel.fillRect(
        jogador2.px,
        jogador2.py,
        jogador2.tx,
        jogador2.ty
    );

    pincel.font = "24px 'Press Start 2P', monospace";

    pincel.fillStyle = corJogador1;
    pincel.fillText(pts1, score1.px, score1.py);

    pincel.fillStyle = corJogador2;
    pincel.fillText(pts2, score2.px, score2.py);
}


function MovePlayer() {
    rastro1.push({ x: jogador1.px, y: jogador1.py });
    rastro2.push({ x: jogador2.px, y: jogador2.py });

    jogador1.px += jogador1.vx;
    jogador1.py += jogador1.vy;

    jogador2.px += jogador2.vx;
    jogador2.py += jogador2.vy;
}

function colisoes() {

    if (colide(jogador1, jogador2)) {
        reiniciarRodada();
        return;
    }

    var minX = 94;
    var maxX = 1186 - jogador1.tx;
    var minY = 142;
    var maxY = 604 - jogador1.ty;

    if (jogador1.px < minX || jogador1.px > maxX || jogador1.py < minY || jogador1.py > maxY) {
        pts2++;
        reiniciarRodada();
        return;
    }

    if (jogador2.px < minX || jogador2.px > maxX || jogador2.py < minY || jogador2.py > maxY) {
        pts1++;
        reiniciarRodada();
        return;
    }

    for (let i = 0; i < rastro1.length - 5; i++) {
        if (colide(jogador1, rastro1[i])) {
            pts2++;
            reiniciarRodada();
            return;
        }
    }
    for (let i = 0; i < rastro2.length; i++) {
        if (colide(jogador1, rastro2[i])) {
            pts2++;
            reiniciarRodada();
            return;
        }
    }

    for (let i = 0; i < rastro1.length; i++) {
        if (colide(jogador2, rastro1[i])) {
            pts1++;
            reiniciarRodada();
            return;
        }
    }
    for (let i = 0; i < rastro2.length - 5; i++) {
        if (colide(jogador2, rastro2[i])) {
            pts1++;
            reiniciarRodada();
            return;
        }
    }
}

function colide(a, b) {
    if (!b) return false;
    let larguraB = b.tx !== undefined ? b.tx : jogador1.tx;
    let alturaB = b.ty !== undefined ? b.ty : jogador1.ty;
    let posX = b.x !== undefined ? b.x : b.px;
    let posY = b.y !== undefined ? b.y : b.py;

    return a.px < posX + larguraB &&
           a.px + a.tx > posX &&
           a.py < posY + alturaB &&
           a.py + a.ty > posY;
}

function reiniciarRodada() {
    jogador1.px = 300;
    jogador1.py = 360;
    jogador1.vx = 4;
    jogador1.vy = 0;

    jogador2.px = 980;
    jogador2.py = 360;
    jogador2.vx = -4;
    jogador2.vy = 0;

    rastro1 = [];
    rastro2 = [];

    if (pts1 >= 5 || pts2 >= 5) {
        jogando = false;
    }
}


function GameOver() {
    pincel.clearRect(0, 0, 1280, 720);

    pincel.fillStyle = "#000000";
    pincel.fillRect(0, 0, 1280, 720);

    desenhaAtariArena();

    pincel.textAlign = "center";

    pincel.fillStyle = "#FFFFFF";
    pincel.font = "28px 'Press Start 2P', monospace";
    pincel.fillText("FIM DE JOGO", 640, 245);

    var vencedor = pts1 >= 5 ? "JOGADOR 1" : "JOGADOR 2";
    var corVencedor = pts1 >= 5 ? corJogador1 : corJogador2;

    pincel.fillStyle = corVencedor;
    pincel.font = "20px 'Press Start 2P', monospace";
    pincel.fillText(vencedor, 640, 305);

    pincel.fillStyle = "#FFFFFF";
    pincel.font = "14px 'Press Start 2P', monospace";
    pincel.fillText("VENCEU!", 640, 345);

    pincel.fillStyle = corJogador1;
    pincel.fillText("J1: " + pts1, 470, 405);

    pincel.fillStyle = corJogador2;
    pincel.fillText("J2: " + pts2, 810, 405);

    pincel.fillStyle = corRastro;
    pincel.fillRect(245, 455, 360, 62);

    pincel.fillStyle = "#FFFFFF";
    pincel.fillRect(253, 463, 344, 46);

    pincel.fillStyle = "#000000";
    pincel.font = "11px 'Press Start 2P', monospace";
    pincel.fillText("JOGAR NOVAMENTE", 425, 491);

    pincel.fillStyle = corRastro;
    pincel.fillRect(675, 455, 360, 62);

    pincel.fillStyle = "#FFFFFF";
    pincel.fillRect(683, 463, 344, 46);

    pincel.fillStyle = "#000000";
    pincel.font = "12px 'Press Start 2P', monospace";
    pincel.fillText("MENU", 855, 491);

    pincel.fillStyle = "#FFFFFF";
    pincel.font = "10px 'Press Start 2P', monospace";
    pincel.fillText("APERTE ESPACO PARA JOGAR NOVAMENTE", 640, 565);

    pincel.textAlign = "left";
}




function desenhaHistoria() {
    pincel.fillStyle = "#000000";
    pincel.fillRect(0, 0, 1280, 720);

    desenhaAtariArena();

    pincel.textAlign = "center";

    pincel.fillStyle = corJogador1;
    pincel.font = "20px 'Press Start 2P', monospace";
    pincel.fillText("A HISTORIA DO SURROUND", 640, 130);

    pincel.font = "9px 'Press Start 2P', monospace";
    pincel.fillStyle = "#FFFFFF";

    pincel.fillText("LANCADO EM 1977 PELA ATARI, NOS ESTADOS UNIDOS.", 640, 170);
    pincel.fillText("PROGRAMADO POR ALAN MILLER, EM SEU PRIMEIRO", 640, 193);
    pincel.fillText("PROJETO DE JOGO PARA O CONSOLE ATARI VCS.", 640, 216);

    pincel.fillStyle = corJogador2;
    pincel.fillText("ONDE ERA POSSIVEL JOGAR?", 640, 250);

    pincel.fillStyle = "#FFFFFF";
    pincel.fillText("EM CASA, NA TV, USANDO O ATARI VCS E SEUS", 640, 273);
    pincel.fillText("CONTROLES. TAMBEM CHEGOU EM CARTUCHOS", 640, 296);
    pincel.fillText("E VERSOES PARA OUTROS SISTEMAS AO LONGO DOS ANOS.", 640, 319);

    pincel.fillStyle = corJogador1;
    pincel.fillText("QUANDO GANHOU FAMA?", 640, 353);

    pincel.fillStyle = "#FFFFFF";
    pincel.fillText("NO FIM DOS ANOS 70, COM A PRIMEIRA ERA DOS", 640, 376);
    pincel.fillText("CONSOLES DOMESTICOS. A DISPUTA DE RASTROS", 640, 399);
    pincel.fillText("E A ESTRATEGIA SIMPLES MARCARAM UMA GERACAO.", 640, 422);

    pincel.fillStyle = corJogador2;
    pincel.fillText("E NO BRASIL?", 640, 456);

    pincel.fillStyle = "#FFFFFF";
    pincel.fillText("CIRCULOU EM VERSOES NAO OFICIAIS, COM NOMES", 640, 479);
    pincel.fillText("COMO CORRE CORRE E ARMADILHA.", 640, 412);

    pincel.fillStyle = corJogador1;
    pincel.font = "10px 'Press Start 2P', monospace";
    pincel.fillText("O SIMPLES ERA INCRIVELMENTE MAGICO", 640, 550);

    pincel.textAlign = "left";
}




function Main() {

     if (estadoJogo === "historia") {
        desenhaHistoria();
        return;
    }

    if (estadoJogo === "menu") {
        desenhaMenu();
        return;
    }
    

    if (jogando) {
        pincel.clearRect(0, 0, 1280, 720);

        MovePlayer();
        colisoes();

        if (jogando) {
            desenha();
        } else {
            GameOver();
        }
    } else {
        GameOver();
    }
}

function iniciarPartida() {
    pts1 = 0;
    pts2 = 0;

    reiniciarRodada();

    jogando = true;
    estadoJogo = "jogo";
}

function voltarMenu() {
    jogando = false;
    estadoJogo = "menu";

    pts1 = 0;
    pts2 = 0;

    reiniciarRodada();
}


tela.addEventListener("click", function(e) {
    var rect = tela.getBoundingClientRect();

    var x = (e.clientX - rect.left) * tela.width / rect.width;
    var y = (e.clientY - rect.top) * tela.height / rect.height;

    if (estadoJogo === "menu") {
        if (x >= 450 && x <= 830 &&
            y >= 435 && y <= 501) {
            iniciarPartida();
            tocarSom("menu");
        }
        return;
    }

    if (!jogando) {
        // Jogar novamente
        if (x >= 245 && x <= 605 &&
            y >= 455 && y <= 517) {
            iniciarPartida();
            tocarSom("menu");
        }

        else if (x >= 675 && x <= 1035 &&
                 y >= 455 && y <= 517) {
            voltarMenu();
            tocarSom("menu");
            
        }
    }

    prepararAudio();
iniciarMusica();

});


var musicaFundo = document.getElementById("musicaFundo");

function iniciarMusicaFundo() {
    if (!musicaFundo) return;

    musicaFundo.volume = volumeGeral;
    musicaFundo.play().catch(function (erro) {
        console.log("Clique no jogo para iniciar o áudio.");
    });
}

function pararMusicaFundo() {
    if (!musicaFundo) return;

    musicaFundo.pause();
}

setInterval(Main, 30);


document.addEventListener("keydown", function(e) {

    
    if (e.key === "Escape") {
        e.preventDefault();

        if (estadoJogo === "historia") {
            estadoJogo = estadoAnterior;
            jogando = jogandoAnterior;
        } else {
            estadoAnterior = estadoJogo;
            jogandoAnterior = jogando;

            estadoJogo = "historia";
            jogando = false;
        }

        return;
    }

    if (estadoJogo === "menu") {
        if (e.code === "Space" || e.code === "Enter") {
            iniciarPartida();
        }
        return;
    }

    if (!jogando) {
        if (e.code === "Space") {
            iniciarPartida();
        }
        return;
    }


    if (e.code.startsWith("Arrow") || e.code === "Space") {
        e.preventDefault();
    }

    if (
    jogando &&
    ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"]
        .includes(e.key.toLowerCase())
) {
    tocarSom("movimento");
}

    if (e.keyCode === 87 && jogador1.vy === 0) { jogador1.vx = 0; jogador1.vy = -4; }
    else if (e.keyCode === 83 && jogador1.vy === 0) { jogador1.vx = 0; jogador1.vy = 4; }
    else if (e.keyCode === 65 && jogador1.vx === 0) { jogador1.vx = -4; jogador1.vy = 0; }
    else if (e.keyCode === 68 && jogador1.vx === 0) { jogador1.vx = 4; jogador1.vy = 0; }

    if (e.keyCode === 38 && jogador2.vy === 0) { jogador2.vx = 0; jogador2.vy = -4; }
    else if (e.keyCode === 40 && jogador2.vy === 0) { jogador2.vx = 0; jogador2.vy = 4; }
    else if (e.keyCode === 37 && jogador2.vx === 0) { jogador2.vx = -4; jogador2.vy = 0; }
    else if (e.keyCode === 39 && jogador2.vx === 0) { jogador2.vx = 4; jogador2.vy = 0; }
});