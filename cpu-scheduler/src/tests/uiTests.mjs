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

  // switch to MLFQ and verify dynamic controls
  await click('MLFQ')
  await page.waitForTimeout(200)
  const levelInput = page.getByLabel('MLFQ Levels')
  await levelInput.fill('4')
  await page.waitForTimeout(250)

  const quantumCount = await page.locator('text=/Level \\d+ Quantum/').count()
  const algorithmCount = await page.locator('text=/Level \\d+ Algorithm/').count()
  console.log('mlfq quantum controls:', quantumCount)
  console.log('mlfq algorithm controls:', algorithmCount)

  // switch back to a deterministic algorithm for the completion smoke check
  await click('FCFS')
  await page.waitForTimeout(200)

  const rows = await page.locator('table tbody tr').count()
  console.log('process rows:', rows)

  // start simulation
  await click('Start')
  await page.waitForTimeout(400)

  const pauseVisible = await page.locator('button', { hasText: 'Pause' }).first().isVisible().catch(() => false)
  const runningVisible = await page.locator('text=RUNNING').count()
  console.log('pauseVisible:', pauseVisible)
  console.log('runningVisible:', runningVisible)

  await browser.close()
  process.exit(pauseVisible && runningVisible > 0 ? 0 : 2)
}

run().catch((err) => { console.error(err); process.exit(3) })
