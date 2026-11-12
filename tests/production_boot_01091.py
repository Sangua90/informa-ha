"""Boot the entire production import chain against disposable data, not live HA."""
from pathlib import Path
import subprocess
import sys
import tempfile

root=Path(__file__).resolve().parents[1]/'informa'
with tempfile.TemporaryDirectory() as directory:
    folder=Path(directory);(folder/'data').mkdir()
    for source in root.glob('*.py'):
        text=source.read_text(encoding='utf-8').replace('/data/',folder.as_posix()+'/data/').replace('/app/web',(root/'web').as_posix())
        (folder/source.name).write_text(text,encoding='utf-8')
    script='''
import os,json
from unittest.mock import patch
os.environ['INFORMA_VERSION']='0.10.94'
os.environ.pop('SUPERVISOR_TOKEN',None)
import coach_questions_01093 as server
client=server.app.test_client()
checks={}
for path in ['/', '/api/state','/api/ai-coach/context','/api/ai-coach/today','/api/coach/week','/api/measurements-0978','/api/nutrition/today','/api/treadmill-0970/plan?minutes=5','/api/coach-questions']:
    response=client.get(path);checks[path]=response.status_code
    assert response.status_code==200,(path,response.get_data(as_text=True)[:500])
assert client.post('/api/measurements-0978/reminder-check').status_code==200
assert 'app.js?v=01094' in client.get('/').get_data(as_text=True)
body={'exercise':'Chest press alla macchina','set_no':1,'reps':10,'weight':5,'request_id':'smoke:chest:1'}
wid=client.post('/api/set',json=body).get_json()['workout_id']
assert client.post('/api/set',json=body).get_json()['workout_id']==wid
assert client.post('/api/set',json={**body,'weight':7}).get_json()['saved_set']['weight']==5
archive={'request_id':'smoke:archive:chest','workout_id':wid,'exercise':body['exercise'],'status':'Parziale'}
assert client.post('/api/workout-flow-0949/archive',json=archive).get_json()['status']=='Parziale'
assert client.post('/api/workout-flow-0949/archive',json={**archive,'status':'Saltato'}).get_json()['status']=='Parziale'
assert client.post('/api/workout-flow-0949/archive',json={**archive,'request_id':'smoke:other','status':'Saltato'}).status_code==409
assert client.post('/api/coach/finish',json={'workout_id':wid,'duration_min':22,'effort':3,'reason':'Tempo finito'}).status_code==200
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
print('SMOKE_RESULT',json.dumps({'GET':checks,'set_retry':'one set, original values','archive_retry':'canonical status preserved','finish':'duration/effort saved','closed_session':'rejected','treadmill_retry':'one atomic session','context_effort':True,'coach_questions':'one notification, answer retry, fresh AI context'}))
'''
    result=subprocess.run([sys.executable,'-X','utf8','-c',script],cwd=folder,text=True,capture_output=True)
    print(result.stdout)
    if result.returncode:print(result.stderr)
    raise SystemExit(result.returncode)
