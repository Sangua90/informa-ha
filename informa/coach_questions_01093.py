"""Persistent Coach questions, HA notification links and answers in AI context."""
from contextlib import closing
from datetime import datetime, timedelta
import hashlib
import json
import re
import time
import urllib.request

import logic_audit_01091 as base
import ai_training_01089 as training
import app as root

app = base.app
TOPICS = ('frequency', 'equipment', 'recovery', 'preferences', 'exercise_feedback')
FREQUENCY = 'Quante volte pensi di riuscire ad allenarti in una settimana? Puoi indicare anche i giorni abituali oppure scrivere che la frequenza è variabile.'


with closing(root.db()) as con:
    con.executescript('''
    CREATE TABLE IF NOT EXISTS coach_questions(
        id INTEGER PRIMARY KEY, topic TEXT NOT NULL, body TEXT NOT NULL,
        fingerprint TEXT NOT NULL UNIQUE, source TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'open', answer TEXT, revision INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL, answered_at TEXT, deferred_until TEXT,
        notified_at TEXT, notify_lease REAL NOT NULL DEFAULT 0,
        notify_retry_at REAL NOT NULL DEFAULT 0, notify_error TEXT,
        notification_format INTEGER NOT NULL DEFAULT 0,
        mobile_notified_at TEXT, mobile_error TEXT);
    CREATE TABLE IF NOT EXISTS coach_question_answers(
        question_id INTEGER NOT NULL, revision INTEGER NOT NULL,
        answer TEXT NOT NULL, answered_at TEXT NOT NULL,
        PRIMARY KEY(question_id,revision));
    CREATE TABLE IF NOT EXISTS coach_notification_test(id INTEGER PRIMARY KEY CHECK(id=1),sent_at REAL NOT NULL);
    ''')
    existing={r[1] for r in con.execute('PRAGMA table_info(coach_questions)')}
    for name,kind in [('notification_format','INTEGER NOT NULL DEFAULT 0'),('mobile_notified_at','TEXT'),('mobile_error','TEXT')]:
        if name not in existing:con.execute(f'ALTER TABLE coach_questions ADD COLUMN {name} {kind}')
    con.commit()


def public(row):
    return {k: row[k] for k in ('id','topic','body','source','state','answer','revision','created_at','answered_at','deferred_until','notified_at')} | {'notification_pending': row['state']=='open' and (not row['notified_at'] or row['notification_format']<2 or bool(row['mobile_error'])), 'mobile_notified':bool(row['mobile_notified_at']), 'mobile_notification_error':row['mobile_error']}


def listing():
    with closing(root.db()) as con:
        return [public(r) for r in con.execute("SELECT * FROM coach_questions ORDER BY (state='open') DESC,id DESC LIMIT 50")]


def active_question():
    with closing(root.db()) as con:
        row = con.execute("SELECT * FROM coach_questions WHERE state='open' AND (deferred_until IS NULL OR deferred_until<=?) ORDER BY id LIMIT 1", (datetime.now().isoformat(timespec='seconds'),)).fetchone()
        return public(row) if row else None


def create_question(topic, body, source='gemini'):
    if topic not in TOPICS or not isinstance(body,str) or not 15 <= len(body.strip()) <= 600:
        raise ValueError('Domanda del Coach non valida')
    body=body.strip();fingerprint=hashlib.sha256((topic+':'+re.sub(r'\s+',' ',body).casefold()).encode()).hexdigest()
    with closing(root.db()) as con:
        con.execute('BEGIN IMMEDIATE')
        previous=con.execute('SELECT * FROM coach_questions WHERE fingerprint=?',(fingerprint,)).fetchone()
        if previous:
            con.commit();return public(previous) if previous['state']=='open' else None
        # One outstanding question, including one postponed by the user.
        previous=con.execute("SELECT * FROM coach_questions WHERE state='open' ORDER BY id LIMIT 1").fetchone()
        if previous:
            con.commit();return public(previous)
        if source=='gemini' and con.execute('SELECT 1 FROM coach_questions WHERE topic=? AND answered_at>=?',(topic,(datetime.now()-timedelta(days=7)).isoformat(timespec='seconds'))).fetchone():
            con.commit();return None
        id=con.execute('INSERT INTO coach_questions(topic,body,fingerprint,source,created_at) VALUES(?,?,?,?,?)',(topic,body,fingerprint,source,datetime.now().isoformat(timespec='seconds'))).lastrowid
        row=con.execute('SELECT * FROM coach_questions WHERE id=?',(id,)).fetchone();con.commit()
        return public(row)


_panel = None
def panel_path():
    global _panel
    if _panel:return _panel
    # Supervisor knows the installed repository prefix; never put its token in a URL.
    try:
        token=root.supervisor_token()
        if not token:raise RuntimeError('No supervisor')
        req=urllib.request.Request('http://supervisor/addons/self/info',headers={'Authorization':'Bearer '+token})
        with urllib.request.urlopen(req,timeout=5) as response:
            slug=json.load(response)['data']['slug']
        if not re.fullmatch('[a-z0-9_]+',slug):raise ValueError('Invalid slug')
        _panel='/'+slug
    except Exception:
        # Existing panel in this repository's installation.
        _panel='/a16ac2b1_informa'
    return _panel


def iphone_service():
    # Select the registered phone, never a tablet or a guessed group notifier.
    preferred=('mobile_app_iphone_17pro_di_edo','mobile_app_iphone_17pro_di')
    try:registry=root.hass_request('services',timeout=5)
    except Exception:return preferred[0]  # Verified service in this installation.
    if not isinstance(registry,list):return preferred[0]
    choices={name for domain in registry if domain.get('domain')=='notify' for name in domain.get('services',{}) if re.fullmatch(r'mobile_app_iphone[a-z0-9_]*',name)}
    for name in preferred:
        if name in choices:return name
    if len(choices)==1:return next(iter(choices))
    raise RuntimeError('Notificatore iPhone non disponibile o non univoco')


def mobile_data(link,tag):
    return {'url':link,'clickAction':link,'tag':tag,'actions':[{'action':'URI','title':'Leggi e rispondi','uri':link,'activationMode':'foreground'}]}


def notify_question(id):
    now=time.time()
    with closing(root.db()) as con:
        claimed=con.execute("UPDATE coach_questions SET notify_lease=? WHERE id=? AND state='open' AND (notified_at IS NULL OR notification_format<2 OR mobile_error IS NOT NULL) AND notify_lease<? AND notify_retry_at<=? AND (deferred_until IS NULL OR deferred_until<=?)",(now+120,id,now,now,datetime.now().isoformat(timespec='seconds'))).rowcount
        con.commit()
    if not claimed:return False
    link='/app/'+panel_path().strip('/')+'/coachquestions/'+str(id)
    tag='informa_coach_question_'+str(id)
    try:
        # Keep question/answer contents out of notifications and lock-screen previews.
        root.hass_request('services/persistent_notification/create',method='POST',payload={
            'title':'InFormha · Il Coach ha una domanda',
            'message':'C’è una domanda per personalizzare le tue prossime sedute. [Leggi la domanda e rispondi]('+link+')',
            'notification_id':tag},timeout=10)
    except Exception:
        with closing(root.db()) as con:
            con.execute('UPDATE coach_questions SET notify_lease=0,notify_retry_at=?,notify_error=? WHERE id=?',(now+300,'Notifica Home Assistant non disponibile',id));con.commit()
        return False
    # The same Companion notifier is already used by measurement reminders.
    mobile_at=None;mobile_error=None
    try:
        root.hass_request('services/notify/'+iphone_service(),method='POST',payload={
            'title':'InFormha · Domanda del Coach','message':'Apri InFormha per leggere la domanda e inviare la tua risposta.',
            'data':mobile_data(link,tag)},timeout=10)
        mobile_at=datetime.now().isoformat(timespec='seconds')
    except Exception:
        mobile_error='Invio all’iPhone non confermato. La domanda resta disponibile in InFormha.'
    with closing(root.db()) as con:
        con.execute('UPDATE coach_questions SET notified_at=?,notify_lease=0,notify_error=NULL,notification_format=2,mobile_notified_at=?,mobile_error=?,notify_retry_at=? WHERE id=?',(datetime.now().isoformat(timespec='seconds'),mobile_at,mobile_error,now+300 if mobile_error else 0,id));con.commit()
        row=con.execute('SELECT state FROM coach_questions WHERE id=?',(id,)).fetchone()
    if row and row['state']=='answered':dismiss_notification(id)
    return True


def dismiss_notification(id):
    try:
        root.hass_request('services/persistent_notification/dismiss',method='POST',payload={'notification_id':'informa_coach_question_'+str(id)},timeout=5)
    except Exception:
        pass


def check_questions():
    with closing(root.db()) as con:
        frequency=con.execute("SELECT 1 FROM coach_questions WHERE topic='frequency'").fetchone()
    if not frequency:create_question('frequency',FREQUENCY,'initial_setup')
    for question in listing():
        if question['state']=='open':notify_question(question['id'])
    return active_question()


def ai_question(value):
    q=create_question(value.get('topic'),value.get('text'))
    if q:notify_question(q['id'])
    return active_question() if q else None


@app.get('/api/coach-questions')
def coach_questions_list():
    return root.jsonify(ok=True,items=listing())


@app.post('/api/coach-questions/test-notification')
def coach_notification_test():
    now=time.time()
    with closing(root.db()) as con:
        con.execute('BEGIN IMMEDIATE');last=con.execute('SELECT sent_at FROM coach_notification_test WHERE id=1').fetchone()
        if last and now-last['sent_at']<60:return root.jsonify(ok=False,error='Attendi un minuto prima di riprovare la notifica'),429
        con.execute('INSERT OR REPLACE INTO coach_notification_test(id,sent_at) VALUES(1,?)',(now,))
        q=con.execute("SELECT id FROM coach_questions ORDER BY (state='open') DESC,id DESC LIMIT 1").fetchone();con.commit()
    link='/app/'+panel_path().strip('/')+('/coachquestions/'+str(q['id']) if q else '')
    try:
        root.hass_request('services/notify/'+iphone_service(),method='POST',payload={'title':'InFormha · Prova notifica','message':'Tocca per aprire InFormha e le domande del Coach.','data':mobile_data(link,'informa_coach_test')},timeout=10)
    except Exception:return root.jsonify(ok=False,error='Notifica iPhone non inviata. La domanda resta disponibile in InFormha.'),502
    return root.jsonify(ok=True)


@app.post('/api/coach-questions/check')
def coach_questions_check():
    check_questions()
    return root.jsonify(ok=True,items=listing())


@app.post('/api/coach-questions/<int:id>/answer')
def coach_question_answer(id):
    x=root.request.get_json(silent=True)
    if not isinstance(x,dict) or not isinstance(x.get('answer'),str) or not 1<=len(x['answer'].strip())<=2000 or type(x.get('revision')) is not int or x['revision']<0:
        return root.jsonify(ok=False,error='Scrivi una risposta da 1 a 2000 caratteri'),400
    answer=x['answer'].strip()
    with closing(root.db()) as con:
        con.execute('BEGIN IMMEDIATE');row=con.execute('SELECT * FROM coach_questions WHERE id=?',(id,)).fetchone()
        if not row:return root.jsonify(ok=False,error='Domanda non trovata'),404
        if row['revision']!=x['revision']:
            # A lost acknowledgement can be retried without creating another revision.
            if row['state']=='answered' and row['answer']==answer:return root.jsonify(ok=True,question=public(row))
            return root.jsonify(ok=False,error='La risposta è stata aggiornata su un altro dispositivo. Ricarica la domanda prima di modificarla.'),409
        if row['state']=='answered' and row['answer']==answer:return root.jsonify(ok=True,question=public(row))
        at=datetime.now().isoformat(timespec='seconds');revision=row['revision']+1
        con.execute("UPDATE coach_questions SET answer=?,revision=?,answered_at=?,state='answered',deferred_until=NULL WHERE id=?",(answer,revision,at,id))
        con.execute('INSERT INTO coach_question_answers(question_id,revision,answer,answered_at) VALUES(?,?,?,?)',(id,revision,answer,at))
        out=public(con.execute('SELECT * FROM coach_questions WHERE id=?',(id,)).fetchone());con.commit()
    dismiss_notification(id)
    return root.jsonify(ok=True,question=out)


@app.post('/api/coach-questions/<int:id>/postpone')
def coach_question_postpone(id):
    with closing(root.db()) as con:
        con.execute("UPDATE coach_questions SET deferred_until=? WHERE id=? AND state='open'",((datetime.now()+timedelta(hours=24)).isoformat(timespec='seconds'),id))
        row=con.execute('SELECT * FROM coach_questions WHERE id=?',(id,)).fetchone();con.commit()
    if not row:return root.jsonify(ok=False,error='Domanda non trovata'),404
    return root.jsonify(ok=True,question=public(row))


_context=training.unified_context
_safe=training.safe_context
def question_context():
    ctx=_context();questions=listing()
    # Keep the declared frequency available even after many later conversations.
    with closing(root.db()) as con:
        frequency=con.execute("SELECT * FROM coach_questions WHERE topic='frequency' AND state='answered' ORDER BY answered_at DESC,id DESC LIMIT 1").fetchone()
    answers=[q for q in questions if q['state']=='answered']
    if frequency:answers=[public(frequency)]+[q for q in answers if q['id']!=frequency['id']]
    ctx['coach_dialogue']={
        'answers':[{'topic':q['topic'],'question':q['body'],'answer':q['answer'],'answered_at':q['answered_at']} for q in answers[:20]],
        'pending':[{'topic':q['topic'],'question':q['body'],'deferred_until':q['deferred_until']} for q in questions if q['state']=='open'],
        'meaning':'Risposte dichiarate dall’utente; non sono allenamenti eseguiti né misure rilevate.'}
    if ctx['coach_dialogue']['answers']:ctx['coverage']['sources'].append('coach_answers')
    return ctx


def safe_question_context(ctx):
    return _safe(ctx)|{'coach_dialogue':ctx.get('coach_dialogue') or {}}


training.unified_context=question_context
training.safe_context=safe_question_context
training.coach._coach_context_090=question_context
training.context93._enhanced_context_093=question_context
training.context93._safe_context_093=safe_question_context
training.gemini._safe_context=safe_question_context
app.config['COACH_QUESTION_GATE']=check_questions
app.config['COACH_QUESTION_HANDLER']=ai_question
