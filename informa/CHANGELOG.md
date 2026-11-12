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
