/**
 * Playwright script to take tutorial screenshots.
 * Run with: npm run screenshots
 * Requires the dev server to be running on port 5173.
 *
 * Screenshots are organized in subdirectories by tutorial section:
 * - sidebar/
 * - search/
 * - connect-nodes/
 * - region-vpc/
 * - az-slider/
 * - subnet-type/
 * - az-sync/
 * - shift-click/
 * - shift-drag/
 * - add-to-selection/
 * - alignment/
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
  const dest = path.join(dir, name)
  await page.screenshot({ path: dest, fullPage: false })
  console.log(`  ✓ ${subdir}/${name}`)
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
  const context = await browser.newContext({ viewport: VIEWPORT, locale: 'es-ES' })
  const page = await context.newPage()

  page.on('dialog', d => d.dismiss())

  console.log('Starting screenshot capture...\n')
  await loadApp(page)

  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  // ── sidebar: EC2 drag ──────────────────────────────────────────────
  console.log('1/11 Sidebar (EC2 hover)...')
  const ec2Btn = page.locator('aside button[draggable="true"]').nth(8) // EC2
  await ec2Btn.hover()
  await page.waitForTimeout(400)
  await shot(page, 'sidebar', 'ec2-hover.png')

  // ── search: RDS ────────────────────────────────────────────────────
  console.log('2/11 Search (RDS)...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await page.keyboard.press('Meta+k')
  await page.waitForTimeout(400)
  const searchInput = page.locator('input[placeholder*="uscar"]').first()
  if (await searchInput.count() > 0) {
    await searchInput.fill('rds')
    await page.waitForTimeout(600)
  }
  await shot(page, 'search', 'rds.png')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)

  // ── connect-nodes: EC2 + RDS (3 steps) ─────────────────────────────
  console.log('3/11 Connect nodes (EC2 + RDS)...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // Add EC2 on the left
  await addNodeBySidebarClick(page, 8)
  await page.waitForTimeout(400)

  const nodes = page.locator('.react-flow__node')
  const ec2Node = nodes.first()
  const box1 = await ec2Node.boundingBox()
  if (box1) {
    const cx = box1.x + box1.width / 2
    const cy = box1.y + box1.height / 2
    await page.mouse.move(cx, cy)
    await page.waitForTimeout(150)
    await page.mouse.down()
    await page.mouse.move(cx - 300, cy, { steps: 12 })
    await page.waitForTimeout(150)
    await page.mouse.up()
    await page.waitForTimeout(300)
  }

  // Click empty area
  await page.mouse.click(960, 400)
  await page.waitForTimeout(200)

  // Add RDS on the right
  await addNodeBySidebarClick(page, 12)
  await page.waitForTimeout(400)

  // Start: both nodes separated
  await shot(page, 'connect-nodes', 'start.png')

  // Move RDS to the right
  const rdsNode = nodes.nth(1)
  const box2 = await rdsNode.boundingBox()
  if (box2) {
    const cx = box2.x + box2.width / 2
    const cy = box2.y + box2.height / 2
    await page.mouse.move(cx, cy)
    await page.waitForTimeout(150)
    await page.mouse.down()
    await page.mouse.move(cx + 300, cy, { steps: 12 })
    await page.waitForTimeout(150)
    await page.mouse.up()
    await page.waitForTimeout(300)
  }

  // Click empty area
  await page.mouse.click(960, 200)
  await page.waitForTimeout(200)

  const updatedBox1 = await ec2Node.boundingBox()
  const updatedBox2 = await rdsNode.boundingBox()

  if (updatedBox1 && updatedBox2) {
    const srcX = updatedBox1.x + updatedBox1.width
    const srcY = updatedBox1.y + updatedBox1.height / 2
    const tgtX = updatedBox2.x
    const tgtY = updatedBox2.y + updatedBox2.height / 2

    // Hover to show handle
    await page.mouse.move(updatedBox1.x + updatedBox1.width / 2, updatedBox1.y + updatedBox1.height / 2)
    await page.waitForTimeout(400)
    await page.mouse.move(srcX, srcY)
    await page.waitForTimeout(400)
    await shot(page, 'connect-nodes', 'handle.png')

    // Drag to create edge
    await page.mouse.down()
    await page.mouse.move(tgtX, tgtY, { steps: 40 })
    await page.waitForTimeout(500)
    await page.mouse.up()
    await page.waitForTimeout(800)
  }

  await shot(page, 'connect-nodes', 'done.png')

  // ── region-vpc: Region + VPC nested (2 steps) ──────────────────────
  console.log('4/11 Region + VPC...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  await addNodeBySidebarClick(page, 2) // Region
  await page.waitForTimeout(600)
  await shot(page, 'region-vpc', 'region.png')

  await addNodeBySidebarClick(page, 6) // VPC
  await page.waitForTimeout(600)
  await shot(page, 'region-vpc', 'nested.png')

  // ── az-slider: VPC with AZ slider (2 steps) ────────────────────────
  console.log('5/11 AZ slider...')
  const vpcNodes = page.locator('.react-flow__node')
  const vpcNodeCount = await vpcNodes.count()
  for (let i = 0; i < vpcNodeCount; i++) {
    const text = await vpcNodes.nth(i).textContent()
    if (text?.toLowerCase().includes('vpc')) {
      await vpcNodes.nth(i).click({ force: true })
      break
    }
  }
  await page.waitForTimeout(600)
  await shot(page, 'az-slider', 'before.png')

  const slider = page.locator('input[type="range"]').first()
  if (await slider.count() > 0) {
    await slider.fill('2')
    await slider.dispatchEvent('input')
    await slider.dispatchEvent('change')
    await page.waitForTimeout(1000)
  }

  await shot(page, 'az-slider', 'after.png')

  // ── subnet-type: Subnet public → private (2 steps) ─────────────────
  console.log('6/11 Subnet type...')

  await addNodeBySidebarClick(page, 4) // Subnet
  await page.waitForTimeout(500)

  const allNodes2 = page.locator('.react-flow__node')
  const subnetNodeCount = await allNodes2.count()
  let subnetIndex = -1
  for (let i = 0; i < subnetNodeCount; i++) {
    const text = await allNodes2.nth(i).textContent()
    if (text?.toLowerCase().includes('subnet')) {
      subnetIndex = i
      break
    }
  }
  if (subnetIndex >= 0) {
    await allNodes2.nth(subnetIndex).click({ force: true })
    await page.waitForTimeout(600)
  }

  await shot(page, 'subnet-type', 'public.png')

  const typeSelect = page.locator('select, [role="combobox"]').nth(0)
  if (await typeSelect.count() > 0) {
    await typeSelect.click()
    await page.waitForTimeout(300)
    const options = page.locator('[role="option"]')
    for (let i = 0; i < await options.count(); i++) {
      const text = await options.nth(i).textContent()
      if (text?.toLowerCase().includes('privada')) {
        await options.nth(i).click()
        break
      }
    }
    await page.waitForTimeout(600)
  }

  await shot(page, 'subnet-type', 'private.png')

  // ── az-sync: Sync OFF → ON (2 steps) ───────────────────────────────
  console.log('7/11 AZ sync...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  await addNodeBySidebarClick(page, 6) // VPC
  await page.waitForTimeout(500)

  const vpcNode3 = page.locator('.react-flow__node').first()
  if (await vpcNode3.count() > 0) {
    await vpcNode3.click()
    await page.waitForTimeout(600)
  }

  const slider3 = page.locator('input[type="range"]').first()
  if (await slider3.count() > 0) {
    await slider3.fill('2')
    await slider3.dispatchEvent('input')
    await slider3.dispatchEvent('change')
    await page.waitForTimeout(800)
  }

  await addNodeBySidebarClick(page, 8) // EC2
  await page.waitForTimeout(400)

  await addNodeBySidebarClick(page, 12) // RDS
  await page.waitForTimeout(600)

  await page.mouse.click(100, 400)
  await page.waitForTimeout(200)

  await shot(page, 'az-sync', 'off.png')

  const azNodes = page.locator('.react-flow__node')
  for (let i = 0; i < await azNodes.count(); i++) {
    const text = await azNodes.nth(i).textContent()
    if (text?.toLowerCase().includes('az') || text?.toLowerCase().includes('availability')) {
      await azNodes.nth(i).click({ force: true })
      break
    }
  }
  await page.waitForTimeout(600)

  const syncCheckbox = page.locator('input[type="checkbox"]').nth(0)
  if (await syncCheckbox.count() > 0) {
    await syncCheckbox.click()
    await page.waitForTimeout(1000)
  }

  await shot(page, 'az-sync', 'on.png')

  // ── shift-click: Multi-select by shift+click ───────────────────────
  console.log('8/11 Shift+click...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  for (const idx of [8, 10, 12, 15]) {
    await addNodeBySidebarClick(page, idx)
    await page.waitForTimeout(300)
  }
  await page.waitForTimeout(300)
  const n0 = page.locator('.react-flow__node').nth(0)
  await n0.click({ force: true })
  await page.waitForTimeout(300)
  await page.locator('.react-flow__node').nth(1).click({ modifiers: ['Shift'], force: true })
  await page.waitForTimeout(400)
  await shot(page, 'shift-click', 'shift-click.png')

  // ── shift-drag: Selection box (2 steps) ────────────────────────────
  console.log('9/11 Shift+drag...')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)

  await shot(page, 'shift-drag', 'start.png')

  const canvas = page.locator('.react-flow__pane')
  const box = await canvas.boundingBox()
  if (box) {
    await page.keyboard.down('Shift')
    await page.mouse.move(box.x + 70, box.y + 70)
    await page.mouse.down()
    await page.mouse.move(box.x + 600, box.y + 500, { steps: 15 })
    await page.waitForTimeout(300)
    await shot(page, 'shift-drag', 'box.png')
    await page.mouse.up()
    await page.keyboard.up('Shift')
  }

  // ── add-to-selection ───────────────────────────────────────────────
  console.log('10/11 Add to selection...')
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
  await shot(page, 'add-to-selection', 'add-to-selection.png')

  // ── alignment: Nodes misaligned → aligned (2 steps) ────────────────
  console.log('11/11 Alignment toolbar...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // Add 3 nodes
  for (const idx of [8, 10, 12]) {
    await addNodeBySidebarClick(page, idx)
    await page.waitForTimeout(300)
  }
  await page.waitForTimeout(400)

  // Select all nodes
  const alignNodes = page.locator('.react-flow__node')
  const cnt = await alignNodes.count()
  for (let i = 0; i < Math.min(cnt, 3); i++) {
    const modifiers = i === 0 ? [] : ['Shift']
    await alignNodes.nth(i).click({ modifiers: modifiers as ('Shift' | 'Control' | 'Meta' | 'Alt')[], force: true })
    await page.waitForTimeout(200)
  }
  await page.waitForTimeout(400)

  // Misalign first node horizontally
  const node0 = alignNodes.nth(0)
  const box0 = await node0.boundingBox()
  if (box0) {
    const cx = box0.x + box0.width / 2
    const cy = box0.y + box0.height / 2
    await page.mouse.move(cx, cy)
    await page.waitForTimeout(150)
    await page.mouse.down()
    await page.mouse.move(cx - 100, cy, { steps: 6 })
    await page.waitForTimeout(100)
    await page.mouse.up()
    await page.waitForTimeout(300)

    // Re-select all nodes
    await alignNodes.nth(0).click({ force: true })
    await page.waitForTimeout(200)
    await alignNodes.nth(1).click({ modifiers: ['Shift'], force: true })
    await page.waitForTimeout(200)
    await alignNodes.nth(2).click({ modifiers: ['Shift'], force: true })
    await page.waitForTimeout(400)
  }

  await shot(page, 'alignment', 'before.png')

  // Click alignment button
  // Try multiple selectors to find the alignment button
  let alignBtn = page.locator('[data-testid="align-horizontal"]').first()
  let btnCount = await alignBtn.count()

  if (btnCount === 0) {
    // Try title selector
    alignBtn = page.locator('button[title*="horizontal"]').first()
    btnCount = await alignBtn.count()
  }

  console.log(`  Alignment button found: ${btnCount > 0 ? 'YES' : 'NO'}`)
  if (btnCount > 0) {
    await alignBtn.click()
    await page.waitForTimeout(600)
    await shot(page, 'alignment', 'after.png')
  } else {
    console.log('  ⚠ alignment/after.png skipped (SelectionToolbar not visible)')
  }

  await browser.close()
  console.log('\nAll screenshots saved to public/docs/screenshots/ in organized subdirectories:')
  console.log('  sidebar/, search/, connect-nodes/, region-vpc/, az-slider/, subnet-type/')
  console.log('  az-sync/, shift-click/, shift-drag/, add-to-selection/, alignment/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
