import { ref } from 'vue'

export function useOrderFiles() {
  const fileList = ref([])

  const onFileChange = (file, files) => {
    fileList.value = files
  }

  return {
    fileList,
    onFileChange
  }
}
