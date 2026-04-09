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

  const token = process.env.REGRID_TOKEN
  const encoded = encodeURIComponent(address.trim())
  const url = `https://app.regrid.com/api/v1/parcels/address?query=${encoded}&path=/us/ca/san-diego&token=${token}&limit=1`

  let data
  try {
    const res = await fetch(url)
    data = await res.json()
  } catch (err) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Regrid unreachable' }) }
  }

  const parcel = data?.parcels?.features?.[0]?.properties?.fields
  if (!parcel) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Parcel not found' }) }
  }

  const land = parcel.landval || null
  const improvements = parcel.improvval || null
  const total = parcel.parval || null
  const landPct = total && land ? Math.round((land / total) * 100) : null

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ land, improvements, total, land_pct: landPct })
  }
}
