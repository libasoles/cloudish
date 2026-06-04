/**
 * Playwright script to take tutorial screenshots.
 * Run with: npm run screenshots
 * Requires the dev server to be running on port 5173.
 */

import { chromium, type Page } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCREENSHOTS_DIR = path.join(__dirname, '../public/docs/screenshots')
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const VIEWPORT = { width: 1280, height: 800 }

async function shot(page: Page, name: string) {
  const dest = path.join(SCREENSHOTS_DIR, name)
  await page.screenshot({ path: dest, fullPage: false })
  console.log(`  ✓ ${name}`)
}

async function loadApp(page: Page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForSelector('.react-flow__pane', { timeout: 20000 })
  await page.waitForTimeout(1200)
}

async function addNodeBySidebarClick(page: Page, index = 0) {
  const buttons = page.locator('aside button[draggable="true"]')
  const count = await buttons.count()
  if (count > index) {
    await buttons.nth(index).click()
    await page.waitForTimeout(400)
  }
}

async function main() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  // locale: 'es-ES' makes navigator.language return 'es-ES' so the app renders in Spanish
  const context = await browser.newContext({ viewport: VIEWPORT, locale: 'es-ES' })
  const page = await context.newPage()

  page.on('dialog', d => d.dismiss())

  console.log('Starting screenshot capture...\n')
  await loadApp(page)

  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  // ── 01: sidebar drag ──────────────────────────────────────────────
  console.log('1/13 Sidebar drag...')
  const firstDraggable = page.locator('aside button[draggable="true"]').first()
  await firstDraggable.hover()
  await page.waitForTimeout(400)
  await shot(page, '01-sidebar-drag.png')

  // ── 02: sidebar click ─────────────────────────────────────────────
  console.log('2/13 Sidebar click...')
  const serviceBtn = page.locator('aside button[draggable="true"]').nth(6)
  await serviceBtn.hover()
  await page.waitForTimeout(300)
  await serviceBtn.click()
  await page.waitForTimeout(600)
  await shot(page, '02-sidebar-click.png')

  // ── 03: search panel — empty canvas ──────────────────────────────
  console.log('3/13 Search panel...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  // ⌘K / Ctrl+K focuses the search input
  await page.keyboard.press('Meta+k')
  await page.waitForTimeout(400)
  const searchInput = page.locator('input[placeholder*="uscar"]').first()
  if (await searchInput.count() > 0) {
    await searchInput.fill('lambda')
    await page.waitForTimeout(600)
  }
  await shot(page, '03-search.png')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)

  // ── 04: two nodes connected by an edge ───────────────────────────
  console.log('4/13 Connect nodes...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // Add first service node
  await addNodeBySidebarClick(page, 6)
  await page.waitForTimeout(400)

  // Move first node to left side of canvas so the two nodes don't overlap
  const nodes = page.locator('.react-flow__node')
  const firstNode = nodes.first()
  const box1 = await firstNode.boundingBox()
  if (box1) {
    const cx = box1.x + box1.width / 2
    const cy = box1.y + box1.height / 2
    await page.mouse.move(cx, cy)
    await page.waitForTimeout(150)
    await page.mouse.down()
    await page.mouse.move(cx - 260, cy, { steps: 12 })
    await page.waitForTimeout(150)
    await page.mouse.up()
    await page.waitForTimeout(300)
  }

  // Click empty area to deselect
  await page.mouse.click(640, 400)
  await page.waitForTimeout(200)

  // Add second service node (it lands at canvas center, to the right of the first)
  await addNodeBySidebarClick(page, 7)
  await page.waitForTimeout(400)

  // Move second node to right side
  const secondNode = nodes.nth(1)
  const box2 = await secondNode.boundingBox()
  if (box2) {
    const cx = box2.x + box2.width / 2
    const cy = box2.y + box2.height / 2
    await page.mouse.move(cx, cy)
    await page.waitForTimeout(150)
    await page.mouse.down()
    await page.mouse.move(cx + 200, cy, { steps: 12 })
    await page.waitForTimeout(150)
    await page.mouse.up()
    await page.waitForTimeout(300)
  }

  // Click empty area to deselect
  await page.mouse.click(640, 200)
  await page.waitForTimeout(200)

  // Get updated positions after both nodes have been moved
  const updatedBox1 = await firstNode.boundingBox()
  const updatedBox2 = await secondNode.boundingBox()

  if (updatedBox1 && updatedBox2) {
    // Source: right-edge center of node 1 (where the right handle sits)
    const srcX = updatedBox1.x + updatedBox1.width
    const srcY = updatedBox1.y + updatedBox1.height / 2
    // Target: left-edge center of node 2 (where the left/target handle sits)
    const tgtX = updatedBox2.x
    const tgtY = updatedBox2.y + updatedBox2.height / 2

    // Hover node 1 center first so handles become visible
    await page.mouse.move(updatedBox1.x + updatedBox1.width / 2, updatedBox1.y + updatedBox1.height / 2)
    await page.waitForTimeout(400)
    // Move to the right handle
    await page.mouse.move(srcX, srcY)
    await page.waitForTimeout(300)
    // Drag slowly to the left handle of node 2
    await page.mouse.down()
    await page.mouse.move(tgtX, tgtY, { steps: 40 })
    await page.waitForTimeout(500)
    await page.mouse.up()
    await page.waitForTimeout(800)
  }

  await shot(page, '04-connect-nodes.png')

  // ── 05: region + vpc ──────────────────────────────────────────────
  console.log('5/13 Region + VPC...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await addNodeBySidebarClick(page, 0)
  await addNodeBySidebarClick(page, 1)
  await page.waitForTimeout(500)
  await shot(page, '05-region-vpc.png')

  // ── 06: AZ inspector (VPC selected) ──────────────────────────────
  console.log('6/13 AZ inspector...')
  const allNodes = page.locator('.react-flow__node')
  const nodeCount = await allNodes.count()
  for (let i = 0; i < nodeCount; i++) {
    const text = await allNodes.nth(i).textContent()
    if (text?.toLowerCase().includes('vpc')) {
      await allNodes.nth(i).click({ force: true })
      break
    }
  }
  await page.waitForTimeout(700)
  await shot(page, '06-az-inspector.png')

  // ── 07: subnet public/private ─────────────────────────────────────
  console.log('7/13 Subnet...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await addNodeBySidebarClick(page, 3)
  await page.waitForTimeout(400)
  const subnetNode = page.locator('.react-flow__node').first()
  if (await subnetNode.count() > 0) {
    await subnetNode.click()
    await page.waitForTimeout(600)
  }
  await shot(page, '07-subnet-private.png')

  // ── 08-09: AZ sync ────────────────────────────────────────────────
  console.log('8-9/13 AZ sync...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await addNodeBySidebarClick(page, 1)
  await page.waitForTimeout(500)
  const vpcNode = page.locator('.react-flow__node').first()
  if (await vpcNode.count() > 0) {
    await vpcNode.click()
    await page.waitForTimeout(600)
  }
  const slider = page.locator('input[type="range"]').first()
  if (await slider.count() > 0) {
    await slider.fill('2')
    await slider.dispatchEvent('input')
    await slider.dispatchEvent('change')
    await page.waitForTimeout(800)
  }
  await shot(page, '08-az-sync.png')
  const azNodes = page.locator('.react-flow__node')
  for (let i = 0; i < await azNodes.count(); i++) {
    const text = await azNodes.nth(i).textContent()
    if (text?.toLowerCase().includes('az') || text?.toLowerCase().includes('availability')) {
      await azNodes.nth(i).click({ force: true })
      break
    }
  }
  await page.waitForTimeout(600)
  await shot(page, '09-az-unsync.png')

  // ── 10: shift+click ───────────────────────────────────────────────
  console.log('10/13 Shift+click...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  for (let i = 6; i < 9; i++) await addNodeBySidebarClick(page, i)
  await page.waitForTimeout(300)
  const n0 = page.locator('.react-flow__node').nth(0)
  await n0.click({ force: true })
  await page.waitForTimeout(300)
  await page.locator('.react-flow__node').nth(1).click({ modifiers: ['Shift'], force: true })
  await page.waitForTimeout(400)
  await shot(page, '10-shift-click.png')

  // ── 11: shift+drag ────────────────────────────────────────────────
  console.log('11/13 Shift+drag...')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)
  const canvas = page.locator('.react-flow__pane')
  const box = await canvas.boundingBox()
  if (box) {
    await page.keyboard.down('Shift')
    await page.mouse.move(box.x + 70, box.y + 70)
    await page.mouse.down()
    await page.mouse.move(box.x + 600, box.y + 500, { steps: 15 })
    await page.waitForTimeout(300)
    await shot(page, '11-shift-drag.png')
    await page.mouse.up()
    await page.keyboard.up('Shift')
  } else {
    await shot(page, '11-shift-drag.png')
  }

  // ── 12: add to selection ──────────────────────────────────────────
  console.log('12/13 Add to selection...')
  await page.waitForTimeout(300)
  const selNodes = page.locator('.react-flow__node')
  const total = await selNodes.count()
  if (total >= 3) {
    await selNodes.nth(0).click({ force: true })
    await page.waitForTimeout(200)
    await selNodes.nth(1).click({ modifiers: ['Shift'], force: true })
    await page.waitForTimeout(200)
    await selNodes.nth(2).click({ modifiers: ['Shift'], force: true })
    await page.waitForTimeout(400)
  }
  await shot(page, '12-add-to-selection.png')

  // ── 13: alignment toolbar ─────────────────────────────────────────
  console.log('13/13 Alignment toolbar...')
  await page.waitForTimeout(200)
  await shot(page, '13-alignment-toolbar.png')

  await browser.close()
  console.log('\nAll screenshots saved to public/docs/screenshots/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
