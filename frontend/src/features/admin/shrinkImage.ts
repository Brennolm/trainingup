/** The API's image limit (App\Services\ExerciseMedia::RULES). */
export const MAX_IMAGE_BYTES = 1024 * 1024
const MAX_SIDE = 1600

/**
 * Re-encodes an image in the browser as a JPEG of at most 1600 px per side and under 1 MB, so a
 * generated PNG (often 2 MB or more) can be sent as is. Resolves null when the browser cannot
 * read the file.
 */
export async function shrinkImage(file: File, name: string): Promise<File | null> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d')
    if (!context || !canvas.width) return null
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    for (const quality of [0.85, 0.75, 0.6, 0.45]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
      if (blob && blob.size <= MAX_IMAGE_BYTES) return new File([blob], `${name}.jpg`, { type: 'image/jpeg' })
    }
    return null
  } catch {
    return null
  }
}
