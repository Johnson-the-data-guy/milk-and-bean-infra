// Client-side-only table booking. No backend, no database — reservations
// live in this browser's localStorage and vanish if it's cleared.

const STORAGE_KEY = "milkAndBeanBookings";

// Minutes-from-midnight open/close, matching the Hours card in index.html.
const HOURS = {
  0: { open: 9 * 60, close: 16 * 60 }, // Sunday
  1: { open: 7 * 60, close: 19 * 60 }, // Monday
  2: { open: 7 * 60, close: 19 * 60 },
  3: { open: 7 * 60, close: 19 * 60 },
  4: { open: 7 * 60, close: 19 * 60 },
  5: { open: 7 * 60, close: 19 * 60 },
  6: { open: 8 * 60, close: 19 * 60 }, // Saturday
};

const form = document.getElementById("booking-form");

if (form) {
  const dateInput = document.getElementById("booking-date");
  const timeSelect = document.getElementById("booking-time");
  const nameInput = document.getElementById("booking-name");
  const partyInput = document.getElementById("booking-party");
  const noteInput = document.getElementById("booking-note");

  const overlay = document.getElementById("confirm-overlay");
  const closeBtn = document.getElementById("confirm-close");

  const today = new Date();
  dateInput.min = toDateInputValue(today);
  dateInput.value = toDateInputValue(today);
  populateTimeSlots();

  dateInput.addEventListener("change", populateTimeSlots);
  form.addEventListener("submit", handleSubmit);
  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) closeModal();
  });

  function toDateInputValue(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatMinutes(mins) {
    const h24 = Math.floor(mins / 60);
    const m = mins % 60;
    const period = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  }

  function formatDateDisplay(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  }

  function populateTimeSlots() {
    const previousValue = timeSelect.value;
    timeSelect.innerHTML = "";

    if (!dateInput.value) {
      timeSelect.appendChild(new Option("Pick a date first", ""));
      return;
    }

    const [y, m, d] = dateInput.value.split("-").map(Number);
    const day = new Date(y, m - 1, d).getDay();
    const hours = HOURS[day];

    timeSelect.appendChild(new Option("Select a time", ""));
    for (let mins = hours.open; mins < hours.close; mins += 30) {
      timeSelect.appendChild(new Option(formatMinutes(mins), String(mins)));
    }

    if ([...timeSelect.options].some((opt) => opt.value === previousValue)) {
      timeSelect.value = previousValue;
    }
  }

  function setError(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message;
  }

  function clearErrors() {
    ["error-name", "error-party", "error-date", "error-time"].forEach((id) => setError(id, ""));
  }

  function handleSubmit(event) {
    event.preventDefault();
    clearErrors();

    let valid = true;
    const name = nameInput.value.trim();
    const party = Number(partyInput.value);
    const date = dateInput.value;
    const time = timeSelect.value;

    if (!name) {
      setError("error-name", "Tell us who's booking.");
      valid = false;
    }
    if (!party || party < 1 || party > 12) {
      setError("error-party", "Party size should be 1–12.");
      valid = false;
    }
    if (!date || date < dateInput.min) {
      setError("error-date", "Pick today or a later date.");
      valid = false;
    }
    if (!time) {
      setError("error-time", "Pick a time slot.");
      valid = false;
    }

    if (!valid) return;

    const booking = {
      id: Date.now(),
      name,
      party,
      date,
      time: formatMinutes(Number(time)),
      note: noteInput.value.trim(),
      createdAt: new Date().toISOString(),
    };

    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    bookings.push(booking);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));

    showConfirmation(booking);

    form.reset();
    dateInput.value = toDateInputValue(today);
    partyInput.value = 2;
    populateTimeSlots();
  }

  function showConfirmation(booking) {
    document.getElementById("confirm-name").textContent = booking.name;
    document.getElementById("confirm-party").textContent = booking.party;
    document.getElementById("confirm-date").textContent = formatDateDisplay(booking.date);
    document.getElementById("confirm-time").textContent = booking.time;
    overlay.hidden = false;
    closeBtn.focus();
  }

  function closeModal() {
    overlay.hidden = true;
    form.querySelector(".booking-submit").focus();
  }
}
