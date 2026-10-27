/**
 * Manual QA: trip history + payments export (same as dashboard RTK blob downloads).
 *
 * Usage (PowerShell):
 *   $env:ACCESS_TOKEN = "<jwt>"
 *   node scripts/verify-export-downloads.mjs
 *
 * Optional: $env:API_BASE_URL = "http://10.10.26.159:5003/api/v1"
 */

const BASE =
  process.env.API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  'http://10.10.26.159:5003/api/v1'
const TOKEN = process.env.ACCESS_TOKEN || process.env.AUTH_TOKEN || ''

const cases = [
  { name: 'trip-history-pdf', path: '/booking/history/excel', type: 'pdf' },
  { name: 'trip-history-csv', path: '/booking/history/excel', type: 'csv' },
  { name: 'payments-pdf', path: '/payment/export', type: 'pdf' },
  { name: 'payments-csv', path: '/payment/export', type: 'csv' },
]

const expectedContentType = {
  pdf: 'application/pdf',
  csv: 'text/csv',
}

function parseCsvHeaderLine(text) {
  const normalized = text.replace(/^\uFEFF/, '')
  const firstLine = normalized.split(/\r?\n/).find((line) => line.trim()) || ''
  return firstLine
}

async function runCase({ name, path, type }) {
  const url = new URL(`${BASE.replace(/\/$/, '')}${path}`)
  url.searchParams.set('type', type)

  const res = await fetch(url, {
    method: 'GET',
    headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
  })

  const contentType = res.headers.get('content-type') || ''
  const disposition = res.headers.get('content-disposition') || ''

  if (!res.ok) {
    const errText = await res.text()
    let message = errText
    try {
      message = JSON.parse(errText).message || errText
    } catch {
      /* plain text */
    }
    return { name, ok: false, status: res.status, message, contentType }
  }

  const buf = Buffer.from(await res.arrayBuffer())
  const head = buf.subarray(0, 4).toString('ascii')

  if (type === 'pdf') {
    const pdfOk = head === '%PDF'
    const ctOk = contentType.toLowerCase().includes(expectedContentType.pdf)
    return {
      name,
      ok: pdfOk && ctOk,
      status: res.status,
      contentType,
      disposition,
      bytes: buf.length,
      checks: { pdfMagic: pdfOk, contentTypePdf: ctOk },
    }
  }

  const csvText = buf.toString('utf8')
  const headerLine = parseCsvHeaderLine(csvText)
  const looksZip = head === 'PK\u0003\u0004' || head.startsWith('PK')
  const ctOk = contentType.toLowerCase().includes('csv') || contentType.toLowerCase().includes('text/plain')
  const hasCommas = headerLine.includes(',')

  return {
    name,
    ok: !looksZip && hasCommas && headerLine.length > 0,
    status: res.status,
    contentType,
    disposition,
    bytes: buf.length,
    csvHeaderLine: headerLine,
    checks: { notXlsxZip: !looksZip, hasCommas, contentTypeCsv: ctOk },
  }
}

async function main() {
  console.log(`API base: ${BASE}`)
  if (!TOKEN) {
    console.warn('WARNING: ACCESS_TOKEN not set — expect 401 responses.\n')
  }

  const results = []
  for (const testCase of cases) {
    results.push(await runCase(testCase))
  }

  const tripCsv = results.find((r) => r.name === 'trip-history-csv')
  const tripPdf = results.find((r) => r.name === 'trip-history-pdf')
  const payCsv = results.find((r) => r.name === 'payments-csv')
  const payPdf = results.find((r) => r.name === 'payments-pdf')

  if (tripCsv?.csvHeaderLine && tripPdf?.ok) {
    console.log('\nTrip history CSV header (compare visually to PDF table header row):')
    console.log(tripCsv.csvHeaderLine)
  }
  if (payCsv?.csvHeaderLine && payPdf?.ok) {
    console.log('\nPayments CSV header (compare visually to PDF table header row):')
    console.log(payCsv.csvHeaderLine)
  }

  console.log('\nResults:')
  for (const r of results) {
    console.log(JSON.stringify(r, null, 2))
  }

  const allOk = results.every((r) => r.ok)
  process.exit(allOk ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
