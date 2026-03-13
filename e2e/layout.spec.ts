import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text())
    }
  })

  await page.goto("/")
  await page.waitForLoadState("networkidle")

  expect(errors).toEqual([])
})

test("desktop shell keeps all three panes readable", async ({ page }) => {
  const left = page.getByTestId("left-pane")
  const center = page.getByTestId("center-pane")
  const right = page.getByTestId("right-pane")

  const [leftBox, centerBox, rightBox] = await Promise.all([
    left.boundingBox(),
    center.boundingBox(),
    right.boundingBox(),
  ])

  expect(leftBox?.width ?? 0).toBeGreaterThanOrEqual(340)
  expect(centerBox?.width ?? 0).toBeGreaterThanOrEqual(680)
  expect(rightBox?.width ?? 0).toBeGreaterThanOrEqual(360)
})

test("dragging the probe updates coordinates", async ({ page }) => {
  const field = page.getByTestId("inspiration-field")
  const coords = page.getByTestId("blend-coordinates")
  const box = await field.boundingBox()
  if (!box) throw new Error("field not visible")

  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.78, {
    steps: 24,
  })
  await page.mouse.up()

  await expect(coords).not.toHaveText("0.52 × 0.44")
})

test("dragging a source chip repositions it inside the field", async ({ page }) => {
  const chip = page.getByTestId(/field-node-/).first()
  const before = await chip.boundingBox()
  if (!before) throw new Error("chip not visible")

  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
  await page.mouse.down()
  await page.mouse.move(before.x + 120, before.y + 90, { steps: 18 })
  await page.mouse.up()

  const after = await chip.boundingBox()
  if (!after) throw new Error("chip missing after drag")

  expect(Math.abs(after.x - before.x)).toBeGreaterThan(18)
  expect(Math.abs(after.y - before.y)).toBeGreaterThan(18)
})

test("clicking an active source updates the inspector", async ({ page }) => {
  await page.getByTestId("active-target-2").getByRole("button").nth(1).click()
  await expect(page.getByTestId("right-pane")).toContainText("Selected source")
  await expect(page.getByTestId("right-pane")).toContainText(/Warm Night|Graphite Review|.+/)
})

test("source corpus dialog filters by category", async ({ page }) => {
  await page.getByRole("button", { name: "Sources" }).click()
  await page.getByTestId("source-corpus").waitFor()
  await page.getByRole("tab", { name: "Editorial" }).click()
  await expect(page.getByTestId("source-corpus")).toContainText("editorial")
})

test("center horizontal handle changes how much navigator vs specimen is visible", async ({ page }) => {
  const handle = page.getByTestId("center-resize-handle")
  const navigator = page.getByText("Navigator").locator("..").locator("..")
  const specimen = page.getByTestId("preview-surface")

  const navBefore = await navigator.boundingBox()
  const specBefore = await specimen.boundingBox()
  const handleBox = await handle.boundingBox()
  if (!navBefore || !specBefore || !handleBox) throw new Error("missing center layout elements")

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + 90, { steps: 8 })
  await page.mouse.up()

  const navAfter = await navigator.boundingBox()
  const specAfter = await specimen.boundingBox()
  if (!navAfter || !specAfter) throw new Error("missing layout after resize")

  expect(navAfter.height).toBeLessThan(navBefore.height)
  expect(specAfter.height).toBeGreaterThan(specBefore.height)
})
