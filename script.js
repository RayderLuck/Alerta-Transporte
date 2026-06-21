// posição inicial do ônibus
let posY = 300;

// pega elementos da página
const onibus = document.getElementById("onibus");
const alerta = document.getElementById("alerta");

let intervalo = null; // controla o loop

function moverOnibus() {
  posY -= 5; // move o ônibus para cima
  onibus.style.top = posY + "px";

  // alerta quando está chegando
  if (posY <= 160 && posY > 140) {
    alerta.innerText = "🚨 Ônibus chegando ao ponto!";
  }

  // alerta quando chegou
  if (posY <= 140) {
    alerta.innerText = "✅ Ônibus chegou!";
    clearInterval(intervalo); // para o movimento
    intervalo = null;
  }
}

// inicia o movimento do ônibus
function iniciarOnibus() {
  // resetar posição e alerta
  posY = 300;
  onibus.style.top = posY + "px";
  alerta.innerText = "";

  // se já tiver intervalo rodando, limpa antes
  if (intervalo) {
    clearInterval(intervalo);
  }

  // inicia novo intervalo
  intervalo = setInterval(moverOnibus, 500);
}

// botão para reiniciar simulação
document.getElementById("btnIniciar").addEventListener("click", iniciarOnibus);
