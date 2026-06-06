/**
 * Captures only the screenshots needed for the special-nodes tutorial.
 * Run with: npm run screenshots:special-nodes
 * Requires the dev server running on port 5173 (or BASE_URL env var).
 *
 * Outputs:
 *   public/docs/screenshots/api-gateway/
 *   public/docs/screenshots/vpn-gateway/
 */

import { chromium, type Page } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCREENSHOTS_DIR = path.join(__dirname, '../public/docs/screenshots')
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const VIEWPORT = { width: 1920, height: 1080 }

async function shot(page: Page, subdir: string, name: string) {
  const dir = path.join(SCREENSHOTS_DIR, subdir)
  fs.mkdirSync(dir, { recursive: true })
  await page.screenshot({ path: path.join(dir, name), fullPage: false })
  console.log(`  ✓ ${subdir}/${name}`)
}

async function loadApp(page: Page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForSelector('.react-flow__pane', { timeout: 20000 })
  await page.waitForTimeout(1200)
}

async function addNodeBySearch(page: Page, query: string): Promise<void> {
  // Ensure the canvas has focus before using the keyboard shortcut
  await page.click('.react-flow__pane')
  await page.waitForTimeout(300)
  await page.keyboard.press('Meta+k')
  await page.waitForTimeout(500)

  const searchInput = page.locator('input[placeholder*="uscar"]').first()
  await searchInput.waitFor({ state: 'visible', timeout: 6000 })
  await searchInput.fill(query)
  await page.waitForTimeout(700)

  // Results are rendered in a <ul class="absolute ..."> below the input.
  // The <li> items use onMouseDown (with preventDefault) to add the service,
  // which fires before the input's onBlur closes the list.
  const firstResult = page.locator('ul.absolute li').first()
  await firstResult.waitFor({ state: 'visible', timeout: 5000 })
  await firstResult.click()
  await page.waitForTimeout(800)
}

async function positionNode(page: Page, locator: ReturnType<Page['locator']>, targetX: number, targetY: number) {
  const box = await locator.boundingBox()
  if (!box) return
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await page.mouse.move(cx, cy)
  await page.waitForTimeout(100)
  await page.mouse.down()
  await page.mouse.move(targetX, targetY, { steps: 12 })
  await page.waitForTimeout(150)
  await page.mouse.up()
  await page.waitForTimeout(400)
}

async function addMouseCursor(page: Page, x: number, y: number) {
  await page.evaluate(({ xPos, yPos }: { xPos: number; yPos: number }) => {
    const cursor = document.createElement('svg')
    cursor.id = 'mouse-cursor-temp'
    cursor.style.cssText = `position:fixed;left:${xPos}px;top:${yPos}px;width:24px;height:32px;pointer-events:none;z-index:10000`
    cursor.innerHTML = `<svg viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg"><path d="M3 2 L3 28 L10 20 L15 28 L19 26 L13 19 L21 19 Z" fill="#000" stroke="#fff" stroke-width="0.5"/></svg>`
    document.body.appendChild(cursor)
  }, { xPos: x, yPos: y })
}

async function removeMouseCursor(page: Page) {
  await page.evaluate(() => { document.getElementById('mouse-cursor-temp')?.remove() })
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: VIEWPORT, locale: 'es-ES' })
  const page = await context.newPage()
  page.on('dialog', d => d.dismiss())

  console.log('Capturing special-nodes screenshots...\n')

  // ── 1. API Gateway (4 shots) ─────────────────────────────────────────
  console.log('1/2 API Gateway routes...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)

  await addNodeBySearch(page, 'API Gateway')

  const agNode = page.locator('.react-flow__node').filter({ hasText: /api gateway/i }).first()
  await agNode.waitFor({ state: 'visible', timeout: 8000 })
  await positionNode(page, agNode, 750, 420)

  // Deselect
  await page.mouse.click(300, 180)
  await page.waitForTimeout(300)

  // Select to open inspector
  await agNode.click({ force: true })
  await page.waitForTimeout(700)

  // Shot 1: inspector empty defaults (GET + POST)
  await page.mouse.move(1200, 700)
  await shot(page, 'api-gateway', 'inspector-empty.png')

  // Fill routes
  const pathInputs = page.locator('input[placeholder="/path"]')
  await pathInputs.first().waitFor({ state: 'visible', timeout: 5000 })
  await pathInputs.nth(0).fill('/users')
  await pathInputs.nth(0).dispatchEvent('input')
  await page.waitForTimeout(300)
  await pathInputs.nth(1).fill('/orders')
  await pathInputs.nth(1).dispatchEvent('input')
  await page.waitForTimeout(300)

  // Shot 2: inspector filled
  await page.mouse.move(1200, 700)
  await shot(page, 'api-gateway', 'inspector-filled.png')

  // Deselect to show node card
  await page.mouse.click(300, 180)
  await page.waitForTimeout(400)
  await page.mouse.move(300, 180)

  // Shot 3: node with route rows
  await shot(page, 'api-gateway', 'node-with-routes.png')

  // Add Lambda 1
  await addNodeBySearch(page, 'Lambda')
  const agLambda1 = page.locator('.react-flow__node').filter({ hasText: /lambda/i }).first()
  await agLambda1.waitFor({ state: 'visible', timeout: 6000 })
  await positionNode(page, agLambda1, 1150, 330)

  // Add Lambda 2
  await addNodeBySearch(page, 'Lambda')
  const agLambdas = page.locator('.react-flow__node').filter({ hasText: /lambda/i })
  await agLambdas.nth(1).waitFor({ state: 'visible', timeout: 6000 })
  await positionNode(page, agLambdas.nth(1), 1150, 540)

  await page.mouse.click(300, 180)
  await page.waitForTimeout(400)

  // Connect route handles to Lambdas
  const routeHandles = page.locator('.react-flow__handle[data-handleid^="route-"]')
  const l1Box = await agLambda1.boundingBox()
  const rh1Box = await routeHandles.nth(0).boundingBox({ timeout: 5000 }).catch(() => null)
  if (rh1Box && l1Box) {
    await page.mouse.move(rh1Box.x + rh1Box.width / 2, rh1Box.y + rh1Box.height / 2)
    await page.waitForTimeout(200)
    await page.mouse.down()
    await page.mouse.move(l1Box.x, l1Box.y + l1Box.height / 2, { steps: 20 })
    await page.waitForTimeout(200)
    await page.mouse.up()
    await page.waitForTimeout(600)
  }

  const l2Box = await agLambdas.nth(1).boundingBox()
  const rh2Box = await routeHandles.nth(1).boundingBox({ timeout: 5000 }).catch(() => null)
  if (rh2Box && l2Box) {
    await page.mouse.move(rh2Box.x + rh2Box.width / 2, rh2Box.y + rh2Box.height / 2)
    await page.waitForTimeout(200)
    await page.mouse.down()
    await page.mouse.move(l2Box.x, l2Box.y + l2Box.height / 2, { steps: 20 })
    await page.waitForTimeout(200)
    await page.mouse.up()
    await page.waitForTimeout(600)
  }

  await page.mouse.click(300, 180)
  await page.waitForTimeout(400)
  await page.mouse.move(300, 180)

  // Shot 4: routes connected to Lambdas
  await shot(page, 'api-gateway', 'routes-connected.png')

  // ── 2. VPN Gateway (3 shots) ─────────────────────────────────────────
  console.log('2/2 VPN Gateway...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)

  await addNodeBySearch(page, 'VPN Gateway')
  const vpnNode = page.locator('.react-flow__node').filter({ hasText: /vpn gateway/i }).first()
  await vpnNode.waitFor({ state: 'visible', timeout: 8000 })
  await positionNode(page, vpnNode, 1200, 400)

  await addNodeBySearch(page, 'EC2')
  const ec2Node = page.locator('.react-flow__node').filter({ hasText: /^EC2$/i }).first()
  await ec2Node.waitFor({ state: 'visible', timeout: 8000 })
  await positionNode(page, ec2Node, 680, 400)

  await page.mouse.click(960, 180)
  await page.waitForTimeout(400)
  await page.mouse.move(960, 180)

  // Shot 1: both nodes disconnected
  await shot(page, 'vpn-gateway', 'before-connect.png')

  const ec2Box = await ec2Node.boundingBox()
  const vpnBox = await vpnNode.boundingBox()

  if (ec2Box && vpnBox) {
    const srcX = ec2Box.x + ec2Box.width
    const srcY = ec2Box.y + ec2Box.height / 2
    const tgtX = vpnBox.x + vpnBox.width / 2
    const tgtY = vpnBox.y + vpnBox.height / 2

    await page.mouse.move(ec2Box.x + ec2Box.width / 2, srcY)
    await page.waitForTimeout(300)
    await page.mouse.move(srcX, srcY)
    await page.waitForTimeout(300)

    await page.mouse.down()
    const nearX = srcX + (tgtX - srcX) * 0.82
    const nearY = srcY + (tgtY - srcY) * 0.82
    await page.mouse.move(nearX, nearY, { steps: 25 })
    await page.waitForTimeout(300)
    await addMouseCursor(page, nearX - 8, nearY - 8)
    await page.waitForTimeout(300)

    // Shot 2: edge in progress
    await shot(page, 'vpn-gateway', 'connecting.png')
    await removeMouseCursor(page)

    await page.mouse.move(tgtX, tgtY, { steps: 15 })
    await page.waitForTimeout(300)
    await page.mouse.up()
    await page.waitForTimeout(900)
  }

  await page.mouse.click(960, 180)
  await page.waitForTimeout(400)
  await page.mouse.move(960, 180)

  // Shot 3: Customer Gateway icon on EC2's handle
  await shot(page, 'vpn-gateway', 'customer-gateway.png')

  // ── Validate ──────────────────────────────────────────────────────────
  console.log('\nValidating special-nodes screenshots...')
  const docsPage = await context.newPage()
  await docsPage.goto(`${BASE_URL}/docs/special-nodes`, { waitUntil: 'networkidle', timeout: 30000 })
  await docsPage.waitForTimeout(2000)
  await docsPage.evaluate(() => { window.scrollTo(0, document.body.scrollHeight) })
  await docsPage.waitForTimeout(1000)

  const broken = await docsPage.evaluate(() =>
    Array.from(document.querySelectorAll('img[loading="lazy"]'))
      .filter((img) => (img as HTMLImageElement).naturalWidth === 0)
      .map((img) => (img as HTMLImageElement).src),
  )
  await docsPage.close()

  if (broken.length > 0) {
    console.error('\n❌ Broken images:')
    broken.forEach((s) => console.error('  -', s))
    await browser.close()
    process.exit(1)
  }

  await browser.close()
  console.log('\n✅ All special-nodes screenshots captured and validated:')
  console.log('  api-gateway/ (4 shots), vpn-gateway/ (3 shots)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
