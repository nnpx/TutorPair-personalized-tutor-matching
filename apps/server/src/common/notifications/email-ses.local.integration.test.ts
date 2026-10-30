import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pool } from '../../db/client.js';
import { previewEmailQueue, sesEmailQueue } from './email.repository.js';
import { createSesEmailTransport } from './email-ses.transport.js';
import { createEmailWorker } from '../../workers/email-dispatch.worker.js';

test('isolated SES queue: mocked acceptance, preview separation, retries, terminal failure and stale claims',{
  skip:process.env.TUTORPAIR_SES_QUEUE_TESTS!=='1',
},async()=>{
  const target=new URL(process.env.DATABASE_URL!);
  assert.equal(target.hostname,'127.0.0.1');
  assert.match(target.pathname,/^\/tutorpair_notifications_test_ses_/);
  // Dedicated empty database is required: never consume another person's queued emails.
  assert.equal((await pool.query('SELECT count(*)::int AS count FROM notifications')).rows[0].count,0);
  const user=randomUUID();
  await pool.query(`INSERT INTO users(id,cognito_sub,email,role) VALUES($1,$2,$3,'TUTOR')`,[user,user,`${user}@example.test`]);
  async function notice(){
    return (await pool.query(`INSERT INTO notifications(user_id,event_type,message,requires_email,email_status) VALUES($1,'TUTOR_SELECTED','Selected',true,'PENDING') RETURNING id`,[user])).rows[0].id;
  }
  const status=async(id:string)=>(await pool.query('SELECT email_status,email_sent_at FROM notifications WHERE id=$1',[id])).rows[0];
  const clear=()=>pool.query('DELETE FROM notifications WHERE user_id=$1',[user]);
  const settings={from:'notifications@tutorpair.example',portalUrl:'https://tutorpair.example/tutor/profile'};
  try{
    let id=await notice();let owner=randomUUID();
    assert.equal((await previewEmailQueue.claim(owner)).length,1);
    assert.equal(await previewEmailQueue.complete(id,owner),true);
    assert.equal((await status(id)).email_status,'PENDING');
    let accepted=0;
    const success=createEmailWorker(sesEmailQueue,createSesEmailTransport(async()=>{accepted++;return{MessageId:'mock-only-id'};},settings));
    await success.tick();await success.tick();await success.stop();
    assert.equal(accepted,1);assert.equal((await status(id)).email_status,'SENT');assert.ok((await status(id)).email_sent_at);
    await clear();
    id=await notice();
    const temporary=createEmailWorker(sesEmailQueue,createSesEmailTransport(async()=>{throw Object.assign(new Error(),{name:'Throttling'});},settings));
    await temporary.tick();await temporary.stop();
    assert.equal((await status(id)).email_status,'PENDING');
    assert.equal((await sesEmailQueue.claim(randomUUID())).length,0);
    await pool.query(`UPDATE email_deliveries SET next_attempt_at=now()-interval '1 second' WHERE notification_id=$1`,[id]);
    const permanent=createEmailWorker(sesEmailQueue,createSesEmailTransport(async()=>{throw Object.assign(new Error(),{name:'MessageRejected'});},settings));
    await permanent.tick();await permanent.stop();
    assert.equal((await status(id)).email_status,'FAILED');assert.equal((await status(id)).email_sent_at,null);
    await clear();
    id=await notice();owner=randomUUID();await sesEmailQueue.claim(owner);
    await pool.query(`UPDATE email_deliveries SET lease_expires_at=now()-interval '1 second' WHERE notification_id=$1`,[id]);
    const replacement=randomUUID();assert.equal((await sesEmailQueue.claim(replacement)).length,1);
    assert.equal(await sesEmailQueue.complete(id,owner),false);assert.equal((await status(id)).email_status,'PENDING');
    assert.equal(await sesEmailQueue.complete(id,replacement),true);
    await clear();
    id=await notice();owner=randomUUID();await sesEmailQueue.claim(owner);
    await pool.query(`UPDATE email_deliveries SET attempt_count=4,lease_expires_at=now()-interval '1 second' WHERE notification_id=$1`,[id]);
    const exhausted=createEmailWorker(sesEmailQueue,createSesEmailTransport(async()=>{throw Object.assign(new Error(),{name:'Throttling'});},settings));
    await exhausted.tick();await exhausted.stop();
    assert.equal((await status(id)).email_status,'FAILED');
    await clear();
    id=await notice();owner=randomUUID();await sesEmailQueue.claim(owner);
    await pool.query(`UPDATE email_deliveries SET attempt_count=5,lease_expires_at=now()-interval '1 second' WHERE notification_id=$1`,[id]);
    assert.equal((await sesEmailQueue.claim(randomUUID())).length,0);
    assert.equal((await status(id)).email_status,'FAILED');
  }finally{await pool.query('DELETE FROM users WHERE id=$1',[user]);}
});
