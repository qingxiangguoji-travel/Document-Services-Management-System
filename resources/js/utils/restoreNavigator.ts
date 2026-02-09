const KEY = '__RESTORE_TARGET__'

export interface RestoreTarget {
  module: 'agent' | 'order' | 'certificate' | 'file'
  id: string | number
}

export function setRestoreTarget(target: RestoreTarget) {
  sessionStorage.setItem(KEY, JSON.stringify(target))
}

export function getRestoreTarget(): RestoreTarget | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearRestoreTarget() {
  sessionStorage.removeItem(KEY)
}
