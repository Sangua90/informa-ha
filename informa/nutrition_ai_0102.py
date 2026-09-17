import base64, json, urllib.parse, urllib.request, urllib.error
from datetime import date
import measurements_0978 as base
import app as root
import ai_gemini_091 as gem

app=base.app
root.VERSION='0.10.8'

def _catalog():
    try:return root.hass_request('food_scanner/informha/catalog')
    except Exception:return {'items':[]}

def _gemini_parts(parts, prompt, timeout=55):
    cfg=gem._ai_config()
    if cfg['provider']!='gemini' or not cfg['api_key']: raise RuntimeError('Gemini non configurato')
    model=urllib.parse.quote(cfg['model'],safe='-._')
    url=f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    payload={'contents':[{'role':'user','parts':parts+[{'text':prompt}]}],'generationConfig':{'temperature':0.2,'maxOutputTokens':900,'responseMimeType':'application/json'}}
    req=urllib.request.Request(url,data=json.dumps(payload).encode(),method='POST',headers={'Content-Type':'application/json','x-goog-api-key':cfg['api_key']})
    try:
        with urllib.request.urlopen(req,timeout=timeout) as r:data=json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body=e.read().decode(errors='replace');raise RuntimeError(body[:500])
    text=''.join(str(p.get('text','')) for c in data.get('candidates',[]) for p in (c.get('content') or {}).get('parts',[])).strip()
    if text.startswith('```'): text=text.strip('`').replace('json\n','',1)
    return json.loads(text)

def _prompt():
    cat=_catalog(); raw=json.dumps(cat,ensure_ascii=False)[:10000]
    return ('Trascrivi/analizza ciò che la persona sta mangiando. Controlla il catalogo HomeStock qui sotto e usa i suoi dati nutrizionali quando una corrispondenza è chiara; per il resto fai una stima realistica. '
      'Rispondi JSON con: understood (stringa italiana), calories, protein_g, carbs_g, fat_g, fiber_g, items (array con name,quantity,source). Non scegliere il tipo di pasto. HomeStock: '+raw)

@app.post('/api/nutrition/analyze-audio')
def nutrition_audio_0102():
    f=root.request.files.get('audio')
    if not f:return root.jsonify(ok=False,error='Registrazione audio mancante'),400
    data=f.read()
    if not data:return root.jsonify(ok=False,error='Registrazione audio vuota'),400
    mime=(f.mimetype or 'audio/mp4').split(';')[0]
    try:
        out=_gemini_parts([{'inlineData':{'mimeType':mime,'data':base64.b64encode(data).decode()}}],_prompt())
        return root.jsonify(ok=True,**out)
    except Exception as e:return root.jsonify(ok=False,error=str(e)),502

@app.post('/api/nutrition/analyze-photo')
def nutrition_photo_0102():
    f=root.request.files.get('photo')
    if not f:return root.jsonify(ok=False,error='Foto mancante'),400
    data=f.read(); mime=(f.mimetype or 'image/jpeg').split(';')[0]
    try:
        out=_gemini_parts([{'inlineData':{'mimeType':mime,'data':base64.b64encode(data).decode()}}],_prompt())
        return root.jsonify(ok=True,**out)
    except Exception as e:return root.jsonify(ok=False,error=str(e)),502

@app.get('/api/nutrition/entries')
def nutrition_entries_0102():
    con=root.db();rows=[dict(r) for r in con.execute('SELECT * FROM nutrition_entries ORDER BY ts DESC,id DESC LIMIT 500')];con.close();return root.jsonify(ok=True,items=rows)

@app.post('/api/nutrition/entry/<int:entry_id>/update')
def nutrition_update_0102(entry_id):
    x=root.request.get_json(silent=True) or {}; allowed=['meal','name','quantity_g','calories','protein_g','carbs_g','fat_g','fiber_g','notes'];sets=[];vals=[]
    for k in allowed:
        if k in x:sets.append(k+'=?');vals.append(x[k])
    if not sets:return root.jsonify(ok=False,error='Nessuna modifica'),400
    con=root.db();vals.append(entry_id);con.execute('UPDATE nutrition_entries SET '+','.join(sets)+' WHERE id=?',vals);con.commit();con.close();return root.jsonify(ok=True)

@app.delete('/api/nutrition/entry/<int:entry_id>')
def nutrition_delete_0102(entry_id):
    con=root.db();con.execute('DELETE FROM nutrition_entries WHERE id=?',(entry_id,));con.commit();con.close();return root.jsonify(ok=True)

print('[INFORMHA_NUTRITION_AI] version=0.10.8 audio=1 photo=1 homestock=1 history=1 edit=1 delete=1',flush=True)
