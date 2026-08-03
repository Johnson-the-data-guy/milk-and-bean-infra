// Map for 39 Glover Street, Ikoyi, Lagos, Nigeria.
//
// Geocoded via the Nominatim API (nominatim.openstreetmap.org/search).
// The exact house number doesn't resolve — Nominatim has no house-level
// data for it, and there is no "Glover Street" in Ikoyi at all. The real
// street is almost certainly "Glover Road, Ikoyi" (a well-known street;
// likely a naming slip in the brief). That query DOES resolve, so this pin
// uses Glover Road's street-level coordinate rather than dropping all the
// way to the Ikoyi neighborhood centroid (6.4523, 3.4281), which would be
// even less precise. Either way: this is an approximate, street-level pin,
// not the exact building — flagged here and in the on-page map note.
const CAFE_COORDS = [6.4537212, 3.4337347];

const mapEl = document.getElementById("map");

if (mapEl && window.L) {
  const map = L.map(mapEl, {
    scrollWheelZoom: false,
  }).setView(CAFE_COORDS, 16);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  L.marker(CAFE_COORDS)
    .addTo(map)
    .bindPopup("Milk &amp; Bean<br>39 Glover Street, Ikoyi, Lagos (approximate)");
}
