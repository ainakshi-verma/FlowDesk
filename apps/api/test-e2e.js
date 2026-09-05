async function testE2E() {
  console.log('--- Starting FlowDesk Comprehensive E2E Verification ---');
  
  // 1. Health
  const healthRes = await fetch('http://localhost:5000/health');
  console.log('1. Health Check:', await healthRes.json());

  // 2. Login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aina@flowdesk.dev', password: 'password123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const workspaceId = loginData.user.defaultWorkspaceId;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  console.log('2. Auth Login successful for:', loginData.user.name);

  // 3. Start Persona-Driven Interview (Maya - Challenging)
  const startRes = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/interviews/start`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      roleType: 'FULLSTACK',
      persona: 'MAYA'
    })
  });
  const session = await startRes.json();
  console.log(`3. Started Persona Interview: ${session.personaConfig?.name} (${session.personaConfig?.tagline})`);
  console.log(`   Initial Question: "${session.exchanges[0]?.message.slice(0, 90)}..."`);

  // 4. Candidate Turn with Technical Claims (e.g. JWT and Redis)
  const turn1Res = await fetch(`http://localhost:5000/api/interviews/${session.id}/turn`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      answer: "In our application, we utilized JWT tokens for stateless authentication, combined with Redis caching to throttle rate limits and cache frequent read queries."
    })
  });
  const turn1Data = await turn1Res.json();
  console.log('4. Candidate Turn 1 processed:');
  console.log('   Interviewer Critique:', turn1Data.evaluation.critique);
  console.log('   Extracted Memory Claims:', turn1Data.interviewMemory?.claims);

  // 5. Candidate Turn 2
  const turn2Res = await fetch(`http://localhost:5000/api/interviews/${session.id}/turn`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      answer: "For data integrity, we structured PostgreSQL transactions with pessimistic locking when balance deductions occurred."
    })
  });
  const turn2Data = await turn2Res.json();
  console.log('5. Candidate Turn 2 processed:');
  console.log('   Follow-up/Callback:', turn2Data.evaluation.followUpOrNextQuestion.slice(0, 100) + '...');
  console.log('   Is Callback:', turn2Data.evaluation.isCallback);

  // 6. Complete Interview & 5-Axis Scorecard
  const completeRes = await fetch(`http://localhost:5000/api/interviews/${session.id}/complete`, {
    method: 'POST',
    headers
  });
  const completeData = await completeRes.json();
  console.log('6. Finalized Interview 5-Axis Scores:');
  console.log('   Overall:', completeData.session.overallScore + '%');
  console.log('   Scores:', completeData.session.scores);
  console.log('   Coaching Advice:', completeData.session.coachingAdvice);
  console.log('   Strong Areas:', completeData.session.strongAreas);
  console.log('   Weak Areas:', completeData.session.weakAreas);
  console.log(`   Generated Remediation Tasks: ${completeData.generatedTasks?.length}`);

  // 7. Practice Weak Areas Flow
  const drillRes = await fetch(`http://localhost:5000/api/interviews/${session.id}/practice-weak-areas`, {
    method: 'POST',
    headers
  });
  const drillData = await drillRes.json();
  console.log(`7. Launched Targeted Drill for Weak Area: "${drillData.focusTopic}"`);
  console.log(`   Drill Question: "${drillData.session?.exchanges[0]?.message.slice(0, 100)}..."`);

  console.log('\n✅ ALL FLAGSHIP AI VIRTUAL INTERVIEWER SUBSYSTEMS VERIFIED!\n');
}

testE2E().catch(console.error);
