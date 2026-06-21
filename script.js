let posY = 300;
const onibus = document.getElementById("onibus");
const alerta = document.getElementById("alerta");

function moverOnibus() {
  posY -= 5;
  onibus.style.top = posY + "px";

  if (posY <= 160) {
    alerta.innerText = "🚨 Ônibus chegando ao ponto!";
  }
  if (posY <= 140) {
    alerta.innerText = "✅ Ônibus chegou!";
    clearInterval(intervalo);
  }
}

const intervalo = setInterval(moverOnibus, 500);
