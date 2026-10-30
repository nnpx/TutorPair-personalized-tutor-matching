import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSesEmailTransport, type SesSend } from './email-ses.transport.js';
import { EmailSendError } from './email-errors.js';
import { createEmailWorker } from '../../workers/email-dispatch.worker.js';
import type { EmailJob, EmailQueue } from './email.repository.js';
const settings={from:'notifications@tutorpair.example',portalUrl:'https://tutorpair.example/tutor/profile'};
const job: EmailJob={id:'00000000-0000-4000-8000-000000000001',email:'tutor@example.test',event_type:'TUTOR_SELECTED',message:'Selected',attempt_count:1};
for(const event of ['TUTOR_SELECTED','VERIFICATION_APPROVED','VERIFICATION_REJECTED']) {
  test(`mock SES command: ${event} includes correct recipient, sender, UTF-8, both bodies and portal link`,async()=>{
    const signal=new AbortController().signal;
    const send: SesSend=async(command,options)=>{
      assert.equal(options.abortSignal,signal);
      assert.equal(command.input.Source,settings.from);
      assert.deepEqual(command.input.Destination?.ToAddresses,[job.email]);
      assert.equal(command.input.Message?.Subject?.Charset,'UTF-8');
      assert.match(command.input.Message!.Body!.Html!.Data!,/https:\/\/tutorpair.example\/tutor\/profile/);
      assert.ok(command.input.Message!.Body!.Text!.Data!.includes('\n\n'));
      if(event==='VERIFICATION_REJECTED') {
        assert.match(command.input.Message!.Body!.Html!.Data!,/&lt;clear copy&gt;/);
        assert.match(command.input.Message!.Body!.Text!.Data!,/<clear copy>/);
      }
      return {MessageId:'mock-provider-id'};
    };
    await createSesEmailTransport(send,settings)({...job,event_type:event,message:'Please upload a <clear copy>.'},signal);
  });
}
test('missing SES acknowledgement never counts as success',async()=>{
  await assert.rejects(()=>createSesEmailTransport(async()=>({}),settings)(job,new AbortController().signal),
    error=>error instanceof EmailSendError&&error.retryable&&error.code==='SES_MISSING_ACKNOWLEDGEMENT');
});
test('SES throttling retries; rejected mail stops; sensitive provider messages are not propagated',async()=>{
  for(const [name,retryable] of [['Throttling',true],['ServiceUnavailable',true],['AbortError',true],['MessageRejected',false],['MailFromDomainNotVerifiedException',false],['AccessDeniedException',false]] as const){
    const send: SesSend=async()=>{throw Object.assign(new Error('private-recipient@example.test'),{name});};
    await assert.rejects(()=>createSesEmailTransport(send,settings)(job,new AbortController().signal),error=>{
      assert.ok(error instanceof EmailSendError);assert.equal(error.retryable,retryable);assert.doesNotMatch(error.message,/@/);return true;
    });
  }
});
test('invalid recipients and events never call SES; unsafe portal settings are rejected',async()=>{
  let calls=0;const send: SesSend=async()=>{calls++;return{MessageId:'mock-id'};};
  const transport=createSesEmailTransport(send,settings);
  await assert.rejects(()=>transport({...job,email:'bad-address'},new AbortController().signal));
  await assert.rejects(()=>transport({...job,event_type:'UNKNOWN'},new AbortController().signal));
  assert.equal(calls,0);
  assert.throws(()=>createSesEmailTransport(send,{...settings,portalUrl:'http://localhost:5180/tutor/profile'}));
  assert.throws(()=>createSesEmailTransport(send,{...settings,from:'not-an-email'}));
});
test('worker marks permanent SES errors terminal and does not complete the job',async()=>{
  let completed=0;let terminal=false;
  const queue: EmailQueue={claim:async()=>[job],complete:async()=>{completed++;return true;},fail:async(_id,_owner,_delay,value)=>{terminal=!!value;}};
  const transport=createSesEmailTransport(async()=>{throw Object.assign(new Error(),{name:'MessageRejected'});},settings);
  await createEmailWorker(queue,transport).tick();
  assert.equal(completed,0);assert.equal(terminal,true);
});
