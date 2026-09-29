/**
 * GrowthOS — Apply Supabase Migrations via Management API
 * Uses the Supabase REST Management API to run SQL directly.
 * Requires a Supabase service_role or management API key.
 * 
 * Run: node apply_migrations.mjs <service_role_key>
 * OR:  node apply_migrations.mjs --use-rest (uses anon key to test via REST)
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// The project ref from the Supabase URL
const PROJECT_REF = 'uryfulzxjictjumdzkqu'

// We'll use the Supabase Management API
// The user needs to provide their SERVICE_ROLE key (not anon key)
// Or we can use the Supabase CLI approach via pg connection

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[2] || ''

if (!SERVICE_ROLE_KEY) {
  console.error(`
══════════════════════════════════════════════════════════════
  GrowthOS — Database Migration Runner
══════════════════════════════════════════════════════════════

  ERROR: No service role key provided.

  To run migrations, you need your Supabase SERVICE ROLE key:
  1. Go to: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api
  2. Find "service_role" under "Project API keys"
  3. Copy it (keep it secret!)
  4. Run: 
     $env:SUPABASE_SERVICE_ROLE_KEY="your-key-here"
     node apply_migrations.mjs

  OR provide it directly:
     node apply_migrations.mjs "your-service-role-key"

══════════════════════════════════════════════════════════════
`)
  process.exit(1)
}

const __dirname = dirname(fileURLToPath(import.meta.url))

// Read the SQL files
function readSQL(filename) {
  const paths = [
    join(__dirname, 'supabase', filename),
    join(__dirname, filename),
  ]
  for (const p of paths) {
    try { return readFileSync(p, 'utf8') } catch {}
  }
  throw new Error(`Cannot find ${filename}`)
}

async function runSQL(sql, label) {
  console.log(`\n  Running ${label}...`)
  
  // Use Supabase Management API v1 to execute SQL
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  })
  
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  
  if (!res.ok) {
    console.error(`  ❌ ${label} FAILED (HTTP ${res.status})`)
    console.error('  Response:', JSON.stringify(json, null, 2))
    return false
  }
  
  console.log(`  ✅ ${label} succeeded`)
  return true
}

async function main() {
  console.log('══════════════════════════════════════════════════════════════')
  console.log('  GrowthOS — Applying Database Migrations')
  console.log(`  Project: ${PROJECT_REF}`)
  console.log('══════════════════════════════════════════════════════════════')

  const files = [
    { name: 'schema.sql', label: 'Phase 1 — Core tables (profiles, goals, habits, journal)' },
    { name: 'schema_phase2.sql', label: 'Phase 2 — Tasks & Milestones' },
    { name: 'schema_phase3.sql', label: 'Phase 3 — Focus Sessions & Journal updates' },
  ]

  let allOk = true
  for (const f of files) {
    const sql = readSQL(f.name)
    const ok = await runSQL(sql, f.label)
    if (!ok) { allOk = false; break }
  }

  if (allOk) {
    console.log('\n  ✅ All migrations applied successfully!')
    console.log('  Refresh your app and all features should work.\n')
  } else {
    console.log('\n  ❌ Some migrations failed. Check errors above.\n')
    process.exit(1)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
