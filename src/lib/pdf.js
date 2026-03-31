/**
 * PDF text extraction utility.
 * Uses `unpdf` — a lightweight PDF text extractor designed for
 * serverless / edge / Node.js environments (no worker needed).
 */
import { extractText, getDocumentProxy } from 'unpdf'

/**
 * Extracts plain text from a PDF buffer.
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
export async function extractTextFromPdf(buffer) {
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text } = await extractText(pdf, { mergePages: true })
  return text
}
