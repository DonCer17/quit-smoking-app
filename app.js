// ================================
// DATI PIANO 8 SETTIMANE
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
// STATO
// ================================
let stato = {
    onboardingCompletato: false,
    sigaretteAlGiorno: 15,
    prezzoPackchetto: 5.80,
    sigarettePerPacchetto: 20,
    modalita: "piano",
    intervalloIniziale: 60,
    dataInizio: null,
    logOggi: [],
    ultimoGiorno: null,
    totaleRisparmiato: 0,
    giorniObiettivo: 0,
    timerFine: null,
    intervalloCorrente: 60,
    storicoGiornaliero: [],
};

let modalitaSelezionata = "piano";

// ================================
// CALCOLI
// ================================
function getPrezzoSigaretta() {
    return stato.prezzoPackchetto / stato.sigarettePerPacchetto;
}

function getSettimanaCorrente() {
    if (!stato.dataInizio) return 0;
    const diff = Math.floor((Date.now() - new Date(stato.dataInizio).getTime()) / 86400000);
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

function formattaOra(date) { return date.toTimeString().slice(0, 5); }
function formattaEuro(v) { return "€" + v.toFixed(2).replace(".", ","); }
function formattaIntervallo(m) {
    if (m >= 60) return Math.floor(m / 60) + "h" + (m % 60 > 0 ? " " + m % 60 + "min" : "");
    return m + " min";
}

// ================================
// STREAK E MESSAGGI
// ================================
function calcolaStreak() {
    if (!stato.storicoGiornaliero || stato.storicoGiornaliero.length === 0) return 0;
    let streak = 0;
    const storico = [...stato.storicoGiornaliero].reverse();
    for (let giorno of storico) {
        if (giorno.fumate <= giorno.obiettivo) streak++;
        else break;
    }
    return streak;
}

function getMessaggioMotivazionale() {
    const giorni = stato.dataInizio
        ? Math.floor((Date.now() - new Date(stato.dataInizio).getTime()) / 86400000) + 1
        : 1;
    const streak = calcolaStreak();
    const fumateOggi = stato.logOggi.length;
    const obiettivo = getObiettivoOggi();

    // Messaggi basati sulla situazione attuale
    if (fumateOggi > obiettivo) return "Oggi è andata così — domani ricomincia. Ce la fai! 💪";
    if (streak >= 7) return "🔥 " + streak + " giorni di fila! Sei inarrestabile!";
    if (streak >= 3) return "⚡ " + streak + " giorni consecutivi rispettati. Continua così!";
    if (giorni === 1) return "🌱 Primo giorno — il viaggio inizia adesso!";
    if (giorni <= 3) return "💪 I primi giorni sono i più difficili. Tieni duro!";
    if (giorni === 7) return "🎉 Una settimana intera — sei già un campione!";
    if (giorni === 14) return "🏆 Due settimane! Il tuo corpo ti sta ringraziando.";
    if (giorni === 30) return "🌟 Un mese! Hai fatto qualcosa di straordinario.";
    if (fumateOggi === 0) return "✨ Ancora nessuna sigaretta oggi. Fantastico!";
    return "🚭 Giorno " + giorni + " — stai costruendo una nuova abitudine!";
}

function oggiStringa() { return new Date().toISOString().slice(0, 10); }

// ================================
// SALVATAGGIO
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

            // Salva storico giornaliero
            if (!stato.storicoGiornaliero) stato.storicoGiornaliero = [];
            stato.storicoGiornaliero.push({
                data: stato.ultimoGiorno,
                fumate: stato.logOggi.length,
                obiettivo: getObiettivoOggi(),
            });
            // Tieni solo ultimi 30 giorni
            if (stato.storicoGiornaliero.length > 30) stato.storicoGiornaliero.shift();

            // Conta giorni obiettivo rispettato
            if (stato.logOggi.length <= getObiettivoOggi()) {
                stato.giorniObiettivo = (stato.giorniObiettivo || 0) + 1;
            }
        }

        stato.logOggi = [];
        stato.ultimoGiorno = oggi;
        if (stato.modalita === "libera") stato.intervalloCorrente = stato.intervalloIniziale;
        if (!stato.dataInizio) stato.dataInizio = oggi;
        salvaStato();
    }
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
        : "Ogni sigaretta fumata aumenta l'intervallo di 10 minuti.";
}

function completaOnboarding() {
    const sig = parseInt(document.getElementById("input-sigarette").value);
    const prezzo = parseFloat(document.getElementById("input-prezzo").value);
    const quantita = parseInt(document.getElementById("input-quantita").value);
    const intervaloIniziale = parseInt(document.getElementById("input-intervallo-iniziale").value) || 60;

    if (!sig || !prezzo || !quantita) { alert("Compila tutti i campi!"); return; }

    stato.sigaretteAlGiorno = sig;
    stato.prezzoPackchetto = prezzo;
    stato.sigarettePerPacchetto = quantita;
    stato.modalita = modalitaSelezionata;
    stato.intervalloIniziale = intervaloIniziale;
    stato.intervalloCorrente = intervaloIniziale;
    stato.onboardingCompletato = true;
    stato.dataInizio = oggiStringa();
    stato.ultimoGiorno = oggiStringa();
    stato.storicoGiornaliero = [];
    stato.giorniObiettivo = 0;

    salvaStato();
    richiediPermessoNotifiche();
    avviaApp();
}

// ================================
// AVVIO
// ================================
function avviaApp() {
    document.getElementById("pagina-onboarding").classList.remove("attiva");
    document.querySelector(".header").style.display = "block";
    document.querySelector(".tabs").style.display = "flex";
    mostraPagina("dashboard");
}

// ================================
// NAVIGAZIONE
// ================================
function mostraPagina(id) {
    document.querySelectorAll(".pagina").forEach((p) => p.classList.remove("attiva"));
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.getElementById("pagina-" + id).classList.add("attiva");
    const tabs = ["dashboard", "timer", "impostazioni"];
    document.querySelectorAll(".tab")[tabs.indexOf(id)].classList.add("active");
    if (id === "dashboard") aggiornaDashboard();
    if (id === "timer") aggiornaTimer();
    if (id === "impostazioni") aggiornaImpostazioni();
}

// ================================
// DASHBOARD
// ================================
function aggiornaDashboard() {
    const fumateOggi = stato.logOggi.length;
    const obiettivo = getObiettivoOggi();
    const giorni = stato.dataInizio
        ? Math.floor((Date.now() - new Date(stato.dataInizio).getTime()) / 86400000) + 1
        : 1;
    const totaleEvitate = Math.round(stato.totaleRisparmiato / getPrezzoSigaretta());
    const risparmioOggi = Math.max(0, stato.sigaretteAlGiorno - fumateOggi) * getPrezzoSigaretta();
    const totale = stato.totaleRisparmiato + risparmioOggi;
    const risparmioGiornaliero = stato.sigaretteAlGiorno * getPrezzoSigaretta();

    // Oggi
    document.getElementById("cig-oggi").textContent = fumateOggi;
    document.getElementById("cig-obiettivo").textContent = obiettivo;
    const pct = obiettivo > 0 ? Math.min(100, Math.round(fumateOggi / obiettivo * 100)) : 100;
    document.getElementById("barra-progresso").style.width = pct + "%";
    document.getElementById("testo-progresso").textContent = fumateOggi + " / " + obiettivo + " sigarette oggi";

    // Log
    const logEl = document.getElementById("log-lista");
    if (stato.logOggi.length === 0) {
        logEl.innerHTML = "<p class='log-vuoto'>Nessuna sigaretta ancora oggi 💪</p>";
    } else {
        logEl.innerHTML = stato.logOggi
            .map((t, i) => `<div class='log-riga'><span>#${i + 1}</span><span>${t}</span></div>`)
            .join("");
    }

    // Percorso
    document.getElementById("stat-giorni").textContent = giorni;
    document.getElementById("stat-giorni-ok").textContent = stato.giorniObiettivo || 0;
    document.getElementById("stat-evitate").textContent = totaleEvitate;
    document.getElementById("stat-risparmio").textContent = formattaEuro(totale);

    // Proiezioni basate sul risparmio giornaliero reale
    document.getElementById("proj-3mesi").textContent = "~" + formattaEuro(risparmioGiornaliero * 90);
    document.getElementById("proj-6mesi").textContent = "~" + formattaEuro(risparmioGiornaliero * 180);
    document.getElementById("proj-anno").textContent = "~" + formattaEuro(risparmioGiornaliero * 365);

    // Header sottotitolo
    document.getElementById("header-sottotitolo").textContent = "Giorno " + giorni + " del percorso";
    document.getElementById("messaggio-motivazionale").textContent = getMessaggioMotivazionale();
    document.getElementById("stat-streak").textContent = calcolaStreak();
}

// ================================
// AZIONI SIGARETTA
// ================================
function fumatoOra() {
    const ora = formattaOra(new Date());
    stato.logOggi.push(ora);
    if (stato.modalita === "libera") stato.intervalloCorrente += 10;
    stato.timerFine = Date.now() + getIntervallo() * 60000;
    salvaStato();
    aggiornaDashboard();
    schedulaNotifica(getIntervallo());
}

function annullaUltima() {
    if (stato.logOggi.length > 0) {
        stato.logOggi.pop();
        if (stato.modalita === "libera" && stato.intervalloCorrente > stato.intervalloIniziale) {
            stato.intervalloCorrente -= 10;
        }
        salvaStato();
        aggiornaDashboard();
    }
}

// ================================
// TIMER
// ================================
function aggiornaTimer() {
    document.getElementById("intervallo-label").textContent = formattaIntervallo(getIntervallo());
    if (stato.timerFine) {
        const rimanente = stato.timerFine - Date.now();
        document.getElementById("prossima-ora").textContent = formattaOra(new Date(stato.timerFine));
        if (rimanente > 0) {
            const m = Math.floor(rimanente / 60000);
            const s = Math.floor((rimanente % 60000) / 1000);
            document.getElementById("timer-display").textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
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
    if (window._notificaTimer) clearTimeout(window._notificaTimer);
    salvaStato();
    aggiornaTimer();
}

// ================================
// IMPOSTAZIONI
// ================================
function aggiornaImpostazioni() {
    document.getElementById("info-sigarette").textContent = stato.sigaretteAlGiorno;
    document.getElementById("info-prezzo").textContent = formattaEuro(stato.prezzoPackchetto);
    document.getElementById("info-modalita").textContent = stato.modalita === "piano" ? "Piano 8 settimane" : "Intervallo crescente";
    document.getElementById("info-data").textContent = stato.dataInizio ? new Date(stato.dataInizio).toLocaleDateString("it-IT") : "--";
    document.getElementById("mod-sigarette").value = stato.sigaretteAlGiorno;
    document.getElementById("mod-prezzo").value = stato.prezzoPackchetto;
    document.getElementById("mod-quantita").value = stato.sigarettePerPacchetto;
}

function salvaImpostazioni() {
    const sig = parseInt(document.getElementById("mod-sigarette").value);
    const prezzo = parseFloat(document.getElementById("mod-prezzo").value);
    const quantita = parseInt(document.getElementById("mod-quantita").value);
    if (!sig || !prezzo || !quantita) { alert("Compila tutti i campi!"); return; }
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
// NOTIFICHE
// ================================
async function richiediPermessoNotifiche() {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const permesso = await Notification.requestPermission();
    return permesso === "granted";
}

async function schedulaNotifica(minutiRimanenti) {
    const permesso = await richiediPermessoNotifiche();
    if (!permesso) return;
    if (window._notificaTimer) clearTimeout(window._notificaTimer);
    window._notificaTimer = setTimeout(() => {
        if (Notification.permission === "granted") {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification("🚭 SmettiFumo", {
                    body: "Il timer è scaduto — puoi fumare adesso. Ma se riesci ad aspettare ancora, sei più forte!",
                    icon: "/quit-smoking-app/icons/icon-192.png",
                    badge: "/quit-smoking-app/icons/icon-192.png",
                    vibrate: [200, 100, 200],
                });
            });
        }
    }, minutiRimanenti * 60 * 1000);
}

// ================================
// INIT
// ================================
caricaStato();
if (stato.onboardingCompletato) {
    avviaApp();
} else {
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
// SERVICE WORKER
// ================================
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/quit-smoking-app/sw.js")
            .then(() => console.log("SW registrato"))
            .catch((err) => console.log("Errore SW:", err));
    });
}