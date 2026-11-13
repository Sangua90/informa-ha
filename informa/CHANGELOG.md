## 0.10.101

- Bird dog aggiunto al Core, disponibile a Gemini e al Coach locale, alle sostituzioni e alle esclusioni personali. Guida illustrata inclusa e installata automaticamente preservando le foto personalizzate.
- Conteggio esplicito per lato e totale: per esempio 6 per lato, 12 totali. Storico e ripresa mantengono la stessa unità; la durata della scheda considera entrambi i lati. Base prudente 6 per lato e progressione di una ripetizione per lato dopo due sedute complete e facili.
- Nuovo riquadro Note per il Coach nella pagina delle domande: testo libero ed esercizio facoltativo, interpretazione Gemini di ripetizioni/secondi, serie e recuperi, conferma di cosa è stato applicato alle prossime schede. Le altre preferenze restano nel contesto del Coach. Bozze conservate in caso di errore, invio singolo, indicazioni archiviabili e riattivabili.
- Preferenze numeriche condivise tra Gemini, Coach locale e sostituzioni. Le note nuove prevalgono sui vecchi parametri, senza riaprire indicazioni superate né riscrivere la seduta già aperta.

## 0.10.100

- La valutazione esplicita dello sforzo prevale sulle vecchie etichette delle serie: “Moderato” impedisce un aumento automatico anche se lo storico delle serie riportava “Facile”. Conservate tutte le nuove convenzioni dei manubri e la progressione del corpo libero della 0.10.99.

## 0.10.99

- Progressione esplicita del corpo libero condivisa tra Gemini e Coach locale: dopo due sedute complete, facili e comparabili, +2 ripetizioni oppure +5 secondi per Plank. Nessun aumento automatico con sedute parziali, recupero breve, energia bassa o fastidi; riduzione prudente dopo sforzo alto o lunga interruzione. Il motivo compare nella scheda e la seduta già aperta conserva i suoi obiettivi.

- Carichi dei manubri espliciti: kg dei soli dischi montati su un manubrio, sommando le due estremità ed escludendo impugnatura e fermadischi. Gli esercizi indicano se usare uno o due manubri; il valore resta sempre per ciascuno.
- Stessa convenzione in allenamento, suggerimenti, storico, attrezzatura e contesto Gemini. I valori salvati e i comandi +/− non vengono raddoppiati, dimezzati o corretti con una tara presunta.

## 0.10.98

- Se Interactions non risponde o restituisce un errore temporaneo come HTTP 503, il Coach prova anche generateContent, la seconda interfaccia ufficiale di Google, con lo stesso modello, contesto e schema della seduta. Restano un massimo di tre chiamate e una scadenza complessiva; errori di autenticazione e quota non causano un cambio di canale.
- Il test Gemini mostra un esito persistente, impedisce invii doppi e offre dettagli sicuri dei tentativi senza chiavi API, messaggi privati o corpo delle risposte di errore.

## 0.10.97

- Sagoma delle misure ingrandita e modulo mantenuto sotto il titolo e il comando di ritorno anche dopo gli aggiornamenti automatici della pagina. Conservate tutte le correzioni di ripristino, timer e Gemini della 0.10.96.

## 0.10.96

- Seduta conservata sul dispositivo e su Home Assistant: piano, ordine, serie, pesi, sostituzioni e timer si ripristinano dopo la chiusura. La Home offre “Riprendi allenamento”. Una nuova generazione non sostituisce una seduta aperta; salvataggio ed eliminazione la chiudono senza riaprirla da copie obsolete.
- Cambiare app non mette in pausa: i timer usano il tempo trascorso e conservano la pausa solo quando scelta dall’utente. Rimane la conferma manuale per avviare la fase successiva del tapis roulant.
- Gemini ritenta gli errori temporanei (compreso HTTP 503) entro un limite complessivo, con lo stesso trasporto per generazione, chat e prova connessione. Il fallback locale resta esplicito se il servizio non risponde.
- Misure in un’unica pagina con sagoma grande, campi e istruzioni contestuali; braccio e coscia hanno un solo valore sul lato scelto, con fianchi e polpaccio aggiunti. Storico bilaterale conservato e nuove misure incluse nel contesto AI.

## 0.10.95

- Guida illustrata alle otto misure, con posizione del metro e istruzioni accessibili dal simbolo ⓘ di ogni campo.
- Rimozione dei vecchi campi nascosti duplicati: vengono salvati i valori inseriti nel modulo visibile.
- Dopo l’invio, la domanda viene chiusa; le risposte restano consultabili e modificabili nello storico chiuso.
- Corretto il servizio iPhone troncato e aggiunta la ricerca del notificatore realmente registrato.
- Pulsante per provare la notifica sull’iPhone senza creare nuove domande o cambiare le risposte.

## 0.10.94

- Corretto il collegamento delle domande: ora usa il percorso nativo delle app di Home Assistant.
- Aggiunto il pulsante **Leggi e rispondi** alla notifica mobile, con apertura in primo piano.
- Gestite apertura con app già caricata, ritorno dalla sospensione e riapertura della stessa notifica.
- La notifica pendente precedente viene sostituita una sola volta con il collegamento aggiornato.
- Gli errori di invio al servizio iPhone vengono conservati e mostrati nella pagina della domanda.

## 0.10.93

- Nuova pagina **Domande del Coach**, accessibile da Altro e AI Coach.
- Notifica Home Assistant con collegamento alla domanda e tentativo di avviso sul dispositivo già usato per i promemoria.
- Risposte scritte, salvate e modificabili, utilizzate nelle prossime proposte del Coach.
- Domanda iniziale sulla frequenza prevista e possibilità per Gemini di chiedere un chiarimento durante la preparazione.
- Possibilità di rimandare una domanda di 24 ore; protezioni contro notifiche e invii duplicati.

## 0.10.92

- Correzioni per risposte lente, sostituzioni, segmenti di avanzamento e valori dei carichi salvati.
