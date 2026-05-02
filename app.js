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

// ================================
// STATO DELL'APP
// ================================
let stato = {
    // Onboarding
    onboardingCompletato: false,
    sigaretteAlGiorno: 15,
    prezzoPackchetto: 5.80,
    sigarettePerPacchetto: 20,
    modalita: "piano", // "piano" o "libera"
    intervalloIniziale: 60, // solo per modalità libera

    // Sessione
    dataInizio: null,
    logOggi: [],
    ultimoGiorno: null,
    totaleRisparmiato: 0,
    timerFine: null,
    intervalloCorrente: 60, // aumenta di 10 ogni sigaretta in modalità libera
};

let modalitaSelezionata = "piano";

// ================================
// CALCOLI DINAMICI
// ================================
function getPrezzoSigaretta() {
    return stato.prezzoPackchetto / stato.sigarettePerPacchetto;
}

function getSettimanaCorrente() {
    if (!stato.dataInizio) return 0;
    const diff = Math.floor(
        (Date.now() - new Date(stato.dataInizio).getTime()) / 86400000
    );
    return Math.min(Math.floor(diff / 7), 7);
}

function getObiettivoOggi() {
    if (stato.modalita === "libera") return stato.sigaretteAlGiorno;
    return SETTIMANE[getSettimanaCorrente()].sigarette;
}

function getIntervallo() {
    if (stato.modalita === "libera") return stato.intervalloCorrente;
    return SETTIMANE[getSettimanaCorrente()].intervallo;
}

// ================================
// SALVATAGGIO E CARICAMENTO
// ================================
function salvaStato() {
    localStorage.setItem("smetti_stato", JSON.stringify(stato));
}

function caricaStato() {
    const salvato = localStorage.getItem("smetti_stato");
    if (salvato) stato = JSON.parse(salvato);

    const oggi = oggiStringa();
    if (stato.ultimoGiorno !== oggi) {
        if (stato.ultimoGiorno !== null) {
            const risparmiate = Math.max(0, stato.sigaretteAlGiorno - stato.logOggi.length);
            stato.totaleRisparmiato += risparmiate * getPrezzoSigaretta();
        }
        stato.logOggi = [];
        stato.ultimoGiorno = oggi;

        // Reset intervallo corrente ogni giorno in modalità libera
        if (stato.modalita === "libera") {
            stato.intervalloCorrente = stato.intervalloIniziale;
        }

        if (!stato.dataInizio) stato.dataInizio = oggi;
        salvaStato();
    }
}

// ================================
// FUNZIONI DI SUPPORTO
// ================================
function oggiStringa() {
    return new Date().toISOString().slice(0, 10);
}

function formattaOra(date) {
    return date.toTimeString().slice(0, 5);
}

function formattaEuro(valore) {
    return "€" + valore.toFixed(2).replace(".", ",");
}

function formattaIntervallo(minuti) {
    if (minuti >= 60) {
        const h = Math.floor(minuti / 60);
        const m = minuti % 60;
        return h + "h" + (m > 0 ? " " + m + "min" : "");
    }
    return minuti + " min";
}

// ================================
// ONBOARDING
// ================================
function selezionaModalita(modalita) {
    modalitaSelezionata = modalita;
    document.getElementById("btn-modalita-piano").classList.toggle("active", modalita === "piano");
    document.getElementById("btn-modalita-libera").classList.toggle("active", modalita === "libera");
    document.getElementById("campo-intervallo-iniziale").style.display = modalita === "libera" ? "block" : "none";
    document.getElementById("descrizione-modalita").textContent = modalita === "piano"
        ? "Segui un piano strutturato: ogni settimana riduci le sigarette fino a smettere."
        : "Ogni sigaretta fumata aumenta l'intervallo di 10 minuti. Parti dal tuo ritmo attuale.";
}

function completaOnboarding() {
    const sig = parseInt(document.getElementById("input-sigarette").value);
    const prezzo = parseFloat(document.getElementById("input-prezzo").value);
    const quantita = parseInt(document.getElementById("input-quantita").value);
    const intervaloIniziale = parseInt(document.getElementById("input-intervallo-iniziale").value) || 60;

    // Validazione
    if (!sig || !prezzo || !quantita) {
        alert("Compila tutti i campi per continuare!");
        return;
    }

    stato.sigaretteAlGiorno = sig;
    stato.prezzoPackchetto = prezzo;
    stato.sigarettePerPacchetto = quantita;
    stato.modalita = modalitaSelezionata;
    stato.intervalloIniziale = intervaloIniziale;
    stato.intervalloCorrente = intervaloIniziale;
    stato.onboardingCompletato = true;
    stato.dataInizio = oggiStringa();
    stato.ultimoGiorno = oggiStringa();

    salvaStato();
    avviaApp();
}

// ================================
// AVVIO APP
// ================================
function avviaApp() {
    document.getElementById("pagina-onboarding").classList.remove("attiva");
    document.querySelector(".header").style.display = "block";
    document.querySelector(".tabs").style.display = "flex";
    mostraPagina("oggi");
}

// ================================
// NAVIGAZIONE
// ================================
function mostraPagina(id) {
    document.querySelectorAll(".pagina").forEach((p) => p.classList.remove("attiva"));
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.getElementById("pagina-" + id).classList.add("attiva");
    const tabs = ["oggi", "timer", "piano", "soldi", "impostazioni"];
    document.querySelectorAll(".tab")[tabs.indexOf(id)].classList.add("active");

    if (id === "piano") aggiornaPiano();
    if (id === "soldi") aggiornaSoldi();
    if (id === "timer") aggiornaTimer();
    if (id === "oggi") aggiornaOggi();
    if (id === "impostazioni") aggiornaImpostazioni();
}

// ================================
// PAGINA OGGI
// ================================
function aggiornaOggi() {
    const fumateOggi = stato.logOggi.length;
    const obiettivo = getObiettivoOggi();
    const risparmiate = Math.max(0, stato.sigaretteAlGiorno - fumateOggi);

    document.getElementById("cig-oggi").textContent = fumateOggi;
    document.getElementById("cig-obiettivo").textContent = obiettivo;
    document.getElementById("cig-risparmiate").textContent = risparmiate;
    document.getElementById("settimana-label").textContent = stato.modalita === "libera"
        ? "Libera"
        : SETTIMANE[getSettimanaCorrente()].label;

    const pct = obiettivo > 0 ? Math.min(100, Math.round((fumateOggi / obiettivo) * 100)) : 100;
    document.getElementById("barra-progresso").style.width = pct + "%";
    document.getElementById("testo-progresso").textContent = fumateOggi + " / " + obiettivo + " sigarette oggi";

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

    // In modalità libera aumenta l'intervallo di 10 minuti
    if (stato.modalita === "libera") {
        stato.intervalloCorrente += 10;
    }

    stato.timerFine = Date.now() + getIntervallo() * 60000;
    salvaStato();
    aggiornaOggi();
}

function annullaUltima() {
    if (stato.logOggi.length > 0) {
        stato.logOggi.pop();
        if (stato.modalita === "libera" && stato.intervalloCorrente > stato.intervalloIniziale) {
            stato.intervalloCorrente -= 10;
        }
        salvaStato();
        aggiornaOggi();
    }
}

// ================================
// PAGINA TIMER
// ================================
function aggiornaTimer() {
    document.getElementById("intervallo-label").textContent = formattaIntervallo(getIntervallo());

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
    if (stato.modalita === "libera") {
        document.getElementById("piano-lista").innerHTML = `
      <div style="text-align:center; padding: 1rem 0; color: #888; font-size:14px;">
        <p style="font-size:32px; margin-bottom:12px">🎯</p>
        <p>Sei in modalità <strong>intervallo crescente</strong>.</p>
        <p style="margin-top:8px">Intervallo attuale: <strong>${formattaIntervallo(stato.intervalloCorrente)}</strong></p>
        <p style="margin-top:4px">Intervallo iniziale: <strong>${formattaIntervallo(stato.intervalloIniziale)}</strong></p>
        <p style="margin-top:4px">Ogni sigaretta aggiunge <strong>10 minuti</strong>.</p>
      </div>`;
        return;
    }

    const settCorrente = getSettimanaCorrente();
    document.getElementById("piano-lista").innerHTML = SETTIMANE.map((s, i) => `
    <div class="settimana-riga ${i === settCorrente ? "attiva-settimana" : ""}">
      <span class="sett-label">${s.label}${i === settCorrente ? " ◀" : ""}</span>
      <span class="sett-cig">${s.sigarette > 0 ? s.sigarette + " sig." : "🎉 Libero!"}</span>
      <span class="sett-intervallo">${s.intervallo > 0 ? "ogni " + formattaIntervallo(s.intervallo) : ""}</span>
    </div>`).join("");
}

// ================================
// PAGINA SOLDI
// ================================
function aggiornaSoldi() {
    const fumateOggi = stato.logOggi.length;
    const risparmioOggi = Math.max(0, stato.sigaretteAlGiorno - fumateOggi) * getPrezzoSigaretta();
    const giorni = stato.dataInizio
        ? Math.floor((Date.now() - new Date(stato.dataInizio).getTime()) / 86400000) + 1
        : 1;
    const totale = stato.totaleRisparmiato + risparmioOggi;

    document.getElementById("soldi-oggi").textContent = formattaEuro(risparmioOggi);
    document.getElementById("soldi-totale").textContent = formattaEuro(totale);
    document.getElementById("giorni-totali").textContent = giorni;
    document.getElementById("sigarette-evitate").textContent = Math.round(totale / getPrezzoSigaretta());
}

// ================================
// INIT
// ================================
caricaStato();

if (stato.onboardingCompletato) {
    avviaApp();
} else {
    // Nascondi header e tabs finché non completa onboarding
    document.querySelector(".header").style.display = "none";
    document.querySelector(".tabs").style.display = "none";
}

setInterval(() => {
    if (document.getElementById("pagina-timer") &&
        document.getElementById("pagina-timer").classList.contains("attiva")) {
        aggiornaTimer();
    }
}, 1000);

// ================================
// PAGINA IMPOSTAZIONI
// ================================
function aggiornaImpostazioni() {
    document.getElementById("info-sigarette").textContent = stato.sigaretteAlGiorno;
    document.getElementById("info-prezzo").textContent = formattaEuro(stato.prezzoPackchetto);
    document.getElementById("info-modalita").textContent = stato.modalita === "piano"
        ? "Piano 8 settimane"
        : "Intervallo crescente";
    document.getElementById("info-data").textContent = stato.dataInizio
        ? new Date(stato.dataInizio).toLocaleDateString("it-IT")
        : "--";

    // Precompila i campi di modifica
    document.getElementById("mod-sigarette").value = stato.sigaretteAlGiorno;
    document.getElementById("mod-prezzo").value = stato.prezzoPackchetto;
    document.getElementById("mod-quantita").value = stato.sigarettePerPacchetto;
}

function salvaImpostazioni() {
    const sig = parseInt(document.getElementById("mod-sigarette").value);
    const prezzo = parseFloat(document.getElementById("mod-prezzo").value);
    const quantita = parseInt(document.getElementById("mod-quantita").value);

    if (!sig || !prezzo || !quantita) {
        alert("Compila tutti i campi!");
        return;
    }

    stato.sigaretteAlGiorno = sig;
    stato.prezzoPackchetto = prezzo;
    stato.sigarettePerPacchetto = quantita;
    salvaStato();
    aggiornaImpostazioni();
    alert("Impostazioni salvate!");
}

function resetApp() {
    if (confirm("Sei sicuro? Perderai tutto il progresso!")) {
        localStorage.removeItem("smetti_stato");
        window.location.reload();
    }
}

// ================================
// SERVICE WORKER
// ================================
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/quit-smoking-app/sw.js")
            .then(() => console.log("Service Worker registrato"))
            .catch((err) => console.log("Errore Service Worker:", err));
    });
}