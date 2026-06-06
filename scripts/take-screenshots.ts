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
 * - multiple-edges/
 * - api-gateway/
 * - vpn-gateway/
 * - edge-inspector/
 */

import { chromium, type Locator, type Page } from 'playwright'
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

async function shotLocator(locator: Locator, subdir: string, name: string) {
  const dir = path.join(SCREENSHOTS_DIR, subdir)
  fs.mkdirSync(dir, { recursive: true })
  const dest = path.join(dir, name)
  await locator.screenshot({ path: dest })
  console.log(`  ✓ ${subdir}/${name}`)
}

async function loadApp(page: Page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForSelector('.react-flow__pane', { timeout: 20000 })
  await page.waitForTimeout(1200)
}

async function addNodeBySearch(page: Page, query: string): Promise<void> {
  await page.click('.react-flow__pane')
  await page.waitForTimeout(300)
  await page.keyboard.press('Meta+k')
  await page.waitForTimeout(500)

  const searchInput = page.locator('input[placeholder*="uscar"]').first()
  await searchInput.waitFor({ state: 'visible', timeout: 6000 })
  await searchInput.fill(query)
  await page.waitForTimeout(700)

  const firstResult = page.locator('ul.absolute li').first()
  await firstResult.waitFor({ state: 'visible', timeout: 5000 })
  await firstResult.click()
  await page.waitForTimeout(800)
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

async function resizeContainerNodeLocator(
  page: Page,
  node: Locator,
  targetWidth: number,
  targetHeight: number,
) {
  await node.click({ force: true })
  await page.waitForTimeout(300)

  const bbox = await node.boundingBox()
  if (!bbox) {
    throw new Error('Container was not visible for resize')
  }

  const bottomRightHandle = node
    .locator('.react-flow__resize-control.handle.bottom.right')
    .first()
  const handleBox = await bottomRightHandle.boundingBox({ timeout: 5000 })
  if (!handleBox) {
    throw new Error('Bottom-right resize handle was not visible')
  }

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
  await page.waitForTimeout(100)
  await page.mouse.down()
  await page.mouse.move(
    handleBox.x + handleBox.width / 2 + targetWidth - bbox.width,
    handleBox.y + handleBox.height / 2 + targetHeight - bbox.height,
    { steps: 18 },
  )
  await page.waitForTimeout(150)
  await page.mouse.up()
  await page.waitForTimeout(600)
}

async function assertNodesInsideContainer(
  container: Locator,
  innerNodes: Array<{ locator: Locator; name: string }>,
) {
  const containerBox = await container.boundingBox()
  if (!containerBox) {
    throw new Error('Container was not visible for inside-container validation')
  }

  const margin = 8
  for (const { locator, name } of innerNodes) {
    const nodeBox = await locator.boundingBox()
    if (!nodeBox) {
      throw new Error(`${name} was not visible for inside-container validation`)
    }

    const isInside =
      nodeBox.x >= containerBox.x + margin &&
      nodeBox.y >= containerBox.y + margin &&
      nodeBox.x + nodeBox.width <= containerBox.x + containerBox.width - margin &&
      nodeBox.y + nodeBox.height <= containerBox.y + containerBox.height - margin

    if (!isInside) {
      throw new Error(`${name} is not fully inside the VPC container`)
    }
  }
}

async function connectHandleToHandle(
  page: Page,
  sourceHandle: Locator,
  targetHandle: Locator,
) {
  const sourceBox = await sourceHandle.boundingBox({ timeout: 5000 })
  const targetBox = await targetHandle.boundingBox({ timeout: 5000 })

  if (!sourceBox || !targetBox) {
    throw new Error('Could not find handles to connect nodes')
  }

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
  await page.waitForTimeout(200)
  await page.mouse.down()
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 20 })
  await page.waitForTimeout(200)
  await page.mouse.up()
  await page.waitForTimeout(700)
}

async function clearCanvasSelection(page: Page) {
  await page.keyboard.press('Escape')
  await page.mouse.click(420, 920)
  await page.waitForTimeout(250)
}

async function createSimpleEc2ToRdsEdge(page: Page) {
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  await addNodeBySidebarClick(page, 8) // EC2
  await page.waitForTimeout(400)
  const nodes = page.locator('.react-flow__node')
  await positionNodeLocatorAt(page, nodes.nth(0), 720, 480)

  await page.mouse.click(960, 220)
  await page.waitForTimeout(200)

  await addNodeBySidebarClick(page, 12) // RDS
  await page.waitForTimeout(400)
  await positionNodeLocatorAt(page, nodes.nth(1), 1180, 480)

  await page.mouse.click(960, 220)
  await page.waitForTimeout(200)

  const ec2Node = nodes.nth(0)
  const rdsNode = nodes.nth(1)
  const ec2Box = await ec2Node.boundingBox()
  const rdsBox = await rdsNode.boundingBox()
  if (!ec2Box || !rdsBox) {
    throw new Error('Could not position EC2 and RDS nodes for edge inspector screenshots')
  }

  const sourceX = ec2Box.x + ec2Box.width
  const sourceY = ec2Box.y + ec2Box.height / 2
  const targetX = rdsBox.x
  const targetY = rdsBox.y + rdsBox.height / 2

  await page.mouse.move(ec2Box.x + ec2Box.width / 2, ec2Box.y + ec2Box.height / 2)
  await page.waitForTimeout(300)
  await page.mouse.move(sourceX, sourceY)
  await page.waitForTimeout(300)
  await page.mouse.down()
  await page.mouse.move(targetX, targetY, { steps: 30 })
  await page.waitForTimeout(200)
  await page.mouse.up()
  await page.waitForTimeout(800)

  await page.waitForFunction(
    () => document.querySelectorAll('.react-flow__edge-path').length > 0,
    undefined,
    { timeout: 5000 },
  )
}

async function selectFirstEdge(page: Page) {
  const edgePath = page.locator('.react-flow__edge-path').first()
  const edgeBox = await edgePath.boundingBox({ timeout: 5000 })
  if (!edgeBox) {
    throw new Error('Could not find edge path for edge inspector screenshots')
  }

  const clickX = edgeBox.x + edgeBox.width / 2
  const clickY = edgeBox.y + edgeBox.height / 2
  await addClickIndicator(page, clickX, clickY)
  await addMouseCursor(page, clickX - 8, clickY - 8)
  await page.waitForTimeout(250)
  await shot(page, 'edge-inspector', 'click-edge.png')
  await removeClickIndicator(page)
  await removeMouseCursor(page)

  await page.mouse.click(clickX, clickY)
  await page.waitForTimeout(600)
  await page.getByText('Estilo de línea').waitFor({ state: 'visible', timeout: 5000 })
  await shot(page, 'edge-inspector', 'inspector-open.png')
}

function getLineStyleSection(page: Page) {
  return page
    .getByText('Estilo de línea', { exact: true })
    .locator('xpath=ancestor::div[contains(@class, "grid")][1]')
}

async function captureEdgeInspectorScreenshots(page: Page) {
  await createSimpleEc2ToRdsEdge(page)
  await selectFirstEdge(page)

  const lineStyleSection = getLineStyleSection(page)
  await lineStyleSection.waitFor({ state: 'visible', timeout: 5000 })
  await shotLocator(lineStyleSection, 'edge-inspector', 'line-solid.png')

  await page.getByRole('button', { name: 'Línea punteada' }).click()
  await page.waitForTimeout(300)
  await shotLocator(lineStyleSection, 'edge-inspector', 'line-dashed.png')

  await page.getByRole('button', { name: 'Activar animación' }).click()
  await page.waitForTimeout(300)
  await shotLocator(lineStyleSection, 'edge-inspector', 'line-animated.png')
}

async function validateTutorialImages(page: Page, tutorialUrl: string) {
  await page.goto(tutorialUrl, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2000)
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight)
  })
  await page.waitForTimeout(1000)

  return page.evaluate(() => {
    const images = document.querySelectorAll('img')
    return Array.from(images)
      .filter(img => img.naturalWidth === 0 || img.complete === false || img.src.includes('undefined'))
      .map(img => ({
        src: img.src,
        alt: img.alt,
        naturalWidth: img.naturalWidth,
        complete: img.complete,
      }))
  })
}

function getNodeClickPoint(bbox: { x: number; y: number; width: number; height: number }) {
  return {
    x: bbox.x + bbox.width * 0.72,
    y: bbox.y + bbox.height * 0.72,
  }
}

function getNearTargetPoint(sourceX: number, sourceY: number, targetX: number, targetY: number) {
  return {
    x: sourceX + (targetX - sourceX) * 0.82,
    y: sourceY + (targetY - sourceY) * 0.82,
  }
}

async function main() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: VIEWPORT, locale: 'es-ES' })
  const page = await context.newPage()

  page.on('dialog', d => d.dismiss())

  if (process.env.SCREENSHOT_ONLY === 'edge-inspector') {
    console.log('Capturing edge-inspector screenshots...\n')
    await captureEdgeInspectorScreenshots(page)

    const tutorialPage = await context.newPage()
    const brokenImages = await validateTutorialImages(
      tutorialPage,
      `${BASE_URL}/docs/edge-inspector`,
    )
    await tutorialPage.close()
    await browser.close()

    if (brokenImages.length > 0) {
      console.error('\n❌ edge-inspector has broken image references:')
      brokenImages.forEach(img => {
        console.error(`  - ${img.src}`)
        console.error(`    alt: "${img.alt}" | width: ${img.naturalWidth} | complete: ${img.complete}`)
      })
      process.exit(1)
    }

    console.log('\n✅ edge-inspector screenshots saved and validated successfully')
    return
  }

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
  await page.mouse.move(1200, 500)
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
    await addClickIndicator(page, srcX, srcY)
    await addMouseCursor(page, srcX - 8, srcY - 8)
    await page.waitForTimeout(300)
    await shot(page, 'connect-nodes', 'handle.png')
    await removeClickIndicator(page)
    await removeMouseCursor(page)

    // Drag to create edge
    await page.mouse.down()
    const nearTarget = getNearTargetPoint(srcX, srcY, tgtX, tgtY)
    await page.mouse.move(nearTarget.x, nearTarget.y, { steps: 30 })
    await page.waitForTimeout(300)
    await addMouseCursor(page, nearTarget.x - 8, nearTarget.y - 8)
    await page.waitForTimeout(300)
    await shot(page, 'connect-nodes', 'dragging.png')
    await removeMouseCursor(page)

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

  const vpcTool = page.locator('aside button[draggable="true"]').nth(6)
  const vpcToolBox = await vpcTool.boundingBox()
  if (vpcToolBox) {
    const vpcToolX = vpcToolBox.x + vpcToolBox.width / 2
    const vpcToolY = vpcToolBox.y + vpcToolBox.height / 2
    await addClickIndicator(page, vpcToolX, vpcToolY)
    await addMouseCursor(page, vpcToolX - 8, vpcToolY - 8)
    await page.waitForTimeout(300)
    await shot(page, 'region-vpc', 'vpc-tool.png')
    await removeClickIndicator(page)
    await removeMouseCursor(page)
  }

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
  await shot(page, 'subnet-type', 'public.png')

  // 2. Open dropdown
  const typeSelect = page.locator('select, [role="combobox"]').nth(0)
  if (await typeSelect.count() > 0) {
    await typeSelect.click()
    await page.waitForTimeout(400)
    const privateOption = page.locator('[role="option"]').filter({ hasText: /privada/i }).first()
    const privateOptionBox = await privateOption.boundingBox()
    if (privateOptionBox) {
      const privateOptionX = privateOptionBox.x + privateOptionBox.width * 0.72
      const privateOptionY = privateOptionBox.y + privateOptionBox.height / 2
      await privateOption.hover()
      await addClickIndicator(page, privateOptionX, privateOptionY)
      await addMouseCursor(page, privateOptionX - 8, privateOptionY - 8)
      await page.waitForTimeout(300)
    }
    // Capture with dropdown open
    await shot(page, 'subnet-type', 'dropdown-open.png')
    await removeClickIndicator(page)
    await removeMouseCursor(page)

    // 3. Select "Privada"
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

  // 4. Private selected
  await shot(page, 'subnet-type', 'private.png')

  // ── az-sync: Sync OFF → ON (2 steps) ───────────────────────────────
  console.log('7/11 AZ sync...')
  try {
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

  const firstAzNode = page
    .locator('.react-flow__node')
    .filter({ hasText: /az|availability/i })
    .first()
  const firstAzBox = await firstAzNode.boundingBox()

  if (firstAzBox) {
    const targetY = firstAzBox.y + firstAzBox.height / 2
    const ec2TargetX = firstAzBox.x + firstAzBox.width * 0.35
    const ec2NodeSync = page.locator('.react-flow__node').filter({ hasText: /ec2/i }).first()

    await positionNodeLocatorAt(page, ec2NodeSync, ec2TargetX, targetY)
  }

  await addNodeBySidebarClick(page, 12) // RDS
  await page.waitForTimeout(400)

  if (firstAzBox) {
    const targetY = firstAzBox.y + firstAzBox.height / 2
    const rdsTargetX = firstAzBox.x + firstAzBox.width * 0.72
    const rdsNodeSync = page.locator('.react-flow__node').filter({ hasText: /rds/i }).first()

    await positionNodeLocatorAt(page, rdsNodeSync, rdsTargetX, targetY)
  }

  if (firstAzBox) {
    await page.mouse.click(firstAzBox.x + 44, firstAzBox.y + 18)
    await page.waitForTimeout(600)
  }

  await page.getByText('Sincronizar AZs').waitFor({ state: 'visible', timeout: 5000 })
  const syncCheckbox = page
    .locator('label')
    .filter({ hasText: /Sincronizar AZs/i })
    .locator('input[type="checkbox"]')
    .first()
  const syncCheckboxBox = await syncCheckbox.boundingBox()

  if (syncCheckboxBox) {
    const syncCheckboxX = syncCheckboxBox.x + syncCheckboxBox.width / 2
    const syncCheckboxY = syncCheckboxBox.y + syncCheckboxBox.height / 2
    await addClickIndicator(page, syncCheckboxX, syncCheckboxY)
    await addMouseCursor(page, syncCheckboxX - 8, syncCheckboxY - 8)
    await page.waitForTimeout(300)
  }

  await shot(page, 'az-sync', 'off.png')
  await removeClickIndicator(page)
  await removeMouseCursor(page)

  await syncCheckbox.check()
  await page.waitForTimeout(1000)

  const syncedReplicas = page.locator('.react-flow__node').filter({ hasText: /rds/i })
  if (await syncedReplicas.count() < 2) {
    await syncCheckbox.check()
    await page.waitForTimeout(1000)
  }

  await shot(page, 'az-sync', 'on.png')
  } catch {
    console.log('  ⚠ az-sync step failed, skipping')
  }

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
  await clearCanvasSelection(page)
  await page.waitForTimeout(300)

  // Before: first node selected, with click indicator on the next node to add.
  const shiftClickNodes = page.locator('.react-flow__node')
  await shiftClickNodes.nth(0).click({ force: true })
  await page.waitForTimeout(300)

  const n1Box = await shiftClickNodes.nth(1).boundingBox()
  if (n1Box) {
    const { x: n1X, y: n1Y } = getNodeClickPoint(n1Box)
    await addClickIndicator(page, n1X, n1Y)
    await addMouseCursor(page, n1X - 8, n1Y - 8)
    await page.waitForTimeout(300)
    await shot(page, 'shift-click', 'before.png')
    await removeClickIndicator(page)
    await removeMouseCursor(page)
  }

  // Shift+click to add second node to selection.
  if (n1Box) {
    const { x: n1X, y: n1Y } = getNodeClickPoint(n1Box)
    await addClickIndicator(page, n1X, n1Y)
    await addMouseCursor(page, n1X - 8, n1Y - 8)
    await page.waitForTimeout(300)
  }
  await shiftClickNodes.nth(1).click({ modifiers: ['Shift'], force: true })
  await page.waitForTimeout(300)

  await removeClickIndicator(page)
  await removeMouseCursor(page)
  // After: show the gradual result, with only one more node added.
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
  await clearCanvasSelection(page)
  await page.waitForTimeout(400)

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
    // Before: idle canvas with the click point that starts the selection box.
    await addClickIndicator(page, startX, startY)
    await addMouseCursor(page, startX - 8, startY - 8)
    await page.waitForTimeout(300)
    await shot(page, 'shift-drag', 'start.png')

    await page.keyboard.down('Shift')
    await page.mouse.move(startX, startY)
    await page.waitForTimeout(200)
    await page.mouse.down()
    await page.waitForTimeout(150)

    // During drag: show selection box with cursor
    await page.mouse.move(endX, endY, { steps: 15 })
    await removeClickIndicator(page)
    await addClickIndicator(page, endX, endY)
    await removeMouseCursor(page)
    await addMouseCursor(page, endX - 8, endY - 8)
    await page.waitForTimeout(300)
    await shot(page, 'shift-drag', 'box.png')
    await removeClickIndicator(page)
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
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  for (let i = 0; i < 3; i++) {
    await addNodeBySidebarClick(page, [8, 10, 12][i])
    await page.waitForTimeout(300)
    await positionNodeInColumn(page, i, i)
  }
  await clearCanvasSelection(page)

  const selNodes = page.locator('.react-flow__node')
  const total = await selNodes.count()

  if (total >= 3) {
    // Build an existing selection, leaving the target node unselected.
    await selNodes.nth(0).click({ force: true })
    await page.waitForTimeout(300)
    await selNodes.nth(1).click({ modifiers: ['Shift'], force: true })
    await page.waitForTimeout(300)

    // Before: existing selection plus unselected target node.
    const n2Box = await selNodes.nth(2).boundingBox()
    if (n2Box) {
      const { x: n2X, y: n2Y } = getNodeClickPoint(n2Box)
      await addClickIndicator(page, n2X, n2Y)
      await addMouseCursor(page, n2X - 8, n2Y - 8)
      await page.waitForTimeout(300)
      await shot(page, 'add-to-selection', 'before.png')
      await removeClickIndicator(page)
      await removeMouseCursor(page)
    }

    // Add target node to the existing selection.
    if (n2Box) {
      const { x: n2X, y: n2Y } = getNodeClickPoint(n2Box)
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
  console.log('11/12 Alignment toolbar...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // Add 3 separated, intentionally misaligned nodes.
  const alignPositions = [
    { x: 600, y: 260 },
    { x: 1000, y: 370 },
    { x: 1400, y: 300 },
  ]
  for (let i = 0; i < alignPositions.length; i++) {
    await addNodeBySidebarClick(page, [8, 10, 12][i])
    await page.waitForTimeout(300)
    await positionNodeAt(page, i, alignPositions[i].x, alignPositions[i].y)
  }
  await clearCanvasSelection(page)
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
  await page.locator('[data-testid="align-horizontal"]').waitFor({ state: 'visible', timeout: 5000 })
  await shot(page, 'alignment', 'before.png')

  await page.locator('[data-testid="align-horizontal"]').click()
  await page.waitForTimeout(600)
  await page.locator('[data-testid="align-horizontal"]').waitFor({ state: 'visible', timeout: 5000 })
  await shot(page, 'alignment', 'after.png')

  // ── multiple-edges: Selection → RDS ────────────────────────────────
  console.log('12/12 Multiple edges from selection...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  const lambdaPositions = [
    { x: 700, y: 260 },
    { x: 700, y: 430 },
    { x: 700, y: 600 },
  ]

  for (let i = 0; i < lambdaPositions.length; i++) {
    await addNodeBySidebarClick(page, 10) // Lambda
    await page.waitForTimeout(300)
    await positionNodeAt(page, i, lambdaPositions[i].x, lambdaPositions[i].y)
  }

  await addNodeBySidebarClick(page, 12) // RDS
  await page.waitForTimeout(300)
  await positionNodeAt(page, 3, 1200, 430)
  await clearCanvasSelection(page)
  await page.waitForTimeout(300)

  const lambdaNodes = page.locator('.react-flow__node').filter({ hasText: /lambda/i })
  const multiEdgeRdsNode = page.locator('.react-flow__node').filter({ hasText: /rds/i }).first()
  for (let i = 0; i < 3; i++) {
    await lambdaNodes.nth(i).click({
      modifiers: i === 0 ? [] : ['Shift'],
      force: true,
    })
    await page.waitForTimeout(250)
  }
  await page.waitForTimeout(300)
  await shot(page, 'multiple-edges', 'selected-before.png')

  const sourceBox = await lambdaNodes.nth(1).boundingBox()
  const targetBox = await multiEdgeRdsNode.boundingBox()
  if (sourceBox && targetBox) {
    const sourceX = sourceBox.x + sourceBox.width
    const sourceY = sourceBox.y + sourceBox.height / 2
    const targetX = targetBox.x
    const targetY = targetBox.y + targetBox.height / 2

    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceY)
    await page.waitForTimeout(300)
    await page.mouse.move(sourceX, sourceY)
    await page.waitForTimeout(300)
    await addClickIndicator(page, sourceX, sourceY)
    await addMouseCursor(page, sourceX - 8, sourceY - 8)
    await page.waitForTimeout(300)
    await shot(page, 'multiple-edges', 'handle.png')

    await page.mouse.down()
    const nearTarget = getNearTargetPoint(sourceX, sourceY, targetX, targetY)
    await page.mouse.move(nearTarget.x, nearTarget.y, { steps: 20 })
    await page.waitForTimeout(300)
    await removeClickIndicator(page)
    await removeMouseCursor(page)
    await addMouseCursor(page, nearTarget.x - 8, nearTarget.y - 8)
    await page.waitForTimeout(300)
    await shot(page, 'multiple-edges', 'dragging.png')

    await page.mouse.move(targetX, targetY, { steps: 20 })
    await page.waitForTimeout(300)
    await page.mouse.up()
    await page.waitForTimeout(800)
    await removeMouseCursor(page)
  }

  await page.locator('.react-flow__edge').nth(2).waitFor({ state: 'visible', timeout: 5000 })
  await shot(page, 'multiple-edges', 'selected-to-rds.png')

  // ── api-gateway: routes (4 shots) ──────────────────────────────────
  console.log('13/15 API Gateway routes...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  // Click canvas to ensure keyboard focus before shortcut
  await page.click('.react-flow__pane')
  await page.waitForTimeout(300)

  // Open search and add API Gateway
  await page.keyboard.press('Meta+k')
  await page.waitForTimeout(600)
  const agSearchInput = page.locator('input[placeholder*="uscar"]').first()
  await agSearchInput.waitFor({ state: 'visible', timeout: 5000 })
  await agSearchInput.fill('api')
  await page.waitForTimeout(700)
  // Navigate to first result and add it
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(200)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1000)

  // Find the API Gateway node by text
  const agNode = page.locator('.react-flow__node').filter({ hasText: /api gateway/i }).first()
  await agNode.waitFor({ state: 'visible', timeout: 10000 })
  await positionNodeLocatorAt(page, agNode, 750, 420)

  // Click empty canvas to deselect
  await page.mouse.click(300, 180)
  await page.waitForTimeout(300)

  // Click node to open inspector
  await agNode.click({ force: true })
  await page.waitForTimeout(800)

  // Shot 1: inspector with empty default routes (GET + POST)
  await page.mouse.move(1200, 700)
  await shot(page, 'api-gateway', 'inspector-empty.png')

  // Fill route 1: GET /users
  const pathInputs = page.locator('input[placeholder="/path"]')
  await pathInputs.first().waitFor({ state: 'visible', timeout: 5000 })
  await pathInputs.nth(0).fill('/users')
  await pathInputs.nth(0).dispatchEvent('input')
  await page.waitForTimeout(300)

  // Fill route 2: POST /orders (already POST by default)
  await pathInputs.nth(1).fill('/orders')
  await pathInputs.nth(1).dispatchEvent('input')
  await page.waitForTimeout(300)

  // Shot 2: inspector with routes filled
  await page.mouse.move(1200, 700)
  await shot(page, 'api-gateway', 'inspector-filled.png')

  // Deselect
  await page.mouse.click(300, 180)
  await page.waitForTimeout(400)
  await page.mouse.move(300, 180)

  // Shot 3: node card showing route rows
  await shot(page, 'api-gateway', 'node-with-routes.png')

  // Add Lambda 1 via search
  await page.keyboard.press('Meta+k')
  await page.waitForTimeout(500)
  const l1SearchInput = page.locator('input[placeholder*="uscar"]').first()
  if (await l1SearchInput.count() > 0) {
    await l1SearchInput.fill('lambda')
    await page.waitForTimeout(600)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(600)
  }
  const agLambda1 = page.locator('.react-flow__node').filter({ hasText: /lambda/i }).first()
  await agLambda1.waitFor({ state: 'visible', timeout: 5000 })
  await positionNodeLocatorAt(page, agLambda1, 1150, 330)

  // Add Lambda 2 via search
  await page.keyboard.press('Meta+k')
  await page.waitForTimeout(500)
  const l2SearchInput = page.locator('input[placeholder*="uscar"]').first()
  if (await l2SearchInput.count() > 0) {
    await l2SearchInput.fill('lambda')
    await page.waitForTimeout(600)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(600)
  }
  const agLambdaNodes = page.locator('.react-flow__node').filter({ hasText: /lambda/i })
  await agLambdaNodes.nth(1).waitFor({ state: 'visible', timeout: 5000 })
  await positionNodeLocatorAt(page, agLambdaNodes.nth(1), 1150, 540)

  await page.mouse.click(300, 180)
  await page.waitForTimeout(400)

  // Connect each route handle to a Lambda
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

  const l2Box = await agLambdaNodes.nth(1).boundingBox()
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

  // Shot 4: routes connected to Lambda nodes
  await shot(page, 'api-gateway', 'routes-connected.png')

  // ── vpn-gateway: Customer Gateway (3 shots) ─────────────────────────
  console.log('14/15 VPN Gateway...')
  await loadApp(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  await addNodeBySearch(page, 'VPN Gateway')
  const vpnGwNode = page.locator('.react-flow__node').filter({ hasText: /vpn gateway/i }).first()
  await vpnGwNode.waitFor({ state: 'visible', timeout: 8000 })

  await addNodeBySidebarClick(page, 3)
  const vpnVpcNode = page.locator('.react-flow__node').filter({ hasText: /^VPC$/i }).first()
  await vpnVpcNode.waitFor({ state: 'visible', timeout: 8000 })
  await positionNodeLocatorAt(page, vpnVpcNode, 930, 520)
  await resizeContainerNodeLocator(page, vpnVpcNode, 820, 500)

  const vpnVpcBox = await vpnVpcNode.boundingBox()
  if (!vpnVpcBox) {
    throw new Error('VPC node was not visible for VPN Gateway screenshots')
  }

  const vpnVpcLeft = vpnVpcBox.x
  const vpnVpcCenterY = vpnVpcBox.y + vpnVpcBox.height / 2
  await positionNodeLocatorAt(page, vpnGwNode, vpnVpcLeft - 42, vpnVpcCenterY)

  await addNodeBySearch(page, 'API Gateway')
  const vpnApiNode = page.locator('.react-flow__node').filter({ hasText: /api gateway/i }).first()
  await vpnApiNode.waitFor({ state: 'visible', timeout: 8000 })
  await positionNodeLocatorAt(page, vpnApiNode, vpnVpcBox.x + 300, vpnVpcBox.y + 250)

  await vpnApiNode.click({ force: true })
  await page.waitForTimeout(500)
  const vpnPathInputs = page.locator('input[placeholder="/path"]')
  await vpnPathInputs.first().waitFor({ state: 'visible', timeout: 5000 })
  await vpnPathInputs.nth(0).fill('/profile')
  await vpnPathInputs.nth(0).dispatchEvent('input')
  await page.waitForTimeout(200)
  await vpnPathInputs.nth(1).fill('/orders')
  await vpnPathInputs.nth(1).dispatchEvent('input')
  await page.waitForTimeout(200)

  await page.mouse.click(360, 180)
  await page.waitForTimeout(300)

  await addNodeBySearch(page, 'Lambda')
  const vpnLambda1 = page.locator('.react-flow__node').filter({ hasText: /lambda/i }).first()
  await vpnLambda1.waitFor({ state: 'visible', timeout: 8000 })
  await positionNodeLocatorAt(page, vpnLambda1, vpnVpcBox.x + 555, vpnVpcBox.y + 190)

  await addNodeBySearch(page, 'Lambda')
  const vpnLambdas = page.locator('.react-flow__node').filter({ hasText: /lambda/i })
  await vpnLambdas.nth(1).waitFor({ state: 'visible', timeout: 8000 })
  await positionNodeLocatorAt(page, vpnLambdas.nth(1), vpnVpcBox.x + 555, vpnVpcBox.y + 330)

  await page.mouse.click(360, 180)
  await page.waitForTimeout(300)

  const vpnRouteHandles = page.locator('.react-flow__handle[data-handleid^="route-"]')
  const vpnRh1Box = await vpnRouteHandles.nth(0).boundingBox({ timeout: 5000 }).catch(() => null)
  const vpnL1Box = await vpnLambda1.boundingBox()
  if (vpnRh1Box && vpnL1Box) {
    await page.mouse.move(vpnRh1Box.x + vpnRh1Box.width / 2, vpnRh1Box.y + vpnRh1Box.height / 2)
    await page.waitForTimeout(200)
    await page.mouse.down()
    await page.mouse.move(vpnL1Box.x, vpnL1Box.y + vpnL1Box.height / 2, { steps: 20 })
    await page.waitForTimeout(200)
    await page.mouse.up()
    await page.waitForTimeout(600)
  }

  const vpnRh2Box = await vpnRouteHandles.nth(1).boundingBox({ timeout: 5000 }).catch(() => null)
  const vpnL2Box = await vpnLambdas.nth(1).boundingBox()
  if (vpnRh2Box && vpnL2Box) {
    await page.mouse.move(vpnRh2Box.x + vpnRh2Box.width / 2, vpnRh2Box.y + vpnRh2Box.height / 2)
    await page.waitForTimeout(200)
    await page.mouse.down()
    await page.mouse.move(vpnL2Box.x, vpnL2Box.y + vpnL2Box.height / 2, { steps: 20 })
    await page.waitForTimeout(200)
    await page.mouse.up()
    await page.waitForTimeout(600)
  }

  await connectHandleToHandle(
    page,
    vpnGwNode.locator('.react-flow__handle').nth(1),
    vpnApiNode.locator('.react-flow__handle').first(),
  )

  await assertNodesInsideContainer(vpnVpcNode, [
    { locator: vpnApiNode, name: 'API Gateway' },
    { locator: vpnLambda1, name: 'Lambda 1' },
    { locator: vpnLambdas.nth(1), name: 'Lambda 2' },
  ])

  await addNodeBySearch(page, 'Mobile')
  const mobileVpnNode = page.locator('.react-flow__node').filter({ hasText: /^Mobile$/i }).first()
  await mobileVpnNode.waitFor({ state: 'visible', timeout: 8000 })
  await positionNodeLocatorAt(page, mobileVpnNode, vpnVpcBox.x - 285, vpnVpcCenterY)

  await page.mouse.click(960, 180)
  await page.waitForTimeout(400)
  await page.mouse.move(960, 180)

  // Shot 1: both nodes disconnected
  await shot(page, 'vpn-gateway', 'before-connect.png')

  const mobileVpnBox = await mobileVpnNode.boundingBox()
  const vpnGwBox = await vpnGwNode.boundingBox()
  const mobileVpnRightHandleBox = await mobileVpnNode.locator('.react-flow__handle').nth(1).boundingBox({ timeout: 5000 }).catch(() => null)
  const vpnGwLeftHandleBox = await vpnGwNode.locator('.react-flow__handle').first().boundingBox({ timeout: 5000 }).catch(() => null)

  if (mobileVpnBox && vpnGwBox && mobileVpnRightHandleBox && vpnGwLeftHandleBox) {
    const srcX = mobileVpnRightHandleBox.x + mobileVpnRightHandleBox.width / 2
    const srcY = mobileVpnRightHandleBox.y + mobileVpnRightHandleBox.height / 2
    const tgtX = vpnGwLeftHandleBox.x + vpnGwLeftHandleBox.width / 2
    const tgtY = vpnGwLeftHandleBox.y + vpnGwLeftHandleBox.height / 2

    // Hover over Mobile to reveal handle
    await page.mouse.move(mobileVpnBox.x + mobileVpnBox.width / 2, srcY)
    await page.waitForTimeout(300)
    await page.mouse.move(srcX, srcY)
    await page.waitForTimeout(300)

    await page.mouse.down()
    const nearTarget = getNearTargetPoint(srcX, srcY, tgtX, tgtY)
    await page.mouse.move(nearTarget.x, nearTarget.y, { steps: 25 })
    await page.waitForTimeout(300)
    await addMouseCursor(page, nearTarget.x - 8, nearTarget.y - 8)
    await page.waitForTimeout(300)

    // Shot 2: edge in progress toward VPN Gateway
    await shot(page, 'vpn-gateway', 'connecting.png')
    await removeMouseCursor(page)

    await page.mouse.move(tgtX, tgtY, { steps: 15 })
    await page.waitForTimeout(300)
    await page.mouse.up()
    await page.waitForTimeout(800)
  }

  await page.mouse.click(960, 180)
  await page.waitForTimeout(400)
  await page.mouse.move(960, 180)

  // Shot 3: Customer Gateway icon on Mobile's handle
  await shot(page, 'vpn-gateway', 'customer-gateway.png')

  // ── edge-inspector: click edge + line style options ────────────────
  console.log('15/16 Edge inspector...')
  await captureEdgeInspectorScreenshots(page)

  // ── Validate all images are working ────────────────────────────────
  console.log('\n16/16 Validating all screenshot references...')

  // Wait for file system to sync before validation
  await page.waitForTimeout(2000)

  const tutorialUrls = [
    `${BASE_URL}/docs/getting-started`,
    `${BASE_URL}/docs/hierarchical-containers`,
    `${BASE_URL}/docs/selection`,
    `${BASE_URL}/docs/special-nodes`,
    `${BASE_URL}/docs/edge-inspector`,
  ]

  let allImagesValid = true

  for (const tutorialUrl of tutorialUrls) {
    const tutorialPage = await context.newPage()
    try {
      await tutorialPage.goto(tutorialUrl, { waitUntil: 'networkidle', timeout: 30000 })
      const brokenImages = await validateTutorialImages(tutorialPage, tutorialUrl)

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
  console.log('  az-sync/, shift-click/, shift-drag/, add-to-selection/, alignment/, multiple-edges/')
  console.log('  api-gateway/, vpn-gateway/, edge-inspector/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
