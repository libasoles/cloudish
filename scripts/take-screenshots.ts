/**
 * Playwright script to take tutorial screenshots.
 * Run with: npm run screenshots
 * Requires the dev server to be running on port 5174.
 */

import { chromium, type Page } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCREENSHOTS_DIR = path.join(__dirname, '../public/docs/screenshots')
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5175'
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
  // Click the nth draggable sidebar button
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
  const context = await browser.newContext({ viewport: VIEWPORT })
  const page = await context.newPage()

  // Dismiss any auth modal that might appear
  page.on('dialog', d => d.dismiss())

  console.log('Starting screenshot capture...\n')
  await loadApp(page)

  // Close any modal that appeared
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  // ── 01: sidebar drag (show the sidebar with hover) ────────────────
  console.log('1/13 Sidebar drag...')
  const firstDraggable = page.locator('aside button[draggable="true"]').first()
  await firstDraggable.hover()
  await page.waitForTimeout(400)
  await shot(page, '01-sidebar-drag.png')

  // ── 02: sidebar click ─────────────────────────────────────────────
  console.log('2/13 Sidebar click...')
  // Find an AWS service button — skip container-type buttons (first ~5 are Region/VPC/AZ/Subnet/Text)
  const serviceBtn = page.locator('aside button[draggable="true"]').nth(6)
  await serviceBtn.hover()
  await page.waitForTimeout(300)
  await serviceBtn.click()
  await page.waitForTimeout(600)
  await shot(page, '02-sidebar-click.png')

  // ── 03: search panel ─────────────────────────────────────────────
  console.log('3/13 Search panel...')
  await page.keyboard.press('Meta+k')
  await page.waitForTimeout(700)
  const searchInput = page.locator('input[placeholder*="earch"], input[placeholder*="uscar"]').first()
  if (await searchInput.count() > 0) {
    await searchInput.fill('lambda')
    await page.waitForTimeout(600)
  }
  await shot(page, '03-search.png')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)

  // ── 04: connect nodes ─────────────────────────────────────────────
  console.log('4/13 Connect nodes...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  // Add two nodes
  await addNodeBySidebarClick(page, 6)
  await addNodeBySidebarClick(page, 7)
  await page.waitForTimeout(300)
  // Hover over first node to reveal handles
  const firstNode = page.locator('.react-flow__node').first()
  if (await firstNode.count() > 0) {
    await firstNode.hover({ force: true })
    await page.waitForTimeout(500)
  }
  await shot(page, '04-connect-nodes.png')

  // ── 05: region + vpc ──────────────────────────────────────────────
  console.log('5/13 Region + VPC...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  // Add Region (index 0) and VPC (index 1)
  await addNodeBySidebarClick(page, 0)
  await addNodeBySidebarClick(page, 1)
  await page.waitForTimeout(500)
  await shot(page, '05-region-vpc.png')

  // ── 06: AZ inspector (VPC selected) ──────────────────────────────
  console.log('6/13 AZ inspector...')
  // Click on VPC node to open inspector
  const nodes = page.locator('.react-flow__node')
  const nodeCount = await nodes.count()
  for (let i = 0; i < nodeCount; i++) {
    const text = await nodes.nth(i).textContent()
    if (text?.toLowerCase().includes('vpc')) {
      await nodes.nth(i).click({ force: true })
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
  await addNodeBySidebarClick(page, 3) // Subnet
  await page.waitForTimeout(400)
  // Click the subnet node
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
  // Add VPC with at least 2 AZs via inspector
  await addNodeBySidebarClick(page, 1) // VPC
  await page.waitForTimeout(500)
  // Select VPC and use inspector to add AZs
  const vpcNode = page.locator('.react-flow__node').first()
  if (await vpcNode.count() > 0) {
    await vpcNode.click()
    await page.waitForTimeout(600)
  }
  // Try to increase AZ count slider
  const slider = page.locator('input[type="range"]').first()
  if (await slider.count() > 0) {
    await slider.fill('2')
    await slider.dispatchEvent('input')
    await slider.dispatchEvent('change')
    await page.waitForTimeout(800)
  }
  await shot(page, '08-az-sync.png')
  // Click on an AZ to see sync control
  for (let i = 0; i < await nodes.count(); i++) {
    const text = await nodes.nth(i).textContent()
    if (text?.toLowerCase().includes('az') || text?.toLowerCase().includes('availability')) {
      await nodes.nth(i).click({ force: true })
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
  // Click first node
  const n0 = page.locator('.react-flow__node').nth(0)
  await n0.click({ force: true })
  await page.waitForTimeout(300)
  // Shift+click second
  await page.locator(".react-flow__node").nth(1).click({ modifiers: ["Shift"], force: true })
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
  const allNodes = page.locator('.react-flow__node')
  const total = await allNodes.count()
  if (total >= 3) {
    await allNodes.nth(0).click({ force: true })
    await page.waitForTimeout(200)
    await allNodes.nth(1).click({ modifiers: ["Shift"], force: true })
    await page.waitForTimeout(200)
    await allNodes.nth(2).click({ modifiers: ["Shift"], force: true })
    await page.waitForTimeout(400)
  }
  await shot(page, '12-add-to-selection.png')

  // ── 13: alignment toolbar ─────────────────────────────────────────
  console.log('13/13 Alignment toolbar...')
  // Toolbar should be visible with 2+ nodes selected
  await page.waitForTimeout(200)
  await shot(page, '13-alignment-toolbar.png')

  await browser.close()
  console.log('\nAll screenshots saved to public/docs/screenshots/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
