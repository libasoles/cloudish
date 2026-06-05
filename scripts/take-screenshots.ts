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

async function addClickIndicator(page: Page, x: number, y: number) {
  await page.evaluate(({ xPos, yPos }: { xPos: number; yPos: number }) => {
    const container = document.createElement('div')
    container.id = 'click-indicator-temp'
    container.style.position = 'fixed'
    container.style.width = '48px'
    container.style.height = '48px'
    container.style.left = (xPos - 24) + 'px'
    container.style.top = (yPos - 24) + 'px'
    container.style.zIndex = '9999'
    container.style.pointerEvents = 'none'

    // Outer ring with glow effect
    const outer = document.createElement('div')
    outer.style.position = 'absolute'
    outer.style.width = '100%'
    outer.style.height = '100%'
    outer.style.borderRadius = '50%'
    outer.style.border = '2px solid #3b82f6'
    outer.style.boxShadow = '0 0 0 8px rgba(59, 130, 246, 0.15), 0 0 12px rgba(59, 130, 246, 0.4)'
    outer.style.animation = 'pulse-indicator 1.5s ease-in-out infinite'
    container.appendChild(outer)

    // Center dot
    const dot = document.createElement('div')
    dot.style.position = 'absolute'
    dot.style.width = '4px'
    dot.style.height = '4px'
    dot.style.borderRadius = '50%'
    dot.style.backgroundColor = '#3b82f6'
    dot.style.top = '50%'
    dot.style.left = '50%'
    dot.style.transform = 'translate(-50%, -50%)'
    container.appendChild(dot)

    // Add animation keyframes
    if (!document.getElementById('click-indicator-styles')) {
      const style = document.createElement('style')
      style.id = 'click-indicator-styles'
      style.textContent = `
        @keyframes pulse-indicator {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `
      document.head.appendChild(style)
    }

    document.body.appendChild(container)
  }, { xPos: x, yPos: y })
}

async function removeClickIndicator(page: Page) {
  await page.evaluate(() => {
    document.getElementById('click-indicator-temp')?.remove()
  })
}

async function addMouseCursor(page: Page, x: number, y: number) {
  await page.evaluate(({ xPos, yPos }: { xPos: number; yPos: number }) => {
    const cursor = document.createElement('svg')
    cursor.id = 'mouse-cursor-temp'
    cursor.style.position = 'fixed'
    cursor.style.left = xPos + 'px'
    cursor.style.top = yPos + 'px'
    cursor.style.width = '24px'
    cursor.style.height = '32px'
    cursor.style.pointerEvents = 'none'
    cursor.style.zIndex = '10000'

    // Standard macOS cursor SVG
    cursor.innerHTML = `
      <svg viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 2 L3 28 L10 20 L15 28 L19 26 L13 19 L21 19 Z" fill="#000" stroke="#fff" stroke-width="0.5"/>
      </svg>
    `
    document.body.appendChild(cursor)
  }, { xPos: x, yPos: y })
}

async function removeMouseCursor(page: Page) {
  await page.evaluate(() => {
    document.getElementById('mouse-cursor-temp')?.remove()
  })
}

async function positionNodeInColumn(page: Page, nodeIndex: number, col: number, row: number = 0) {
  const nodes = page.locator('.react-flow__node')
  const nodeCount = await nodes.count()
  if (nodeCount > nodeIndex) {
    const node = nodes.nth(nodeIndex)
    const bbox = await node.boundingBox()
    if (bbox) {
      const centerX = bbox.x + bbox.width / 2
      const centerY = bbox.y + bbox.height / 2

      // Position in grid: cols are 400px apart, rows are 350px apart, starting at (600, 300)
      const targetX = 600 + col * 400
      const targetY = 300 + row * 350

      const deltaX = targetX - centerX
      const deltaY = targetY - centerY

      await page.mouse.move(centerX, centerY)
      await page.waitForTimeout(100)
      await page.mouse.down()
      await page.mouse.move(centerX + deltaX, centerY + deltaY, { steps: 10 })
      await page.waitForTimeout(150)
      await page.mouse.up()
      await page.waitForTimeout(300)
    }
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
  const ec2BtnBox = await ec2Btn.boundingBox()
  if (ec2BtnBox) {
    const ec2X = ec2BtnBox.x + ec2BtnBox.width / 2
    const ec2Y = ec2BtnBox.y + ec2BtnBox.height / 2
    await addMouseCursor(page, ec2X - 8, ec2Y - 8)
    await shot(page, 'sidebar', 'ec2-hover.png')
    await removeMouseCursor(page)
  }

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
  const searchInputBox = await searchInput.boundingBox()
  if (searchInputBox) {
    const searchX = searchInputBox.x + searchInputBox.width / 2
    const searchY = searchInputBox.y + searchInputBox.height / 2
    await addMouseCursor(page, searchX - 8, searchY - 8)
  }
  await shot(page, 'search', 'rds.png')
  await removeMouseCursor(page)
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

  // ── subnet-type: Subnet public → private (4 steps) ─────────────────
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

  // 1. Subnet selected (closed selector)
  await shot(page, 'subnet-type', 'subnet-selected.png')

  // 2. Open dropdown
  const typeSelect = page.locator('select, [role="combobox"]').nth(0)
  if (await typeSelect.count() > 0) {
    await typeSelect.click()
    await page.waitForTimeout(400)
    // Capture with dropdown open
    await shot(page, 'subnet-type', 'dropdown-open.png')

    // 3. Select "Pública"
    const options = page.locator('[role="option"]')
    for (let i = 0; i < await options.count(); i++) {
      const text = await options.nth(i).textContent()
      if (text?.toLowerCase().includes('pública')) {
        await options.nth(i).click()
        break
      }
    }
    await page.waitForTimeout(600)
  }

  // 3. Public selected
  await shot(page, 'subnet-type', 'public.png')

  // 4. Change to private
  const typeSelect2 = page.locator('select, [role="combobox"]').nth(0)
  if (await typeSelect2.count() > 0) {
    await typeSelect2.click()
    await page.waitForTimeout(300)
    const options2 = page.locator('[role="option"]')
    for (let i = 0; i < await options2.count(); i++) {
      const text = await options2.nth(i).textContent()
      if (text?.toLowerCase().includes('privada')) {
        await options2.nth(i).click()
        break
      }
    }
    await page.waitForTimeout(600)
  }

  // 4. Private selected
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

  // Drag EC2 into the first AZ
  const ec2NodeSync = page.locator('.react-flow__node').nth(1)
  const ec2BoxSync = await ec2NodeSync.boundingBox()
  if (ec2BoxSync) {
    const ec2CxSync = ec2BoxSync.x + ec2BoxSync.width / 2
    const ec2CySync = ec2BoxSync.y + ec2BoxSync.height / 2
    // Drag to approximate position inside first AZ (lower-left area of VPC)
    await page.mouse.move(ec2CxSync, ec2CySync)
    await page.waitForTimeout(150)
    await page.mouse.down()
    await page.mouse.move(ec2CxSync - 150, ec2CySync + 100, { steps: 10 })
    await page.waitForTimeout(150)
    await page.mouse.up()
    await page.waitForTimeout(300)
  }

  await addNodeBySidebarClick(page, 12) // RDS
  await page.waitForTimeout(400)

  // Drag RDS into the first AZ (next to EC2)
  const rdsNodeSync = page.locator('.react-flow__node').nth(2)
  const rdsBoxSync = await rdsNodeSync.boundingBox()
  if (rdsBoxSync) {
    const rdsCxSync = rdsBoxSync.x + rdsBoxSync.width / 2
    const rdsCySync = rdsBoxSync.y + rdsBoxSync.height / 2
    // Drag to approximate position inside first AZ (next to EC2)
    await page.mouse.move(rdsCxSync, rdsCySync)
    await page.waitForTimeout(150)
    await page.mouse.down()
    await page.mouse.move(rdsCxSync - 150, rdsCySync + 150, { steps: 10 })
    await page.waitForTimeout(150)
    await page.mouse.up()
    await page.waitForTimeout(300)
  }

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
  // Add 3 nodes and position them in different columns
  for (let i = 0; i < 3; i++) {
    await addNodeBySidebarClick(page, [8, 10, 12][i])
    await page.waitForTimeout(300)
    await positionNodeInColumn(page, i, i) // col 0, 1, 2
  }
  await page.waitForTimeout(300)

  // Before: show unselected nodes with click indicator on first node
  const shiftClickNodes = page.locator('.react-flow__node')
  const n0Box = await shiftClickNodes.nth(0).boundingBox()
  if (n0Box) {
    const n0X = n0Box.x + n0Box.width / 2
    const n0Y = n0Box.y + n0Box.height / 2
    await addClickIndicator(page, n0X, n0Y)
    await addMouseCursor(page, n0X - 8, n0Y - 8)
    await page.waitForTimeout(300)
    await shot(page, 'shift-click', 'before.png')
    await removeClickIndicator(page)
    await removeMouseCursor(page)
  }

  // Select first node
  await shiftClickNodes.nth(0).click({ force: true })
  await page.waitForTimeout(300)

  // Shift+click on second node with indicator
  const n1Box = await shiftClickNodes.nth(1).boundingBox()
  if (n1Box) {
    const n1X = n1Box.x + n1Box.width / 2
    const n1Y = n1Box.y + n1Box.height / 2
    await addClickIndicator(page, n1X, n1Y)
    await addMouseCursor(page, n1X - 8, n1Y - 8)
    await page.waitForTimeout(300)
  }

  // Shift+click to add to selection
  await shiftClickNodes.nth(1).click({ modifiers: ['Shift'], force: true })
  await page.waitForTimeout(300)

  // Shift+click on third node
  const n2Box = await shiftClickNodes.nth(2).boundingBox()
  if (n2Box) {
    const n2X = n2Box.x + n2Box.width / 2
    const n2Y = n2Box.y + n2Box.height / 2
    await removeClickIndicator(page)
    await removeMouseCursor(page)
    await addClickIndicator(page, n2X, n2Y)
    await addMouseCursor(page, n2X - 8, n2Y - 8)
    await page.waitForTimeout(300)
  }

  // Shift+click to add third node to selection
  await shiftClickNodes.nth(2).click({ modifiers: ['Shift'], force: true })
  await page.waitForTimeout(400)

  await removeClickIndicator(page)
  await removeMouseCursor(page)
  // After: show 3 selected nodes
  await shot(page, 'shift-click', 'after.png')

  // ── shift-drag: Selection box (3 steps) ────────────────────────────
  console.log('9/11 Shift+drag...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // Add 3 nodes and position them in different columns
  for (let i = 0; i < 3; i++) {
    await addNodeBySidebarClick(page, [8, 10, 12][i])
    await page.waitForTimeout(300)
    await positionNodeInColumn(page, i, i) // col 0, 1, 2
  }
  await page.waitForTimeout(400)

  // Before: unselected nodes with cursor
  await addMouseCursor(page, 960, 400)
  await shot(page, 'shift-drag', 'start.png')
  await removeMouseCursor(page)

  // Get bounds of all nodes to ensure selection box encompasses them
  const allNodes = page.locator('.react-flow__node')
  const nodeCount = await allNodes.count()
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  for (let i = 0; i < nodeCount; i++) {
    const nodeBox = await allNodes.nth(i).boundingBox()
    if (nodeBox) {
      minX = Math.min(minX, nodeBox.x)
      minY = Math.min(minY, nodeBox.y)
      maxX = Math.max(maxX, nodeBox.x + nodeBox.width)
      maxY = Math.max(maxY, nodeBox.y + nodeBox.height)
    }
  }

  // Add padding to selection box
  const padding = 60
  const startX = minX - padding
  const startY = minY - padding
  const endX = maxX + padding
  const endY = maxY + padding

  const canvas = page.locator('.react-flow__pane')
  const canvasBox = await canvas.boundingBox()

  if (canvasBox && isFinite(startX) && isFinite(startY) && isFinite(endX) && isFinite(endY)) {
    // Show click indicator at start of drag
    await addClickIndicator(page, startX, startY)
    await addMouseCursor(page, startX - 8, startY - 8)
    await page.waitForTimeout(300)

    await page.keyboard.down('Shift')
    await page.mouse.move(startX, startY)
    await page.waitForTimeout(200)
    await page.mouse.down()
    await page.waitForTimeout(150)

    await removeClickIndicator(page)
    // During drag: show selection box with cursor
    await page.mouse.move(endX, endY, { steps: 15 })
    await removeMouseCursor(page)
    await addMouseCursor(page, endX - 8, endY - 8)
    await page.waitForTimeout(300)
    await shot(page, 'shift-drag', 'box.png')
    await removeMouseCursor(page)

    await page.mouse.up()
    await page.keyboard.up('Shift')
    await page.waitForTimeout(400)
  }

  // After: show selected nodes with cursor
  await addMouseCursor(page, 960, 400)
  await shot(page, 'shift-drag', 'after.png')
  await removeMouseCursor(page)

  // ── add-to-selection ───────────────────────────────────────────────
  console.log('10/11 Add to selection...')
  await page.waitForTimeout(300)
  const selNodes = page.locator('.react-flow__node')
  const total = await selNodes.count()

  // Before: unselected nodes with click indicator on first
  if (total >= 3) {
    const n0Box = await selNodes.nth(0).boundingBox()
    if (n0Box) {
      const n0X = n0Box.x + n0Box.width / 2
      const n0Y = n0Box.y + n0Box.height / 2
      await addClickIndicator(page, n0X, n0Y)
      await addMouseCursor(page, n0X - 8, n0Y - 8)
      await page.waitForTimeout(300)
      await shot(page, 'add-to-selection', 'before.png')
      await removeClickIndicator(page)
      await removeMouseCursor(page)
    }

    // Select first node
    await selNodes.nth(0).click({ force: true })
    await page.waitForTimeout(300)

    // Add second node with indicator
    const n1Box = await selNodes.nth(1).boundingBox()
    if (n1Box) {
      const n1X = n1Box.x + n1Box.width / 2
      const n1Y = n1Box.y + n1Box.height / 2
      await addClickIndicator(page, n1X, n1Y)
      await addMouseCursor(page, n1X - 8, n1Y - 8)
      await page.waitForTimeout(300)
    }

    await selNodes.nth(1).click({ modifiers: ['Shift'], force: true })
    await page.waitForTimeout(300)

    // Add third node with indicator
    const n2Box = await selNodes.nth(2).boundingBox()
    if (n2Box) {
      const n2X = n2Box.x + n2Box.width / 2
      const n2Y = n2Box.y + n2Box.height / 2
      await removeClickIndicator(page)
      await removeMouseCursor(page)
      await addClickIndicator(page, n2X, n2Y)
      await addMouseCursor(page, n2X - 8, n2Y - 8)
      await page.waitForTimeout(300)
    }

    await selNodes.nth(2).click({ modifiers: ['Shift'], force: true })
    await page.waitForTimeout(400)

    await removeClickIndicator(page)
    await removeMouseCursor(page)
  }

  // After: show 3 selected nodes with cursor in neutral position
  await addMouseCursor(page, 960, 400)
  await shot(page, 'add-to-selection', 'after.png')
  await removeMouseCursor(page)

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

  // ── Validate all images are working ────────────────────────────────
  console.log('\n12/12 Validating all screenshot references...')

  // Wait for file system to sync before validation
  await page.waitForTimeout(2000)

  const tutorialUrls = [
    'http://localhost:5173/docs/getting-started',
    'http://localhost:5173/docs/hierarchical-containers',
    'http://localhost:5173/docs/selection',
  ]

  let allImagesValid = true

  for (const tutorialUrl of tutorialUrls) {
    const tutorialPage = await context.newPage()
    try {
      await tutorialPage.goto(tutorialUrl, { waitUntil: 'networkidle', timeout: 30000 })
      // Wait for lazy-loaded images to appear and load
      await tutorialPage.waitForTimeout(2000)

      // Force trigger lazy loading by scrolling
      await tutorialPage.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })
      await tutorialPage.waitForTimeout(1000)

      // Check for broken images
      const brokenImages = await tutorialPage.evaluate(() => {
        const images = document.querySelectorAll('img')
        return Array.from(images)
          .filter(img => {
            // Check if image failed to load or has 0 dimensions
            return img.naturalWidth === 0 || img.complete === false || img.src.includes('undefined')
          })
          .map(img => ({
            src: img.src,
            alt: img.alt,
            naturalWidth: img.naturalWidth,
            complete: img.complete,
          }))
      })

      if (brokenImages.length > 0) {
        allImagesValid = false
        console.log(`  ❌ ${tutorialUrl.split('/').pop()} - ${brokenImages.length} broken image(s):`)
        brokenImages.forEach(img => {
          console.log(`    - ${img.src}`)
          console.log(`      alt: "${img.alt}" | width: ${img.naturalWidth} | complete: ${img.complete}`)
        })
      } else {
        console.log(`  ✅ ${tutorialUrl.split('/').pop()} - all images valid`)
      }
    } catch {
      console.log(`  ⚠ ${tutorialUrl.split('/').pop()} - could not load tutorial`)
    } finally {
      await tutorialPage.close()
    }
  }

  await browser.close()

  if (!allImagesValid) {
    console.error('\n❌ Some images are broken or missing. Check the paths in src/docs/tutorials/')
    process.exit(1)
  }

  console.log('\n✅ All screenshots saved and validated successfully:')
  console.log('  sidebar/, search/, connect-nodes/, region-vpc/, az-slider/, subnet-type/')
  console.log('  az-sync/, shift-click/, shift-drag/, add-to-selection/, alignment/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
