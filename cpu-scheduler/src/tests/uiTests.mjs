import { chromium } from 'playwright'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const base = 'http://localhost:5174/'
  await page.goto(base, { waitUntil: 'networkidle' })

  // helper
  const click = async (matcher) => {
    const btn = await page.locator('button', { hasText: matcher }).first()
    if (await btn.count()) await btn.click()
  }

  // load samples
  await click('Load sample')
  await page.waitForTimeout(300)

  const rows = await page.locator('table tbody tr').count()
  console.log('process rows:', rows)

  // start simulation
  await click('Start')
  await page.waitForTimeout(600)

  // wait for completion
  const finished = await page.waitForFunction(() => document.body.innerText.includes('Simulation complete'), { timeout: 20000 }).catch(() => null)
  console.log('finished:', !!finished)

  // metrics present?
  const metricsVisible = await page.evaluate(() => document.body.innerText.includes('Avg Waiting') || document.body.innerText.includes('Performance overview'))
  console.log('metricsVisible:', metricsVisible)

  await browser.close()
  process.exit(finished ? 0 : 2)
}

run().catch((err) => { console.error(err); process.exit(3) })
