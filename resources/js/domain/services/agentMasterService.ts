// resources/js/domain/services/agentMasterService.ts
import { db } from '@/utils/storage'

export function ensureAgent(company: string, contact: string) {
  if (!company || !contact) {
    throw new Error('代理公司或联系人不能为空')
  }

  const agents = db.getAgents() || []
  let agent = agents.find(a => a.name === company)

  // 新建公司
  if (!agent) {
    agent = {
      id: String(Date.now()),
      name: company,
      level: 1,
      industry: '',
      address: '',
      commission_rate: 10,
      contacts: []
    }
    agents.push(agent)
  }

  // 新建联系人
  let contactObj = (agent.contacts || []).find(c => c.name === contact)
  if (!contactObj) {
    contactObj = { name: contact, phone: '', telegram: '' }
    agent.contacts.push(contactObj)
  }

  db.saveRaw('AGENTS', agents)

  return {
    company: agent.name,
    contact: contactObj.name,
    unique_key: `${agent.id}-${contactObj.name}`
  }
}
