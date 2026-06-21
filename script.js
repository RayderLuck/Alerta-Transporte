👉 Aqui você usa `pontos[pontoA]`, mas esse objeto não existe mais (você separou em `pontosImportantes` e `pontosComuns`).  
Resultado: erro de `undefined` → mapa não renderiza.

2. **Uso de `pontos` em vez de `pontosImportantes`**  
Em vários lugares ainda está `pontos[...]`. Como você renomeou, precisa trocar pra `pontosImportantes[...]`.

3. **Fechamento da função**  
O trecho da função `simularOnibus` não fecha com `}` no final, o que quebra o JS.

---

## ✅ Ajuste da função `simularOnibus`

Aqui vai revisada:

```js
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
