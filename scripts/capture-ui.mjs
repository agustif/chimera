import { mkdir } from "node:fs/promises"
import path from "node:path"
import { chromium } from "playwright"

const baseUrl = process.env.CAPTURE_URL ?? "http://127.0.0.1:5197"
const outputDir = path.resolve(process.cwd(), "output/playwright")

await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })

await page.goto(baseUrl, { waitUntil: "networkidle" })

const save = async (name, locator) => {
  const filePath = path.join(outputDir, name)
  await locator.screenshot({ path: filePath })
  return filePath
}

const shell = page.locator("body")
const leftPane = page.getByTestId("left-pane")
const centerPane = page.getByTestId("center-pane")
const rightPane = page.getByTestId("right-pane")
const preview = page.getByTestId("preview-surface")
const activeSources = page.getByTestId("active-sources-list")

const outputs = []
outputs.push(await save("shell-full.png", shell))
outputs.push(await save("left-pane.png", leftPane))
outputs.push(await save("center-pane.png", centerPane))
outputs.push(await save("right-pane.png", rightPane))
outputs.push(await save("preview-surface.png", preview))
outputs.push(await save("active-sources.png", activeSources))

await page.getByRole("tab", { name: "Signals" }).click()
outputs.push(await save("right-pane-signals.png", rightPane))

await page.getByRole("tab", { name: "Saved" }).click()
outputs.push(await save("right-pane-saved.png", rightPane))

await page.getByRole("tab", { name: "Overview" }).click()

await page.getByRole("button", { name: "Sources" }).click()
await page.getByTestId("source-corpus").waitFor()
outputs.push(await save("sources-dialog.png", page.locator('[role="dialog"]')))
outputs.push(await save("source-corpus.png", page.getByTestId("source-corpus")))

console.log("Captured UI artifacts:")
for (const file of outputs) {
  console.log(file)
}

await browser.close()
