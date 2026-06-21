const map = L.map('map').setView([-22.880, -42.018], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// horários detalhados por linha e ponto
const horarios = {
  "cabo-arraial": {
    "Rodoviária": ["08:00", "10:30", "13:00"],
    "Centro": ["08:10", "10:40", "13:10"],
    "Praia do Forte": ["08:20", "10:50", "13:20"]
  },
  "cabo-buzios": {
    "Rodoviária": ["09:00", "11:30", "14:00"],
    "Shopping Park Lagos": ["09:15", "11:45", "14:15"]
  },
  "cabo-tangara": {
    "Rodoviária": ["07:30", "12:00", "17:00"],
    "Tangará": ["07:50", "12:20", "17:20"]
  }
};

const pontos = {
  "Rodoviária": [-22.880, -42.018],
  "Centro": [-22.875, -42.010],
  "Praia do Forte": [-22.890, -42.000],
  "Tangará": [-22.870, -42.030],
  "Shopping Park Lagos": [-22.850, -42.020]
};

// adiciona todos os pontos com marcadores menores
for (const [nome, coords] of Object.entries(pontos)) {
  L.circleMarker(coords, {radius:5, color:'orange'}).addTo(map).bindPopup("Ponto: " + nome);
}

const resultado = document.getElementById("resultado");
const cronometro = document.getElementById("cronometro");
const linhaSelect = document.getElementById("linhaSelect");

let onibus;
let usuarioMarker = null;
let rota = null;
let pontoEscolhidoMarker = null;
let intervaloCronometro = null;
let pontoMaisProximo = null; // guardamos o ponto calculado pelo GPS

// função para calcular próximo horário
function proximoHorario(linha, ponto) {
  const agora = new Date();
  const lista = horarios[linha][ponto] || [];
  for (let h of lista) {
    const [hora, minuto] = h.split(":");
    const horario = new Date();
    horario.setHours(hora, minuto, 0);
    if (horario > agora) {
      return h;
    }
  }
  return "Nenhum ônibus restante hoje";
}

function atualizarMapa() {
  const linha = linhaSelect.value;
  if (!pontoMaisProximo) {
    resultado.innerText = "Ative o GPS primeiro para localizar o ponto.";
    return;
  }
  const pontoLatLng = pontos[pontoMaisProximo];

  if (pontoEscolhidoMarker) map.removeLayer(pontoEscolhidoMarker);
  pontoEscolhidoMarker = L.marker(pontoLatLng).addTo(map).bindPopup("Seu ponto: " + pontoMaisProximo).openPopup();

  const prox = proximoHorario(linha, pontoMaisProximo);
  resultado.innerText = "Linha " + linha + " no ponto " + pontoMaisProximo + ": " + (horarios[linha][pontoMaisProximo] || []).join(", ") + " | Próximo ônibus: " + prox;

  if (onibus) map.removeLayer(onibus);
  let lat = pontoLatLng[0] - 0.01;
  let lng = pontoLatLng[1] - 0.01;
  onibus = L.marker([lat, lng]).addTo(map).bindPopup("Ônibus " + linha);

  let segundos = 20; // tempo estimado até chegada
  cronometro.innerText = "⏱ Tempo estimado até chegada: " + segundos + "s";

  if (intervaloCronometro) clearInterval(intervaloCronometro);
  intervaloCronometro = setInterval(() => {
    segundos--;
    cronometro.innerText = "⏱ Tempo estimado até chegada: " + segundos + "s";
    if (segundos <= 0) {
      clearInterval(intervaloCronometro);
      cronometro.innerText = "✅ Ônibus chegou!";
    }
  }, 1000);

  const intervalo = setInterval(() => {
    lat += 0.001;
    lng += 0.001;
    onibus.setLatLng([lat, lng]);

    if (lat >= pontoLatLng[0]) {
      clearInterval(intervalo);
      alert("🚨 Ônibus chegou ao ponto!");
    }
  }, 1000);
}

linhaSelect.addEventListener("change", atualizarMapa);

function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function ativarGPS() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      if (usuarioMarker) map.removeLayer(usuarioMarker);
      usuarioMarker = L.marker([lat, lng]).addTo(map).bindPopup("📍 Você está aqui").openPopup();

      let menorDist = Infinity;
      let coordsMaisProximo = null;

      for (const [nome, coords] of Object.entries(pontos)) {
        const dist = calcularDistancia(lat, lng, coords[0], coords[1]);
        if (dist < menorDist) {
          menorDist = dist;
          pontoMaisProximo = nome;
          coordsMaisProximo = coords;
        }
      }

      resultado.innerText = "📍 Ponto mais próximo: " + pontoMaisProximo + " (" + menorDist.toFixed(0) + " m)";

      if (rota) map.removeControl(rota);
      rota = L.Routing.control({
        waypoints: [
          L.latLng(lat, lng),
          L.latLng(coordsMaisProximo[0], coordsMaisProximo[1])
        ],
        routeWhileDragging: false,
        show: false
      }).addTo(map);
    });
  } else {
    alert("GPS não disponível neste dispositivo.");
  }
}
