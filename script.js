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

// pontos importantes com nome
const pontosImportantes = {
  "Rodoviária": [-22.880, -42.018],
  "Centro": [-22.875, -42.010],
  "Praia do Forte": [-22.890, -42.000],
  "Tangará": [-22.870, -42.030],
  "Shopping Park Lagos": [-22.850, -42.020],
  "Praça Jardim Esperança": [-22.841016921684087, -42.025246904469284],
  "IFF": [-22.815243262486394, -41.98014320417396],
  "Detran de Búzios": [-22.780907676973676, -41.93758588061443],
  "Ponto Final Búzios": [-22.74144122685297, -41.87178858032976],
  "Mercado Extra Búzios": [-22.774363489236823, -41.924272293293825],
  "Estácio Cabo Frio": [-22.89714499624249, -42.04218696078658]
};

// pontos comuns (sem nome)
const pontosComuns = [
  [-22.774457295174404, -41.92824411028642],
  [-22.840298422958735, -42.02301736310988],
  [-22.837973340738525, -42.01822167159084],
  [-22.836555962115956, -42.016622779054],
  [-22.83486661195803, -42.01466656290055],
  [-22.830198523025956, -42.00882633566037],
  [-22.82792602165773, -42.006459805698235],
  [-22.82481164273595, -42.00244472882972],
  [-22.820724598276197, -41.99661715225157],
  [-22.812477297755176, -41.976209675947985],
  [-22.810002620659727, -41.9759272792208],
  [-22.807868045391693, -41.97365304435515],
  [-22.8052977852277, -41.97177576806586],
  [-22.798982065406303, -41.96944759312069],
  [-22.793814167626465, -41.96447643792151],
  [-22.843056208847194, -42.02668755051719],
  [-22.845783540518866, -42.02928976915708],
  [-22.84710976531599, -42.03042350848855],
  [-22.85248414197503, -42.03316684929715],
  [-22.856497671679517, -42.032146729909414],
  [-22.859241546413205, -42.031941613518455],
  [-22.868044461146784, -42.02893595531033],
  [-22.87050769885231, -42.025780326432006],
  [-22.874956975721297, -42.02292691647504],
  [-22.878313645993707, -42.024934478192506]
];

// adiciona pontos importantes no mapa
for (const [nome, coords] of Object.entries(pontosImportantes)) {
  L.circleMarker(coords, {radius:6, color:'orange'}).addTo(map).bindPopup("Ponto: " + nome);
}

// adiciona pontos comuns no mapa
pontosComuns.forEach(coords => {
  L.circleMarker(coords, {radius:4, color:'gray'}).addTo(map);
});

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

  const prox = proximoHorario(linha, pontoMaisProximo);
  resultado.innerText = "Linha " + linha + " no ponto " + pontoMaisProximo + ": " +
    (horarios[linha][pontoMaisProximo] || []).join(", ") +
    " | Próximo ônibus: " + prox;

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
      for (const [nome, coords] of Object.entries(pontosImportantes)) {
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
      L.latLng(pontosImportantes[pontoA][0], pontosImportantes[pontoA][1]),
      L.latLng(pontosImportantes[pontoB][0], pontosImportantes[pontoB][1])
    ],
    routeWhileDragging: false,
    addWaypoints: false,
    draggableWaypoints: false,
    show: false
  }).addTo(map);

  let onibus = L.marker(pontosImportantes[pontoA]).addTo(map).bindPopup("Ônibus em movimento");

  rotaOnibus.on('routesfound', function(e) {
    const coords = e
