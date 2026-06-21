const map = L.map('map').setView([-22.880, -42.018], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// horários por linha e ponto
const horarios = {
  "cabo-arraial": {
    "Rodoviária": ["08:00", "10:30", "13:00"],
    "Centro": ["08:10", "10:40", "13:10"],
    "Praia do Forte": ["08:20", "10:50", "13:20"],
    "Praça Jardim Esperança": ["08:25", "10:55", "13:25"]
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

// pontos cadastrados
const pontos = {
  "Rodoviária": [-22.880, -42.018],
  "Centro": [-22.875, -42.010],
  "Praia do Forte": [-22.890, -42.000],
  "Tangará": [-22.870, -42.030],
  "Shopping Park Lagos": [-22.850, -42.020],
  "Praça Jardim Esperança": [-22.889, -42.015]
};

// adiciona todos os pontos no mapa
for (const [nome, coords] of Object.entries(pontos)) {
  L.circleMarker(coords, {radius:5, color:'orange'}).addTo(map).bindPopup("Ponto: " + nome);
}

const resultado = document.getElementById("resultado");
const cronometro = document.getElementById("cronometro");
const linhaSelect = document.getElementById("linhaSelect");

let usuarioMarker = null;
let pontoMaisProximo = null;
let onibus;
let intervaloCronometro = null;

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

// atualizar mapa com linha escolhida
function atualizarMapa() {
  const linha = linhaSelect.value;
  if (!pontoMaisProximo) {
    resultado.innerText = "Ative o GPS primeiro para localizar o ponto.";
    return;
  }
  const pontoLatLng = pontos[pontoMaisProximo];

  const prox = proximoHorario(linha, pontoMaisProximo);
  resultado.innerText = "Linha " + linha + " no ponto " + pontoMaisProximo + ": " + (horarios[linha][pontoMaisProximo] || []).join(", ") + " | Próximo ônibus: " + prox;

  // simulação de ônibus indo até outro ponto
  simularOnibus(pontoMaisProximo, "Rodoviária");
}

linhaSelect.addEventListener("change", atualizarMapa);

// calcular distância entre coordenadas
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

// ativar GPS
function ativarGPS() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      if (usuarioMarker) map.removeLayer(usuarioMarker);
      usuarioMarker = L.marker([lat, lng]).addTo(map).bindPopup("📍 Você está aqui").openPopup();

      let menorDist = Infinity;
      for (const [nome, coords] of Object.entries(pontos)) {
        const dist = calcularDistancia(lat, lng, coords[0], coords[1]);
        if (dist < menorDist) {
          menorDist = dist;
          pontoMaisProximo = nome;
        }
      }

      resultado.innerText = "📍 Ponto mais próximo: " + pontoMaisProximo + " (" + menorDist.toFixed(0) + " m)";
    });
  } else {
    alert("GPS não disponível neste dispositivo.");
  }
}

// simular ônibus com trajeto real
function simularOnibus(pontoA, pontoB) {
  const rotaOnibus = L.Routing.control({
    waypoints: [
      L.latLng(pontos[pontoA][0], pontos[pontoA][1]),
      L.latLng(pontos[pontoB][0], pontos[pontoB][1])
    ],
    routeWhileDragging: false,
    addWaypoints: false,
    draggableWaypoints: false,
    show: false
  }).addTo(map);

  let onibus = L.marker(pontos[pontoA]).addTo(map).bindPopup("Ônibus em movimento");

  rotaOnibus.on('routesfound', function(e) {
    const coords = e.routes[0].coordinates;
    let i = 0;
    const intervalo = setInterval(() => {
      onibus.setLatLng([coords[i].lat, coords[i].lng]);
      i++;
      if (i >= coords.length) {
        clearInterval(intervalo);
        onibus.bindPopup("🚍 Ônibus chegou ao destino!").openPopup();
      }
    }, 500);
  });
}
