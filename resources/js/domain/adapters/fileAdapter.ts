import { fileService } from '@/domain/services/fileService'
import type { FileRecord } from '@/domain/repositories/fileRepository'

export const fileAdapter = {
  delete(_id: string) {
    // 文件物理删除已经由 fileService.delete 处理
    // recycleService 只关心回收站记录本身
    return true
  },

  async restore(snapshot: FileRecord) {
    try {
      if (!snapshot || !snapshot.id) {
        throw new Error('Invalid file snapshot')
      }

      // 统一走领域服务 → Repository → Driver（IndexedDB / MySQL / API）
      await fileService.restore(snapshot)

      return true
    } catch (e) {
      console.error('[fileAdapter.restore] failed', e)
      return false
    }
  }
}
