// resources/js/domain/services/agentMatchingService.ts
import { db } from '@/utils/storage'
import { ensureAgent } from './agentMasterService'

const ALIAS_KEY = 'AGENT_ALIAS_MAP'

type MatchResult = {
  company: string | null
  contact: string | null
  confidence: number
  raw: string
}

const normalize = (s = '') =>
  s.toLowerCase().replace(/\s+/g, '').replace(/[—\-_/]/g, '')

const loadAliases = () => db.getRaw(ALIAS_KEY) || []
const saveAliases = (list) => db.saveRaw(ALIAS_KEY, list)

// 简单稳定相似度
const similarity = (a = '', b = '') => {
  a = normalize(a)
  b = normalize(b)
  if (!a || !b) return 0
  let hits = 0
  for (const ch of a) if (b.includes(ch)) hits++
  return hits / Math.max(a.length, b.length)
}

export function saveAlias(raw, company, contact) {
  const list = loadAliases()
  list.push({ raw, company, contact })
  saveAliases(list)
}

export function matchAgent(raw: string): MatchResult {
  const agents = db.getAgents() || []
  const text = String(raw || '').trim()

  // 1️⃣ alias
  const alias = loadAliases().find(a => a.raw === text)
  if (alias) {
    return { company: alias.company, contact: alias.contact, confidence: 1, raw: text }
  }

  // 2️⃣ 规则
  const parts = text.split(/[-—\s]/).filter(Boolean)
  if (parts.length >= 2) {
    const [c, p] = parts
    for (const a of agents) {
      if (a.name === c) {
        const hit = (a.contacts || []).find(x => x.name === p)
        if (hit) {
          return { company: a.name, contact: hit.name, confidence: 1, raw: text }
        }
      }
    }
  }

  // 3️⃣ 模糊
  let best = { score: 0, company: null, contact: null }
  agents.forEach(a => {
    ;(a.contacts || []).forEach(c => {
      const label = `${a.name}-${c.name}`
      const score = similarity(label, text)
      if (score > best.score) {
        best = { score, company: a.name, contact: c.name }
      }
    })
  })

  if (best.score >= 0.85) {
    return {
      company: best.company,
      contact: best.contact,
      confidence: best.score,
      raw: text
    }
  }

  return { company: null, contact: null, confidence: best.score, raw: text }
}

export function resolveAgent(raw: string) {
  const hit = matchAgent(raw)
  if (hit.company && hit.contact) {
    return {
      ...hit,
      isNew: false
    }
  }

  const text = String(raw || '').trim()
  if (!text) {
    return {
      company: null,
      contact: null,
      confidence: 0,
      raw: text,
      isNew: false
    }
  }

  // 🚀 自动创建新代理公司 + 联系人
  const created = ensureAgent(text, '默认')

  return {
    company: created.company,
    contact: created.contact,
    confidence: 1,   // 🔥 关键：必须给 1，否则 dryRun 会当失败
    raw: text,
    isNew: true     // 🔥 标记这是导入创建的
  }
}

