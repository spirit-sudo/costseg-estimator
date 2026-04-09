const fetch = require('node-fetch')

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  }

  const address = event.queryStringParameters && event.queryStringParameters.address
  if (!address) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Missing address' }) }
  }

  const token = process.env.REGRID_TOKEN
  const encoded = encodeURIComponent(address.trim())
  const url = 'https://app.regrid.com/api/v1/parcels/address?query=' + encoded + '&path=/us/ca/san-diego&token=' + token + '&limit=1'

  var data
  try {
    var res = await fetch(url)
    data = await res.json()
  } catch (err) {
    return { statusCode: 502, headers: headers, body: JSON.stringify({ error: err.message }) }
  }

  var features = data && data.parcels && data.parcels.features
  var parcel = features && features[0] && features[0].properties && features[0].properties.fields

  if (!parcel) {
    return { statusCode: 404, headers: headers, body: JSON.stringify({ error: 'Parcel not found', raw: JSON.stringify(data).slice(0, 300) }) }
  }

  var land = parcel.landval || null
  var improvements = parcel.improvval || null
  var total = parcel.parval || null
  var landPct = (total && land) ? Math.round((land / total) * 100) : null

  return {
    statusCode: 200,
    headers: headers,
    body: JSON.stringify({ land: land, improvements: improvements, total: total, land_pct: landPct })
  }
}
