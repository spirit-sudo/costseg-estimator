const fetch = require('node-fetch')

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  }

  const address = event.queryStringParameters?.address
  if (!address) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing address' }) }
  }

  const encoded = encodeURIComponent(address.trim())
  const url = `https://www.sdarcc.gov/bin/cosd/parcel-request?address=${encoded}`

  let html
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://www.sdarcc.gov/content/arcc/home/divisions/assessor/secured-assessment-roll-search.html'
      }
    })
    html = await res.text()
  } catch (err) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'County portal unreachable' }) }
  }

  const parse = (label) => {
    const regex = new RegExp(`${label}[^$]*\\$([\\d,]+)`)
    const match = html.match(regex)
    return match ? parseInt(match[1].replace(/,/g, ''), 10) : null
  }

  const land = parse('Land:')
  const improvements = parse('Improvements:')
  const total = parse('Total Assessed Value:')

  if (!land && !improvements) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Parcel not found', raw: html.slice(0, 500) }) }
  }

  const landPct = total ? Math.round((land / total) * 100) : null

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ land, improvements, total, land_pct: landPct })
  }
}
