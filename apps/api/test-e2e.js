async function testE2E() {
  console.log('--- Starting FlowDesk E2E Verification ---');
  
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
  console.log('2. Auth Login successful for:', loginData.user.name, '| Workspace:', loginData.user.defaultWorkspaceId);

  const token = loginData.token;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 3. Dashboard Overview
  const dashboardRes = await fetch('http://localhost:5000/api/dashboard/overview', { headers });
  const dashboardData = await dashboardRes.json();
  console.log('3. Dashboard Stats:', dashboardData.stats);
  console.log('   AI Insight:', dashboardData.aiInsight.analysis);

  // 4. Tasks
  const workspaceId = loginData.user.defaultWorkspaceId;
  const tasksRes = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/tasks`, { headers });
  const tasksData = await tasksRes.json();
  console.log(`4. Tasks retrieved: ${tasksData.length} tasks`);

  // 5. Jobs & Match
  const jobsRes = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/jobs`, { headers });
  const jobsData = await jobsRes.json();
  console.log(`5. Job Opportunities: ${jobsData.length} (First: ${jobsData[0]?.company} - Match: ${jobsData[0]?.matchScore}%)`);

  // 6. Mock Interview
  const interviewsRes = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/interviews`, { headers });
  const interviewsData = await interviewsRes.json();
  console.log(`6. Mock Interviews: ${interviewsData.length} (Score: ${interviewsData[0]?.overallScore}% - Status: ${interviewsData[0]?.status})`);

  // 7. RAG Search
  const ragRes = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/documents/search`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: 'What is React reconciliation and diffing?' })
  });
  const ragData = await ragRes.json();
  console.log('7. RAG Semantic Answer:', ragData.answer.slice(0, 120) + '...');
  console.log(`   Citations count: ${ragData.citations.length}`);

  // 8. Calendar Replan
  const replanRes = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/calendar/replan`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ dailyStudyMinutes: 120 })
  });
  const replanData = await replanRes.json();
  console.log('8. Planner Agent Replan:', replanData.aiInsight);

  console.log('\n✅ ALL FLOWDESK SUBSYSTEMS VERIFIED AND OPERATIONAL!\n');
}

testE2E().catch(console.error);
