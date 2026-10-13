/**
 * Downscales and re-encodes an image file client-side before upload, so a
 * multi-MB camera photo doesn't take forever to upload or to load back
 * down in the feed over mobile data. Returns a JPEG Blob; falls back to
 * the original file if anything goes wrong reading/decoding it.
 */
export function compressImage(file, maxDimension = 1600, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    const fallback = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }

    img.onload = () => {
      try {
        let { width, height } = img
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round(height * (maxDimension / width))
            width = maxDimension
          } else {
            width = Math.round(width * (maxDimension / height))
            height = maxDimension
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(url)
        canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality)
      } catch {
        fallback()
      }
    }
    img.onerror = fallback
    img.src = url
  })
}
