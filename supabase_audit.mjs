/**
 * GrowthOS — Full Supabase Backend Audit Script
 * Run: node supabase_audit.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uryfulzxjictjumdzkqu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyeWZ1bHp4amljdGp1bWR6a3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNDA3OTMsImV4cCI6MjEwNTkxNjc5M30.7kbVxy3WRVGy0PooUcmNSeOS1Bdhbug9EDd3tHz03xk'

const TEST_EMAIL    = process.env.TEST_EMAIL    || ''
const TEST_PASSWORD = process.env.TEST_PASSWORD || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const results = []
let userId = null

function pass(feature, test, detail = '') {
  results.push({ status: 'PASS', feature, test, detail })
  console.log(`  ✅ ${test}${detail ? ' — ' + detail : ''}`)
}
function fail(feature, test, detail = '') {
  results.push({ status: 'FAIL', feature, test, detail })
  console.error(`  ❌ ${test}${detail ? ' — ' + detail : ''}`)
}
function warn(feature, test, detail = '') {
  results.push({ status: 'WARN', feature, test, detail })
  console.warn(`  ⚠️  ${test}${detail ? ' — ' + detail : ''}`)
}

async function tableExists(table) {
  const { data, error } = await supabase.from(table).select('id').limit(1)
  if (error && (error.code === 'PGRST200' || error.message?.includes('schema cache') || error.message?.includes('does not exist'))) {
    return { exists: false, error: error.message }
  }
  return { exists: true, error: null }
}

async function testTableExists(tableName) {
  const { exists, error } = await tableExists(tableName)
  if (exists) pass('schema', `Table public.${tableName} exists`)
  else         fail('schema', `Table public.${tableName} EXISTS`, error || 'MISSING')
  return exists
}

async function testAuth() {
  console.log('\n━━━━ AUTH ━━━━')
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    warn('auth', 'Sign-in', 'No TEST_EMAIL/TEST_PASSWORD env vars — skipping CRUD tests')
    return false
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD })
  if (error) { fail('auth', 'Sign-in', error.message); return false }
  userId = data.user.id
  pass('auth', 'Sign-in', `uid=${userId}`)
  return true
}

async function testCRUD_goals() {
  console.log('\n━━━━ GOALS CRUD ━━━━')
  const { data: g, error: ce } = await supabase.from('goals')
    .insert({ user_id: userId, title: '__audit_goal__', category: 'general', status: 'active', progress: 0 })
    .select('*, milestones(*)')
    .single()
  if (ce || !g) { fail('goals', 'CREATE goal', ce?.message); return null }
  pass('goals', 'CREATE goal', `id=${g.id}`)

  const { data: list, error: re } = await supabase.from('goals')
    .select('*, milestones(*)')
    .eq('user_id', userId).eq('id', g.id)
  if (re || !list?.length) fail('goals', 'READ goal', re?.message)
  else pass('goals', 'READ goal (with milestones join)')

  const { data: upd, error: ue } = await supabase.from('goals')
    .update({ progress: 50 })
    .eq('id', g.id).eq('user_id', userId)
    .select().single()
  if (ue || upd?.progress !== 50) fail('goals', 'UPDATE goal progress', ue?.message)
  else pass('goals', 'UPDATE goal progress=50')

  if ('milestones' in g) pass('goals', 'milestones FK relation in select result')
  else warn('goals', 'milestones relation missing from result')

  return g.id
}

async function testCRUD_milestones(goalId) {
  console.log('\n━━━━ MILESTONES CRUD ━━━━')
  const { data: m, error: ce } = await supabase.from('milestones')
    .insert({ user_id: userId, goal_id: goalId, title: '__audit_milestone__' })
    .select().single()
  if (ce || !m) { fail('milestones', 'CREATE milestone', ce?.message); return null }
  pass('milestones', 'CREATE milestone', `id=${m.id}`)

  const { data: upd, error: ue } = await supabase.from('milestones')
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq('id', m.id).eq('user_id', userId).select().single()
  if (ue || !upd?.is_completed) fail('milestones', 'UPDATE milestone toggle', ue?.message)
  else pass('milestones', 'UPDATE milestone toggle is_completed=true')

  return m.id
}

async function testCRUD_habits() {
  console.log('\n━━━━ HABITS CRUD ━━━━')
  const { data: h, error: ce } = await supabase.from('habits')
    .insert({ user_id: userId, name: '__audit_habit__', frequency: 'daily', icon: '⭐', color: '#6366f1' })
    .select().single()
  if (ce || !h) { fail('habits', 'CREATE habit', ce?.message); return null }
  pass('habits', 'CREATE habit', `id=${h.id}`)

  const { data: list, error: re } = await supabase.from('habits')
    .select('*').eq('user_id', userId).eq('id', h.id)
  if (re || !list?.length) fail('habits', 'READ habit', re?.message)
  else pass('habits', 'READ habit')

  const { error: ue } = await supabase.from('habits')
    .update({ name: '__audit_habit_updated__' })
    .eq('id', h.id).eq('user_id', userId)
  if (ue) fail('habits', 'UPDATE habit', ue.message)
  else pass('habits', 'UPDATE habit')

  return h.id
}

async function testCRUD_habit_logs(habitId) {
  console.log('\n━━━━ HABIT_LOGS CRUD ━━━━')
  const today = new Date().toISOString().slice(0, 10)
  await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('user_id', userId).eq('logged_at', today)

  const { data: l, error: ce } = await supabase.from('habit_logs')
    .insert({ user_id: userId, habit_id: habitId, logged_at: today })
    .select().single()
  if (ce || !l) { fail('habit_logs', 'INSERT habit_log', ce?.message); return null }
  pass('habit_logs', 'INSERT habit_log', `id=${l.id}`)

  const { error: dup } = await supabase.from('habit_logs')
    .insert({ user_id: userId, habit_id: habitId, logged_at: today })
  if (dup) pass('habit_logs', 'Unique constraint (one log per habit per day) works')
  else warn('habit_logs', 'Unique constraint may be missing')

  const { error: de } = await supabase.from('habit_logs').delete().eq('id', l.id).eq('user_id', userId)
  if (de) fail('habit_logs', 'DELETE habit_log', de.message)
  else pass('habit_logs', 'DELETE habit_log (untoggle)')
}

async function testCRUD_tasks() {
  console.log('\n━━━━ TASKS CRUD ━━━━')
  const { data: t, error: ce } = await supabase.from('tasks')
    .insert({ user_id: userId, title: '__audit_task__', priority: 'medium', status: 'todo' })
    .select().single()
  if (ce || !t) { fail('tasks', 'CREATE task', ce?.message); return null }
  pass('tasks', 'CREATE task', `id=${t.id}`)

  const { data: upd, error: ue } = await supabase.from('tasks')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .eq('id', t.id).eq('user_id', userId).select().single()
  if (ue || upd?.status !== 'done') fail('tasks', 'UPDATE task status=done', ue?.message)
  else pass('tasks', 'UPDATE task status=done (toggle complete)')

  if ('goal_id' in t) pass('tasks', 'goal_id FK column present')
  else warn('tasks', 'goal_id FK column not in result')
  if ('due_date' in t) pass('tasks', 'due_date column present')
  if ('completed_at' in t) pass('tasks', 'completed_at column present')

  return t.id
}

async function testCRUD_focus_sessions() {
  console.log('\n━━━━ FOCUS_SESSIONS CRUD ━━━━')
  const { data: fs, error: ce } = await supabase.from('focus_sessions')
    .insert({ user_id: userId, duration_min: 25, label: '__audit_focus__', started_at: new Date().toISOString() })
    .select('*, goals(title), tasks(title)')
    .single()
  if (ce || !fs) { fail('focus_sessions', 'CREATE focus_session', ce?.message); return null }
  pass('focus_sessions', 'CREATE focus_session', `id=${fs.id}`)

  const { data: list, error: re } = await supabase.from('focus_sessions')
    .select('*, goals(title), tasks(title)')
    .eq('user_id', userId).eq('id', fs.id)
  if (re || !list?.length) fail('focus_sessions', 'READ with goals/tasks join', re?.message)
  else pass('focus_sessions', 'READ with goals(title), tasks(title) join')

  if ('duration_min' in fs) pass('focus_sessions', 'duration_min column present')
  if ('started_at' in fs) pass('focus_sessions', 'started_at column present')
  if ('goal_id' in fs) pass('focus_sessions', 'goal_id FK column present')
  if ('task_id' in fs) pass('focus_sessions', 'task_id FK column present')

  return fs.id
}

async function testCRUD_journal() {
  console.log('\n━━━━ JOURNAL_ENTRIES CRUD ━━━━')
  const { data: e, error: ce } = await supabase.from('journal_entries')
    .insert({
      user_id: userId,
      title: '__audit_journal__',
      content: 'Audit test content',
      mood: 7,
      mood_label: 'happy',
      tags: ['audit'],
      prompts: { q1: 'test answer' },
      is_private: true,
    })
    .select().single()
  if (ce || !e) { fail('journal_entries', 'CREATE journal entry', ce?.message); return null }
  pass('journal_entries', 'CREATE journal entry', `id=${e.id}`)

  if ('mood_label' in e) pass('journal_entries', 'mood_label column present (phase3)')
  else fail('journal_entries', 'mood_label column MISSING', 'Run schema_phase3.sql')
  if ('prompts' in e) pass('journal_entries', 'prompts jsonb column present (phase3)')
  else fail('journal_entries', 'prompts column MISSING', 'Run schema_phase3.sql')
  if ('tags' in e) pass('journal_entries', 'tags text[] column present')

  const { error: ue } = await supabase.from('journal_entries')
    .update({ mood: 9, mood_label: 'amazing', content: 'Updated audit content' })
    .eq('id', e.id).eq('user_id', userId)
  if (ue) fail('journal_entries', 'UPDATE journal entry', ue.message)
  else pass('journal_entries', 'UPDATE journal entry')

  return e.id
}

async function testRLS_unauth(tables) {
  console.log('\n━━━━ RLS — UNAUTHENTICATED READS ━━━━')
  await supabase.auth.signOut()
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('id').limit(5)
    if (error) {
      pass('rls', `RLS ${t} — anon query blocked (error returned)`, error.code)
    } else if (!data || data.length === 0) {
      pass('rls', `RLS ${t} — anon gets 0 rows (RLS active)`)
    } else {
      fail('rls', `RLS ${t}`, `anon can read ${data.length} rows — POLICY MISSING OR BROKEN`)
    }
  }
}

async function cleanup(ids) {
  console.log('\n━━━━ CLEANUP ━━━━')
  if (!userId) return
  if (TEST_EMAIL && TEST_PASSWORD) {
    await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD })
  }
  const deletions = [
    ['journal_entries', ids.journalId],
    ['focus_sessions', ids.focusId],
    ['tasks', ids.taskId],
    ['milestones', ids.milestoneId],
    ['goals', ids.goalId],
    ['habits', ids.habitId],
  ]
  for (const [table, id] of deletions) {
    if (!id) continue
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (!error) console.log(`  🗑  Deleted test ${table} (${id})`)
    else console.warn(`  ⚠️  Could not delete test ${table}: ${error.message}`)
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  GrowthOS — Full Supabase Backend Audit')
  console.log('═══════════════════════════════════════════════════════════')

  // 1. Table existence
  console.log('\n━━━━ TABLE EXISTENCE ━━━━')
  const tableMap = {}
  const required = ['profiles','goals','habits','habit_logs','tasks','milestones','focus_sessions','journal_entries']
  const optional = ['weekly_reviews','achievements']

  for (const t of required) tableMap[t] = await testTableExists(t)
  console.log('\n  Optional tables:')
  for (const t of optional) {
    const { exists } = await tableExists(t)
    tableMap[t] = exists
    console.log(`  ${exists ? '✅' : '⚠️ '} ${t}: ${exists ? 'exists' : 'MISSING (not in schema files)'}`)
  }

  // 2. Auth
  const authed = await testAuth()

  const ids = {}
  if (authed) {
    if (tableMap.goals) ids.goalId = await testCRUD_goals()
    if (ids.goalId && tableMap.milestones) ids.milestoneId = await testCRUD_milestones(ids.goalId)
    if (tableMap.habits) {
      ids.habitId = await testCRUD_habits()
      if (ids.habitId && tableMap.habit_logs) await testCRUD_habit_logs(ids.habitId)
    }
    if (tableMap.tasks) ids.taskId = await testCRUD_tasks()
    if (tableMap.focus_sessions) ids.focusId = await testCRUD_focus_sessions()
    if (tableMap.journal_entries) ids.journalId = await testCRUD_journal()

    const existingTables = required.filter(t => tableMap[t])
    await testRLS_unauth(existingTables)
    await cleanup(ids)
  } else {
    warn('auth', 'Skipping CRUD + RLS tests', 'Set TEST_EMAIL and TEST_PASSWORD env vars to test CRUD')
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('  AUDIT SUMMARY')
  console.log('═══════════════════════════════════════════════════════════')
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const warned = results.filter(r => r.status === 'WARN').length
  console.log(`  ✅ Passed : ${passed}`)
  console.log(`  ❌ Failed : ${failed}`)
  console.log(`  ⚠️  Warned : ${warned}`)

  if (failed > 0) {
    console.log('\n  ── FAILURES ─────────────────────────────────────────')
    results.filter(r => r.status === 'FAIL').forEach(r =>
      console.log(`    ❌ [${r.feature}] ${r.test}${r.detail ? ' — ' + r.detail : ''}`)
    )
  }
  if (warned > 0) {
    console.log('\n  ── WARNINGS ─────────────────────────────────────────')
    results.filter(r => r.status === 'WARN').forEach(r =>
      console.log(`    ⚠️  [${r.feature}] ${r.test}${r.detail ? ' — ' + r.detail : ''}`)
    )
  }
  console.log('═══════════════════════════════════════════════════════════\n')

  // Exit code: non-zero if failures
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
