/**
 * Feature demo video recording script.
 * Run with: npm run demo
 * Requires the dev server to be running on port 5173.
 *
 * Output: ./testreel-output/<timestamp>.mp4
 *
 * Scenes:
 * 1. Adding services (sidebar + search) ~15s
 * 2. Connect nodes ~12s
 * 3. Hierarchical containers ~30s
 * 4. Subnet type + AZ Sync ~18s
 * 5. Multi-select and alignment ~20s
 */

import { chromium, type Locator, type Page } from 'playwright'
import { recordPage } from 'testreel'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8888'
const VIEWPORT = { width: 1920, height: 1080 }

// ── Helpers (verbatim copies from take-screenshots.ts) ─────────────────────

async function loadApp(page: Page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForSelector('.react-flow__pane', { timeout: 20000 })
  await page.waitForTimeout(1200)
}

async function addNodeBySidebarClick(page: Page, index = 0) {
  const buttons = page.locator('aside button[draggable="true"]')
  const count = await buttons.count()
  if (count > index) {
    const previousNodeCount = await page.locator('.react-flow__node').count()
    await buttons.nth(index).click()
    await page.waitForFunction(
      (expectedCount) => document.querySelectorAll('.react-flow__node').length > expectedCount,
      previousNodeCount,
      { timeout: 5000 },
    )
    await page.waitForTimeout(300)
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

async function positionNodeAt(page: Page, nodeIndex: number, targetX: number, targetY: number) {
  const nodes = page.locator('.react-flow__node')
  const nodeCount = await nodes.count()
  if (nodeCount <= nodeIndex) return

  const node = nodes.nth(nodeIndex)
  const bbox = await node.boundingBox()
  if (!bbox) return

  const centerX = bbox.x + bbox.width / 2
  const centerY = bbox.y + bbox.height / 2

  await page.mouse.move(centerX, centerY)
  await page.waitForTimeout(100)
  await page.mouse.down()
  await page.mouse.move(targetX, targetY, { steps: 10 })
  await page.waitForTimeout(150)
  await page.mouse.up()
  await page.waitForTimeout(300)
}

async function positionNodeLocatorAt(page: Page, node: Locator, targetX: number, targetY: number) {
  const bbox = await node.boundingBox()
  if (!bbox) return

  const centerX = bbox.x + bbox.width / 2
  const centerY = bbox.y + bbox.height / 2

  await page.mouse.move(centerX, centerY)
  await page.waitForTimeout(100)
  await page.mouse.down()
  await page.mouse.move(targetX, targetY, { steps: 12 })
  await page.waitForTimeout(150)
  await page.mouse.up()
  await page.waitForTimeout(500)
}

async function clearCanvasSelection(page: Page) {
  await page.keyboard.press('Escape')
  await page.mouse.click(420, 920)
  await page.waitForTimeout(250)
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: VIEWPORT,
    locale: 'es-ES',
    recordVideo: { dir: './testreel-output/', size: VIEWPORT },
  })
  const page = await context.newPage()
  page.on('dialog', d => d.dismiss())

  const recorder = await recordPage(page, {
    chrome: true,
    cursor: {
      style: 'circle',
      size: 28,
      color: '#60a5fa',
      ripple: true,
      hideWhenIdle: false,
    },
    background: {
      color: '#0a0a0a',
      padding: 40,
      borderRadius: 12,
    },
    outputFormat: 'mp4',
  })

  // ── Scene 1 — Adding services (sidebar + search) ───────────────────────
  console.log('Scene 1: Adding services...')
  await loadApp(page)

  // Hover EC2 button (index 8)
  const ec2Btn = page.locator('aside button[draggable="true"]').nth(8)
  await ec2Btn.hover()
  const ec2BtnBox = await ec2Btn.boundingBox()
  if (ec2BtnBox) {
    const ec2X = ec2BtnBox.x + ec2BtnBox.width / 2
    const ec2Y = ec2BtnBox.y + ec2BtnBox.height / 2
    await addMouseCursor(page, ec2X - 8, ec2Y - 8)
  }
  await page.waitForTimeout(600)
  await removeMouseCursor(page)

  // Add EC2 node
  await addNodeBySidebarClick(page, 8)
  await page.waitForTimeout(400)

  // Move EC2 left
  await positionNodeAt(page, 0, 680, 400)

  // Click empty area to deselect
  await page.mouse.click(960, 200)
  await page.waitForTimeout(200)

  // Open ServiceSearch
  await page.keyboard.press('Meta+k')
  await page.waitForTimeout(400)

  // Fill search with 'rds'
  const searchInput = page.locator('input[placeholder*="uscar"]').first()
  await searchInput.fill('rds')
  await page.waitForTimeout(500)

  // Add RDS to canvas
  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)

  // Move RDS right
  await positionNodeAt(page, 1, 1200, 400)

  await clearCanvasSelection(page)
  await page.waitForTimeout(300)

  // ── Scene 2 — Connect nodes ────────────────────────────────────────────
  console.log('Scene 2: Connect nodes...')
  // Continue from Scene 1 (EC2 left, RDS right)

  const nodes = page.locator('.react-flow__node')
  const ec2Node = nodes.nth(0)
  const rdsNode = nodes.nth(1)

  const ec2Box = await ec2Node.boundingBox()
  const rdsBox = await rdsNode.boundingBox()

  if (ec2Box && rdsBox) {
    // Hover EC2 center to make handle appear
    await page.mouse.move(ec2Box.x + ec2Box.width / 2, ec2Box.y + ec2Box.height / 2)
    await page.waitForTimeout(400)

    // Move to EC2 right edge (handle position)
    const srcX = ec2Box.x + ec2Box.width
    const srcY = ec2Box.y + ec2Box.height / 2
    await page.mouse.move(srcX, srcY)
    await page.waitForTimeout(400)

    await addClickIndicator(page, srcX, srcY)
    await page.waitForTimeout(300)

    // Drag from EC2 handle to RDS left edge
    const tgtX = rdsBox.x
    const tgtY = rdsBox.y + rdsBox.height / 2
    await page.mouse.down()
    await page.mouse.move(tgtX, tgtY, { steps: 40 })
    await page.mouse.up()
    await page.waitForTimeout(800)

    await removeClickIndicator(page)
  }

  await clearCanvasSelection(page)
  await page.waitForTimeout(300)

  // ── Scene 3 — Hierarchical containers ─────────────────────────────────
  console.log('Scene 3: Hierarchical containers...')
  await loadApp(page)

  // Add Region (index 2)
  await addNodeBySidebarClick(page, 2)
  await page.waitForTimeout(600)

  // Add VPC (index 6) — auto-nests inside Region
  await addNodeBySidebarClick(page, 6)
  await page.waitForTimeout(600)

  // Click on VPC node
  const vpcNode = page.locator('.react-flow__node').filter({ hasText: /vpc/i }).first()
  await vpcNode.click({ force: true })
  await page.waitForTimeout(600)

  // Fill slider to 2 AZs
  const slider = page.locator('input[type="range"]').first()
  if (await slider.count() > 0) {
    await slider.fill('2')
    await slider.dispatchEvent('input')
    await slider.dispatchEvent('change')
    await page.waitForTimeout(1000)
  }

  // Add Subnet (index 4)
  await addNodeBySidebarClick(page, 4)
  await page.waitForTimeout(500)

  // Find first AZ bounding box and drag subnet inside it
  const firstAzNode = page
    .locator('.react-flow__node')
    .filter({ hasText: /az|availability/i })
    .first()
  const firstAzBox = await firstAzNode.boundingBox()

  if (firstAzBox) {
    const subnetNode = page.locator('.react-flow__node').filter({ hasText: /subnet/i }).first()
    const subnetTargetX = firstAzBox.x + firstAzBox.width * 0.5
    const subnetTargetY = firstAzBox.y + firstAzBox.height * 0.5
    await positionNodeLocatorAt(page, subnetNode, subnetTargetX, subnetTargetY)
  }

  // Add EC2 (index 8)
  await addNodeBySidebarClick(page, 8)
  await page.waitForTimeout(400)

  // Drag EC2 inside the subnet
  if (firstAzBox) {
    const ec2ServiceNode = page.locator('.react-flow__node').filter({ hasText: /ec2/i }).first()
    const ec2TargetX = firstAzBox.x + firstAzBox.width * 0.5
    const ec2TargetY = firstAzBox.y + firstAzBox.height * 0.5
    await positionNodeLocatorAt(page, ec2ServiceNode, ec2TargetX, ec2TargetY)
  }

  await clearCanvasSelection(page)
  await page.waitForTimeout(500)

  // ── Scene 4 — Subnet type + AZ Sync ───────────────────────────────────
  console.log('Scene 4: Subnet type + AZ Sync...')
  // Continue from Scene 3 state

  // Find and click subnet node
  const subnetNode = page.locator('.react-flow__node').filter({ hasText: /subnet/i }).first()
  await subnetNode.click({ force: true })
  await page.waitForTimeout(400)

  // Open combobox/select
  const typeSelect = page.locator('select, [role="combobox"]').nth(0)
  await typeSelect.click()
  await page.waitForTimeout(400)

  // Find and click "pública" option
  const publicaOption = page.locator('[role="option"]').filter({ hasText: /pública/i }).first()
  const publicaOptionBox = await publicaOption.boundingBox()
  if (publicaOptionBox) {
    const optX = publicaOptionBox.x + publicaOptionBox.width / 2
    const optY = publicaOptionBox.y + publicaOptionBox.height / 2
    await addClickIndicator(page, optX, optY)
    await page.waitForTimeout(300)
    await publicaOption.click()
    await removeClickIndicator(page)
  } else {
    await publicaOption.click()
  }
  await page.waitForTimeout(500)

  await clearCanvasSelection(page)
  await page.waitForTimeout(300)

  // Click VPC node to make slider available
  const vpcNode4 = page.locator('.react-flow__node').filter({ hasText: /vpc/i }).first()
  await vpcNode4.click({ force: true })
  await page.waitForTimeout(400)

  // Fill slider to 2 AZs (may already be 2)
  const slider4 = page.locator('input[type="range"]').first()
  if (await slider4.count() > 0) {
    await slider4.fill('2')
    await slider4.dispatchEvent('input')
    await slider4.dispatchEvent('change')
    await page.waitForTimeout(500)
  }

  // Add Lambda (index 10)
  await addNodeBySidebarClick(page, 10)
  await page.waitForTimeout(400)

  // Drag Lambda into first AZ
  const firstAzBox4 = await firstAzNode.boundingBox()
  if (firstAzBox4) {
    const lambdaNode = page.locator('.react-flow__node').filter({ hasText: /lambda/i }).first()
    await positionNodeLocatorAt(page, lambdaNode, firstAzBox4.x + firstAzBox4.width * 0.5, firstAzBox4.y + firstAzBox4.height * 0.65)
  }

  await clearCanvasSelection(page)
  await page.waitForTimeout(300)

  // Click first AZ node
  const firstAzBox4b = await firstAzNode.boundingBox()
  if (firstAzBox4b) {
    await page.mouse.click(firstAzBox4b.x + 44, firstAzBox4b.y + 18)
  } else {
    await firstAzNode.click({ force: true })
  }
  await page.waitForTimeout(500)

  // Click "Sincronizar AZs" button
  await page.getByText('Sincronizar AZs').click()
  await page.waitForTimeout(1000)

  await clearCanvasSelection(page)
  await page.waitForTimeout(300)

  // ── Scene 5 — Multi-select and alignment ──────────────────────────────
  console.log('Scene 5: Multi-select and alignment...')
  await loadApp(page)

  // Add 3 nodes at staggered positions
  await addNodeBySidebarClick(page, 8) // EC2
  await page.waitForTimeout(300)
  await positionNodeAt(page, 0, 600, 260)

  await addNodeBySidebarClick(page, 10) // Lambda
  await page.waitForTimeout(300)
  await positionNodeAt(page, 1, 1000, 370)

  await addNodeBySidebarClick(page, 12) // RDS
  await page.waitForTimeout(300)
  await positionNodeAt(page, 2, 1400, 300)

  await clearCanvasSelection(page)
  await page.waitForTimeout(300)

  // Calculate bounding box of all 3 nodes for shift+drag selection
  const alignNodes = page.locator('.react-flow__node')
  const nodeCount = await alignNodes.count()
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  for (let i = 0; i < nodeCount; i++) {
    const nodeBox = await alignNodes.nth(i).boundingBox()
    if (nodeBox) {
      minX = Math.min(minX, nodeBox.x)
      minY = Math.min(minY, nodeBox.y)
      maxX = Math.max(maxX, nodeBox.x + nodeBox.width)
      maxY = Math.max(maxY, nodeBox.y + nodeBox.height)
    }
  }

  const padding = 60
  const startX = minX - padding
  const startY = minY - padding
  const endX = maxX + padding
  const endY = maxY + padding

  // Shift+drag to select all nodes
  if (isFinite(startX) && isFinite(startY) && isFinite(endX) && isFinite(endY)) {
    await page.keyboard.down('Shift')
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(endX, endY, { steps: 15 })
    await page.mouse.up()
    await page.keyboard.up('Shift')
    await page.waitForTimeout(400)
  }

  // Click align-horizontal button
  await page.locator('[data-testid="align-horizontal"]').click()
  await page.waitForTimeout(600)

  await clearCanvasSelection(page)
  await page.waitForTimeout(400)

  // Shift+click demonstration
  await alignNodes.nth(0).click({ force: true })
  await page.waitForTimeout(200)
  await alignNodes.nth(1).click({ modifiers: ['Shift'], force: true })
  await page.waitForTimeout(200)
  await alignNodes.nth(2).click({ modifiers: ['Shift'], force: true })
  await page.waitForTimeout(300)

  await clearCanvasSelection(page)
  await page.waitForTimeout(300)

  // ── Finish ─────────────────────────────────────────────────────────────
  await browser.close()

  const result = await recorder.stop()
  console.log('Video saved:', result.video)
}

main().catch(err => { console.error(err); process.exit(1) })
