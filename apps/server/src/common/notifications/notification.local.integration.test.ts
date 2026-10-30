import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { createApp } from '../../app.js';
import { pool } from '../../db/client.js';
import { previewEmailQueue } from './email.repository.js';
import { createFileEmailTransport } from './email-preview.transport.js';
import { createEmailWorker } from '../../workers/email-dispatch.worker.js';

test('isolated database: confirmation → tutor bell → leased local email preview', {
  skip: process.env.TUTORPAIR_ISOLATED_TESTS !== '1',
}, async () => {
  const target = new URL(process.env.DATABASE_URL!);
  assert.ok(['127.0.0.1', 'localhost'].includes(target.hostname));
  assert.match(target.pathname, /^\/tutorpair_notifications_test_/);
  const student = randomUUID(), tutor = randomUUID(), other = randomUUID(), subject = randomUUID(), variant = randomUUID();
  const run = randomUUID();
  const directory = await mkdtemp(join(tmpdir(), 'tutorpair-db-email-'));
  const token = (name: string) => `Bearer mock-token-${run}-${name}`;
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  async function request(name: string, path: string, method = 'GET', body?: unknown) {
    const res = await fetch(base + path, { method, headers: { Authorization: token(name), 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: res.status, body: await res.json() as { data: any } };
  }
  try {
    await pool.query(`INSERT INTO users (id,cognito_sub,email,role) VALUES
      ($1,$4,$7,'STUDENT'),($2,$5,$8,'TUTOR'),($3,$6,$9,'TUTOR')`,
      [student,tutor,other,`${run}-student`,`${run}-tutor`,`${run}-other`,`${run}-student@example.test`,`${run}-tutor@example.test`,`${run}-other@example.test`]);
    await pool.query(`INSERT INTO students (user_id,first_name,last_name,grade_level,tutor_type_pref,style_profile,personality_profile,budget_max)
      VALUES ($1,'Test','Student','G6','ANY',ARRAY[3,3,3,3,3],ARRAY[3,3,3,3],500)`,[student]);
    await pool.query(`INSERT INTO tutors (user_id,first_name,last_name,phone_number,tutor_type,style_profile,personality_profile,verification_status)
      VALUES ($1,'Test','Tutor','0800000000','FREELANCE',ARRAY[3,3,3,3,3],ARRAY[3,3,3,3],'APPROVED')`,[tutor]);
    await pool.query(`INSERT INTO subjects (id,name,category) VALUES ($1,$2,'GENERAL_LEARNING')`,[subject,`Notification Test ${run}`]);
    await pool.query(`INSERT INTO subject_variants (id,subject_id,name,learning_goal) VALUES ($1,$2,'Grade 6','SCHOOL_CURRICULUM')`,[variant,subject]);
    await pool.query(`INSERT INTO tutor_subjects (tutor_id,variant_id,hourly_rate,grade_levels) VALUES ($1,$2,400,ARRAY['G6'])`,[tutor,variant]);
    await pool.query(`INSERT INTO availabilities (user_id,day_of_week,start_time,end_time) VALUES ($1,'MONDAY','17:00','19:00'),($2,'MONDAY','17:00','19:00')`,[student,tutor]);
    const matches = await request('student','/api/matching','POST',{variant_id:variant});
    assert.equal(matches.status,200);
    const rec = matches.body.data.recommendations.find((r: any) => r.tutor.tutor_id === tutor);
    assert.ok(rec);
    const path = `/api/matching/${matches.body.data.match_request_id}/confirm`;
    const input = { recommendation_id:rec.recommendation_id,tutor_id:tutor };
    const confirmations = await Promise.all([request('student',path,'POST',input),request('student',path,'POST',input)]);
    assert.deepEqual(confirmations.map(r=>r.status).sort(),[200,409]);
    const notices = await request('tutor','/api/notifications');
    assert.equal(notices.status,200); assert.equal(notices.body.data.unreadCount,1);
    assert.equal(notices.body.data.items.length,1);
    const notice = notices.body.data.items[0];
    assert.equal((await request('other',`/api/notifications/${notice.id}/read`,'PATCH')).status,404);
    assert.equal((await request('other','/api/notifications')).body.data.items.length,0);
    const ownerA=randomUUID(),ownerB=randomUUID();
    const [a,b] = await Promise.all([previewEmailQueue.claim(ownerA),previewEmailQueue.claim(ownerB)]);
    assert.equal([...a,...b].filter(j=>j.id===notice.id).length,1);
    const originalOwner=a.some(j=>j.id===notice.id)?ownerA:ownerB;
    await pool.query(`UPDATE email_deliveries SET lease_expires_at=now()-interval '1 second' WHERE notification_id=$1`,[notice.id]);
    const recoveryOwner=randomUUID();
    assert.ok((await previewEmailQueue.claim(recoveryOwner)).some(j=>j.id===notice.id));
    assert.equal(await previewEmailQueue.complete(notice.id,originalOwner),false);
    await previewEmailQueue.fail(notice.id,recoveryOwner,0);
    const worker=createEmailWorker(previewEmailQueue,createFileEmailTransport(directory,'http://localhost:5180/tutor/profile'));
    await worker.tick(); await worker.stop();
    const email=JSON.parse(await readFile(join(directory,`${notice.id}.json`),'utf8'));
    assert.equal(email.preview,true); assert.equal(email.to,`${run}-tutor@example.test`);
    assert.match(email.html,/A student has selected you as their tutor/);
    const rows=await pool.query(`SELECT n.email_status,d.completed_at,d.attempt_count FROM notifications n JOIN email_deliveries d ON d.notification_id=n.id WHERE n.id=$1`,[notice.id]);
    assert.equal(rows.rows[0].email_status,'PENDING'); assert.ok(rows.rows[0].completed_at);
    assert.equal(rows.rows[0].attempt_count,3);
    assert.equal((await request('tutor',`/api/notifications/${notice.id}/read`,'PATCH')).status,200);
    assert.equal((await request('tutor','/api/notifications')).body.data.unreadCount,0);
    assert.equal((await request('tutor','/api/notifications/read-all','PATCH')).status,200);
  } finally {
    await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[[student,tutor,other]]);
    await pool.query('DELETE FROM subjects WHERE id=$1',[subject]);
    server.closeAllConnections();
    await new Promise<void>(resolve=>server.close(()=>resolve()));
    await rm(directory,{recursive:true,force:true});
  }
});

test('isolated database: admin rejection and approval produce the correct tutor emails atomically', {
  skip: process.env.TUTORPAIR_ISOLATED_TESTS !== '1',
}, async () => {
  const target = new URL(process.env.DATABASE_URL!);
  assert.ok(['127.0.0.1', 'localhost'].includes(target.hostname));
  assert.match(target.pathname, /^\/tutorpair_notifications_test_/);
  const { notificationService } = await import('./notification.service.js');
  const originalNotify = notificationService.createNotification;
  const admin=randomUUID(),tutor=randomUUID(),run=randomUUID();
  const directory=await mkdtemp(join(tmpdir(),'tutorpair-admin-email-'));
  const server=createApp().listen(0,'127.0.0.1');
  await new Promise<void>(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  async function verify(who: string, input: unknown) {
    return fetch(`${base}/api/admin/tutors/${tutor}/verify`,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer mock-token-${run}-${who}`},body:JSON.stringify(input)});
  }
  try {
    await pool.query(`INSERT INTO users (id,cognito_sub,email,role) VALUES ($1,$3,$5,'ADMIN'),($2,$4,$6,'TUTOR')`,[admin,tutor,`${run}-admin`,`${run}-tutor`,`${run}-admin@example.test`,`${run}-tutor@example.test`]);
    await pool.query(`INSERT INTO tutors (user_id,first_name,last_name,phone_number,tutor_type,style_profile,personality_profile) VALUES ($1,'Review','Tutor','0800000000','FREELANCE',ARRAY[3,3,3,3,3],ARRAY[3,3,3,3])`,[tutor]);
    assert.equal((await verify('tutor',{status:'APPROVED'})).status,403);
    assert.equal((await verify('admin',{status:'REJECTED',rejection_reason:'  '})).status,400);
    const reason='Your IELTS report is blurry.\nPlease upload a clear copy. <untrusted text>';
    assert.equal((await verify('admin',{status:'REJECTED',rejection_reason:reason})).status,200);
    assert.equal((await verify('admin',{status:'REJECTED',rejection_reason:reason})).status,200);
    let notices=(await pool.query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at,id',[tutor])).rows;
    assert.equal(notices.length,1);assert.equal(notices[0].event_type,'VERIFICATION_REJECTED');
    assert.ok(notices[0].message.includes(reason));
    assert.equal((await verify('admin',{status:'APPROVED'})).status,200);
    assert.equal((await verify('admin',{status:'APPROVED'})).status,200);
    notices=(await pool.query('SELECT * FROM notifications WHERE user_id=$1',[tutor])).rows;
    assert.equal(notices.length,2);
    notificationService.createNotification=async()=>{throw new Error('Simulated notification failure for rollback check');};
    assert.equal((await verify('admin',{status:'REJECTED',rejection_reason:'Recheck'})).status,500);
    notificationService.createNotification=originalNotify;
    assert.equal((await pool.query('SELECT verification_status FROM tutors WHERE user_id=$1',[tutor])).rows[0].verification_status,'APPROVED');
    assert.equal((await pool.query('SELECT count(*)::int AS count FROM notifications WHERE user_id=$1',[tutor])).rows[0].count,2);
    const worker=createEmailWorker(previewEmailQueue,createFileEmailTransport(directory,'http://localhost:5180/tutor/profile'));
    await worker.tick();await worker.stop();
    for(const notice of notices){
      const email=JSON.parse(await readFile(join(directory,`${notice.id}.json`),'utf8'));
      assert.equal(email.to,`${run}-tutor@example.test`);
      assert.match(email.html,/http:\/\/localhost:5180\/tutor\/profile/);
      assert.ok(email.text.includes('Hi there,\n\n'));assert.ok(!email.text.includes('\\n'));
      if(notice.event_type==='VERIFICATION_REJECTED'){
        assert.ok(email.text.includes(reason));assert.match(email.html,/&lt;untrusted text&gt;/);assert.doesNotMatch(email.html,/<untrusted text>/);
      } else {assert.match(email.subject,/approved/);}
    }
  } finally {
    notificationService.createNotification=originalNotify;
    await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[[admin,tutor]]);
    server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));
    await rm(directory,{recursive:true,force:true});
  }
});
