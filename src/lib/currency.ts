import { Context } from 'hono'

export async function getIdrRate(c: Context<any>): Promise<number> {
  let idrRate = 16000 
  try {
    const cachedRate = await c.env.KV.get('usd_to_idr_rate')
    if (cachedRate) {
      idrRate = parseFloat(cachedRate)
    } else {
      const rateRes = await fetch('https://api.wise.com/v1/rates?source=USD&target=IDR', {
        headers: { 'Authorization': `Bearer ${c.env.WISE_API_TOKEN}` }
      })
      if (rateRes.ok) {
        const rates = await rateRes.json() as any[]
        if (rates.length > 0 && rates[0].rate) {
          idrRate = rates[0].rate
          await c.env.KV.put('usd_to_idr_rate', idrRate.toString(), { expirationTtl: 86400 })
        }
      }
    }
  } catch (e) {
    console.error('Wise API error:', e)
  }
  return idrRate
}

export const formatIDR = (price: string | number, idrRate: number) => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price
  const converted = numericPrice * idrRate
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(converted)
}
