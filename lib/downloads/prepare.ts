import archiver from 'archiver'
import { Readable } from 'stream'

interface FileToDownload {
  originalFilename: string
  suggestedFilename: string
  suggestedPath: string
  content: string // base64 encoded
}

export async function prepareFilesForDownload(files: FileToDownload[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    })

    archive.on('error', (err) => {
      reject(err)
    })

    archive.on('data', (chunk) => {
      chunks.push(chunk)
    })

    archive.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    // Add each file to the archive
    files.forEach((file) => {
      const buffer = Buffer.from(file.content, 'base64')
      const fullPath = `${file.suggestedPath.replace(/^\/|\/$/g, '')}/${file.suggestedFilename}`
      
      archive.append(buffer, { name: fullPath })
    })

    archive.finalize()
  })
}

export function prepareSingleFile(file: FileToDownload): Buffer {
  return Buffer.from(file.content, 'base64')
}

export function sanitizeFilename(filename: string): string {
  // Remove or replace characters that might cause issues
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\.+$/, '') // Remove trailing dots
    .trim()
}

export function sanitizePath(path: string): string {
  // Ensure path is safe and properly formatted
  return path
    .split('/')
    .filter(Boolean)
    .map(segment => sanitizeFilename(segment))
    .join('/')
}