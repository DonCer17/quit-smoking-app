// ================================
// DATI DEL PIANO 8 SETTIMANE
// ================================
const SETTIMANE = [
    { label: "Sett. 1", sigarette: 12, intervallo: 80 },
    { label: "Sett. 2", sigarette: 10, intervallo: 95 },
    { label: "Sett. 3", sigarette: 8, intervallo: 120 },
    { label: "Sett. 4", sigarette: 6, intervallo: 160 },
    { label: "Sett. 5", sigarette: 5, intervallo: 192 },
    { label: "Sett. 6", sigarette: 4, intervallo: 240 },
    { label: "Sett. 7", sigarette: 2, intervallo: 480 },
    { label: "Sett. 8", sigarette: 0, intervallo: 0 },
];

const PREZZO_SIGARETTA = 0.29;
const SIGARETTE_PRIMA = 15;

// ================================
// STATO DELL'APP
// ================================
let stato = {
    dataInizio: null,
    logOggi: [],
    ultimoGiorno: null,
    totaleRisparmiato: 0,
    timerFine: null,
};

// ================================
// SALVATAGGIO E CARICAMENTO
// ================================
function salvaStato() {
    localStorage.setItem("smetti_stato", JSON.stringify(stato));
}

function caricaStato() {
    const salvato = localStorage.getItem("smetti_stato");
    if (salvato) {
        stato = JSON.parse(salvato);
    }

    const oggi = oggiStringa();

    // Se è un nuovo giorno, azzera il log giornaliero
    if (stato.ultimoGiorno !== oggi) {
        // Aggiungi al totale le sigarette risparmiate ieri
        if (stato.ultimoGiorno !== null) {
            const settimana = getSettimanaCorrente();
            const risparmiate = Math.max(0, SIGARETTE_PRIMA - stato.logOggi.length);
            stato.totaleRisparmiato += risparmiate * PREZZO_SIGARETTA;
        }
        stato.logOggi = [];
        stato.ultimoGiorno = oggi;

        // Imposta la data di inizio al primo utilizzo
        if (!stato.dataInizio) {
            stato.dataInizio = oggi;
        }

        salvaStato();
    }
}

// ================================
// FUNZIONI DI SUPPORTO
// ================================
function oggiStringa() {
    return new Date().toISOString().slice(0, 10);
}

function getSettimanaCorrente() {
    if (!stato.dataInizio) return 0;
    const diff = Math.floor(
        (Date.now() - new Date(stato.dataInizio).getTime()) / 86400000
    );
    return Math.min(Math.floor(diff / 7), 7);
}

function getObiettivoOggi() {
    return SETTIMANE[getSettimanaCorrente()].sigarette;
}

function getIntervallo() {
    return SETTIMANE[getSettimanaCorrente()].intervallo;
}

function formattaOra(date) {
    return date.toTimeString().slice(0, 5);
}

function formattaEuro(valore) {
    return "€" + valore.toFixed(2).replace(".", ",");
}

// ================================
// NAVIGAZIONE TRA LE PAGINE
// ================================
function mostraPagina(id) {
    document.querySelectorAll(".pagina").forEach((p) => p.classList.remove("attiva"));
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));

    document.getElementById("pagina-" + id).classList.add("attiva");

    const tabs = ["oggi", "timer", "piano", "soldi"];
    const idx = tabs.indexOf(id);
    document.querySelectorAll(".tab")[idx].classList.add("active");

    if (id === "piano") aggiornaPiano();
    if (id === "soldi") aggiornaSoldi();
    if (id === "timer") aggiornaTimer();
    if (id === "oggi") aggiornaOggi();
}

// ================================
// PAGINA OGGI
// ================================
function aggiornaOggi() {
    const fumateOggi = stato.logOggi.length;
    const obiettivo = getObiettivoOggi();
    const risparmiate = Math.max(0, SIGARETTE_PRIMA - fumateOggi);

    document.getElementById("cig-oggi").textContent = fumateOggi;
    document.getElementById("cig-obiettivo").textContent = obiettivo;
    document.getElementById("cig-risparmiate").textContent = risparmiate;
    document.getElementById("settimana-label").textContent =
        SETTIMANE[getSettimanaCorrente()].label;

    // Barra progresso
    const pct = obiettivo > 0 ? Math.min(100, Math.round((fumateOggi / obiettivo) * 100)) : 100;
    document.getElementById("barra-progresso").style.width = pct + "%";
    document.getElementById("testo-progresso").textContent =
        fumateOggi + " / " + obiettivo + " sigarette oggi";

    // Log sigarette
    const logEl = document.getElementById("log-lista");
    if (stato.logOggi.length === 0) {
        logEl.innerHTML = "<p class='log-vuoto'>Nessuna sigaretta ancora oggi 💪</p>";
    } else {
        logEl.innerHTML = stato.logOggi
            .map((t, i) => `<div class='log-riga'><span>#${i + 1}</span><span>${t}</span></div>`)
            .join("");
    }
}

function fumatoOra() {
    const ora = formattaOra(new Date());
    stato.logOggi.push(ora);

    // Avvia anche il timer
    stato.timerFine = Date.now() + getIntervallo() * 60000;

    salvaStato();
    aggiornaOggi();
}

function annullaUltima() {
    if (stato.logOggi.length > 0) {
        stato.logOggi.pop();
        salvaStato();
        aggiornaOggi();
    }
}

// ================================
// PAGINA TIMER
// ================================
function aggiornaTimer() {
    const intervallo = getIntervallo();
    const minuti = intervallo >= 60 ? Math.floor(intervallo / 60) + "h " + (intervallo % 60 > 0 ? (intervallo % 60) + "min" : "") : intervallo + " min";
    document.getElementById("intervallo-label").textContent = minuti;

    if (stato.timerFine) {
        const rimanente = stato.timerFine - Date.now();
        const prossima = new Date(stato.timerFine);
        document.getElementById("prossima-ora").textContent = formattaOra(prossima);

        if (rimanente > 0) {
            const m = Math.floor(rimanente / 60000);
            const s = Math.floor((rimanente % 60000) / 1000);
            document.getElementById("timer-display").textContent =
                String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
            document.getElementById("timer-testo").textContent = "alla prossima sigaretta";
        } else {
            document.getElementById("timer-display").textContent = "OK!";
            document.getElementById("timer-testo").textContent = "Puoi fumare adesso";
        }
    } else {
        document.getElementById("timer-display").textContent = "--:--";
        document.getElementById("timer-testo").textContent = "Premi il bottone per avviare";
        document.getElementById("prossima-ora").textContent = "--:--";
    }
}

function avviaTimer() {
    fumatoOra();
    mostraPagina("timer");
}

function resetTimer() {
    stato.timerFine = null;
    salvaStato();
    aggiornaTimer();
}

// ================================
// PAGINA PIANO
// ================================
function aggiornaPiano() {
    const settCorrente = getSettimanaCorrente();
    document.getElementById("piano-lista").innerHTML = SETTIMANE.map((s, i) => `
    <div class="settimana-riga ${i === settCorrente ? "attiva-settimana" : ""}">
      <span class="sett-label">${s.label}${i === settCorrente ? " ◀" : ""}</span>
      <span class="sett-cig">${s.sigarette > 0 ? s.sigarette + " sig." : "🎉 Libero!"}</span>
      <span class="sett-intervallo">${s.intervallo > 0 ? "ogni " + (s.intervallo >= 60 ? Math.floor(s.intervallo / 60) + "h" : s.intervallo + "m") : ""}</span>
    </div>
  `).join("");
}

// ================================
// PAGINA SOLDI
// ================================
function aggiornaSoldi() {
    const fumateOggi = stato.logOggi.length;
    const risparmioOggi = Math.max(0, SIGARETTE_PRIMA - fumateOggi) * PREZZO_SIGARETTA;
    const giorni = stato.dataInizio
        ? Math.floor((Date.now() - new Date(stato.dataInizio).getTime()) / 86400000) + 1
        : 1;

    document.getElementById("soldi-oggi").textContent = formattaEuro(risparmioOggi);
    document.getElementById("soldi-totale").textContent = formattaEuro(stato.totaleRisparmiato + risparmioOggi);
    document.getElementById("giorni-totali").textContent = giorni;
    document.getElementById("sigarette-evitate").textContent = Math.round((stato.totaleRisparmiato + risparmioOggi) / PREZZO_SIGARETTA);
}

// ================================
// AVVIO APP
// ================================
caricaStato();
aggiornaOggi();
setInterval(() => {
    if (document.getElementById("pagina-timer").classList.contains("attiva")) {
        aggiornaTimer();
    }
}, 1000);