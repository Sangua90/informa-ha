"""Boot the entire production import chain against disposable data, not live HA."""
from pathlib import Path
import subprocess
import shutil
import sys
import tempfile

root=Path(__file__).resolve().parents[1]/'informa'
with tempfile.TemporaryDirectory() as directory:
    folder=Path(directory);(folder/'data').mkdir()
    shutil.copytree(root/'web'/'guides_default',folder/'web'/'guides_default')
    for source in root.glob('*.py'):
        text=source.read_text(encoding='utf-8').replace('/data/',folder.as_posix()+'/data/').replace('/app/web',(root/'web').as_posix())
        (folder/source.name).write_text(text,encoding='utf-8')
    script='''
import os,json
from unittest.mock import patch
os.environ['INFORMA_VERSION']='0.10.101'
os.environ.pop('SUPERVISOR_TOKEN',None)
import workout_sessions_01096 as server
client=server.app.test_client()
checks={}
for path in ['/', '/api/state','/api/ai-coach/context','/api/ai-coach/today','/api/coach/week','/api/measurements-0978','/api/nutrition/today','/api/treadmill-0970/plan?minutes=5','/api/coach-questions','/api/workout-session','/api/bodyweight-progression-01099','/api/coach-notes']:
    response=client.get(path);checks[path]=response.status_code
    assert response.status_code==200,(path,response.get_data(as_text=True)[:500])
assert client.post('/api/measurements-0978/reminder-check').status_code==200
assert client.get('/api/exercise-guides-catalog-0962-info').get_json()['exercise_total']==50
assert client.get('/guide-local/bird_dog').status_code==200
assert 'app.js?v=010101' in client.get('/').get_data(as_text=True)
measurement={'hip_cm':105,'calf_cm':40,'arm_l_cm':37,'thigh_l_cm':55,'measurement_side':'left'}
assert client.post('/api/measurements-0978',json=measurement).status_code==200
row=client.get('/api/measurements-0978').get_json()['items'][0]
assert row['hip_cm']==105 and row['arm_l_cm']==37 and row['arm_r_cm'] is None and row['measurement_side']=='left'
assert client.post('/api/measurements-0978',json={'hip_cm':float('nan')}).status_code==400
assert client.post('/api/measurements-0978',json={'calf_cm':-1}).status_code==400
assert client.get('/api/ai-coach/context').get_json()['context']['latest_measurements']['calf_cm']==40
snapshot={'session_id':'smoke-session','plan':[{'id':'chest','name':'Chest press alla macchina','sets':2,'reps':10,'rest':60}], 'options':{'started':123},'flow':{},'names':{},'updated_at':123}
assert client.put('/api/workout-session',json={'revision':0,'snapshot':snapshot}).status_code==200
body={'exercise':'Chest press alla macchina','set_no':1,'reps':10,'weight':5,'request_id':'smoke-session:chest:1'}
wid=client.post('/api/set',json=body).get_json()['workout_id']
assert client.post('/api/set',json=body).get_json()['workout_id']==wid
assert client.post('/api/set',json={**body,'weight':7}).get_json()['saved_set']['weight']==5
archive={'request_id':'smoke:archive:chest','workout_id':wid,'exercise':body['exercise'],'status':'Parziale'}
assert client.post('/api/workout-flow-0949/archive',json=archive).get_json()['status']=='Parziale'
assert client.post('/api/workout-flow-0949/archive',json={**archive,'status':'Saltato'}).get_json()['status']=='Parziale'
assert client.post('/api/workout-flow-0949/archive',json={**archive,'request_id':'smoke:other','status':'Saltato'}).status_code==409
assert client.get('/api/workout-session').get_json()['session']['flow']['chest']['status']=='Parziale'
assert client.post('/api/coach/finish',json={'workout_id':wid,'duration_min':22,'effort':3,'reason':'Tempo finito'}).status_code==200
assert client.get('/api/workout-session').get_json()['session'] is None
assert client.put('/api/workout-session',json={'revision':1,'snapshot':snapshot}).status_code==410
assert client.post('/api/set',json={**body,'set_no':2,'request_id':'smoke:chest:2','workout_id':wid}).status_code==409
detail=client.get('/api/workouts-0933/'+str(wid)).get_json()
assert len(detail['sets'])==1 and detail['workout']['duration_min']==22
tm={'request_id':'smoke:tm','duration_min':5,'save_cardio':True,'phases':[],'fatigue':'Giusta'}
for _ in range(2):assert client.post('/api/treadmill-0970',json=tm).status_code==200
assert len(client.get('/api/treadmill-0970/history').get_json()['items'])==1
week=client.get('/api/coach/week').get_json()
assert week['summary']['sets']==1 and week['summary']['cardio_sessions']==1
ctx=client.get('/api/ai-coach/context').get_json()['context']
assert ctx['training']['session_effort'][0]['effort']==3
with patch.object(server.root,'hass_request',return_value={}) as notify:
    question=client.post('/api/coach-questions/check').get_json()['items'][0]
    client.post('/api/coach-questions/check')
    assert sum(c.args[0].endswith('/create') for c in notify.call_args_list)==1
    answer={'answer':'Due sedute con giorni variabili','revision':0}
    assert client.post('/api/coach-questions/'+str(question['id'])+'/answer',json=answer).status_code==200
    assert client.post('/api/coach-questions/'+str(question['id'])+'/answer',json=answer).status_code==200
ctx=client.get('/api/ai-coach/context').get_json()['context']
assert ctx['coach_dialogue']['answers'][0]['answer']==answer['answer']
# Both the public connection handler and real workout validation use the second
# official API when Interactions returns a long Retry-After.
import urllib.error,io
class GeminiResponse:
    def __init__(self,text):self.text=text
    def __enter__(self):return self
    def __exit__(self,*args):pass
    def read(self):return json.dumps({'candidates':[{'finishReason':'STOP','content':{'parts':[{'text':self.text}]}}]}).encode()
provider_calls=[]
def provider(req,timeout):
    provider_calls.append(req.full_url)
    if req.full_url.endswith('/interactions'):
        raise urllib.error.HTTPError('test',503,'busy',{'Retry-After':'120'},io.BytesIO(b'{"error":{"code":"service_unavailable"}}'))
    payload=json.loads(req.data)
    assert '/models/gemini-3.6-flash:generateContent' in req.full_url
    if payload['generationConfig']['responseFormat']['text']['schema']['required']==['changes']:
        return GeminiResponse(json.dumps({'changes':[{'exercise_id':'bird_dog','reps':20,'unit':'reps'}]}))
    if 'test di connessione' in payload['contents'][0]['parts'][0]['text']:
        assert payload['generationConfig']['responseFormat']['text']['schema']['required']==['connection']
        return GeminiResponse(json.dumps({'connection':'ok'}))
    context=server.training.unified_context();sources=context['coverage']['sources']+['checkin']
    assert payload['generationConfig']['responseFormat']['text']['schema']['required']==['decision','reason','data_used','items']
    return GeminiResponse(json.dumps({'decision':'train','reason':'Dati recenti considerati','data_used':sources,'items':[{'id':'bird_dog' if context.get('coach_notes',{}).get('exercise_preferences') else 'chest','sets':2,'reps':6 if context.get('coach_notes',{}).get('exercise_preferences') else 10,'rest':60,'load_policy':'maintain'},{'id':'plank','sets':2,'reps':30,'rest':60,'load_policy':'maintain'}]}))
with patch.object(server.training.config,'_ai_config_092',return_value={'provider':'gemini','model':'gemini-3.6-flash','api_key':'smoke-not-secret'}),patch.object(server.training.urllib.request,'urlopen',provider),patch.object(server.training.time,'sleep'):
    connection=client.post('/api/ai/test')
    assert connection.status_code==200,connection.get_json()
    assert connection.get_json()['connected'] and connection.get_json()['connection']['api']=='generateContent'
    assert connection.get_json()['connection']['structured_output']
    proposal=client.post('/api/ai-workout-01089',json={'exercise_count':2,'minutes':45,'energy':'Normale','pain':'Nessuno'}).get_json()
    assert proposal['mode']=='gemini',proposal
    assert proposal['plan'][1]['repType']=='seconds' and proposal['plan'][1]['reps']==30
    note={'request_id':'smoke-note-001','exercise_id':'bird_dog','body':'Vorrei 20 ripetizioni per lato'}
    preview=client.post('/api/coach-notes',json={**note,'preview':True}).get_json()
    assert preview['preview'] and not preview['applied'] and preview['changes'][0]['reps']==20
    assert client.get('/api/coach-notes').get_json()['items']==[]
    with server.root.db() as con:counts_before=tuple(con.execute('SELECT (SELECT COUNT(*) FROM workouts),(SELECT COUNT(*) FROM sets)').fetchone())
    saved=client.post('/api/coach-notes',json=note).get_json()['note']
    assert client.post('/api/coach-notes',json=note).get_json()['note']['id']==saved['id']
    proposal=client.post('/api/ai-workout-01089',json={'exercise_count':2,'minutes':45,'energy':'Normale','pain':'Nessuno'}).get_json()
    assert proposal['mode']=='gemini' and proposal['plan'][0]['id']=='bird_dog',proposal
    assert proposal['plan'][0]['reps']==20 and proposal['plan'][0]['perSide']
    assert 'coach_notes' in proposal['data_used']
    with server.root.db() as con:assert tuple(con.execute('SELECT (SELECT COUNT(*) FROM workouts),(SELECT COUNT(*) FROM sets)').fetchone())==counts_before
    con.close()
    assert client.post('/api/coach-notes/'+str(saved['id'])+'/active',json={'active':False}).status_code==200
    assert client.get('/api/bodyweight-progression-01099').get_json()['exercise_preferences']=={}
assert len(provider_calls)==10
print('SMOKE_RESULT',json.dumps({'GET':checks,'set_retry':'one set, original values','archive_retry':'canonical status preserved','finish':'duration/effort saved','closed_session':'rejected','treadmill_retry':'one atomic session','context_effort':True,'gemini_failover':'connection and validated timed workout through generateContent','coach_questions':'one notification, answer retry, fresh AI context','coach_notes':'preview without writes, idempotent save, Bird dog 20 per side in validated plan, archive clears','guide':'bundled Bird dog served, catalog 50'}))
'''
    result=subprocess.run([sys.executable,'-X','utf8','-c',script],cwd=folder,text=True,capture_output=True)
    print(result.stdout)
    if result.returncode:print(result.stderr)
    raise SystemExit(result.returncode)
