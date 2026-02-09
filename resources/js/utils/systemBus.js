const KEY = '__SYSTEM_EVENT__'

export const emitSystemEvent = (type, payload = {}) => {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      type,
      payload,
      t: Date.now()
    })
  )
}

export const listenSystemEvent = (callback) => {
  const handler = (e) => {
    if (e.key !== KEY || !e.newValue) return
    try {
      const data = JSON.parse(e.newValue)
      callback(data)
    } catch {}
  }

  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
