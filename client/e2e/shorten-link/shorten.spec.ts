import { expect, test, type Page, type Request } from '@playwright/test'

// Needs the real server on :5300 with the dev DB (design §8, DR-9).
const CODE = /^[2-9A-HJ-NP-Za-km-z]{7}$/
const API = '**/api/links'

function urlInput(page: Page) {
  return page.getByLabel('Long link')
}

function shortenButton(page: Page) {
  return page.getByRole('button', { name: 'Shorten' })
}

/** Snackbar text — the same message is also in the screen-reader announcer. */
function snackbar(page: Page) {
  return page.locator('.v-snackbar__content')
}

/** Inline field message under the URL input. */
function fieldMessage(page: Page) {
  return page.locator('.v-input .v-messages')
}

function result(page: Page) {
  return page.getByRole('region', { name: 'Your short link' })
}

async function shorten(page: Page, url: string): Promise<void> {
  await urlInput(page).fill(url)
  await shortenButton(page).click()
}

/** Counts POST /api/links requests made by the page. */
function countPosts(page: Page): () => number {
  let count = 0
  page.on('request', (req: Request) => {
    if (req.method() === 'POST' && req.url().endsWith('/api/links')) count++
  })
  return () => count
}

function urlOfLength(length: number): string {
  const base = 'https://example.com/'
  return base + 'a'.repeat(length - base.length)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test.describe('happy path', () => {
  test('shortens a link onto the ticket', async ({ page }) => {
    const original = 'https://example.com/blog/2026/11/how-we-ship?utm_source=x'
    await shorten(page, original)

    const ticket = result(page)
    await expect(ticket).toBeVisible()
    const code = (await ticket.getByTestId('ticket-code').textContent())?.trim() ?? ''
    expect(code).toMatch(CODE)
    await expect(ticket.getByTestId('ticket-short-url')).toHaveText(`localhost:5300/${code}`)
    await expect(ticket.getByTestId('ticket-original')).toHaveText(original)
    await expect(page.getByText('No sign-up, no account')).toBeHidden()
  })

  test('submits with Enter as well', async ({ page }) => {
    await urlInput(page).fill('http://example.com/enter')
    await urlInput(page).press('Enter')
    await expect(result(page)).toBeVisible()
  })

  test('accepts a non-ASCII host and trims whitespace', async ({ page }) => {
    await shorten(page, '  https://bücher.de/x \n')
    await expect(result(page).getByTestId('ticket-original')).toHaveText('https://bücher.de/x')
  })
})

test.describe('validation', () => {
  test('empty input shows an error and sends nothing', async ({ page }) => {
    const posts = countPosts(page)
    await shortenButton(page).click()

    await expect(fieldMessage(page)).toContainText('Paste a link to shorten.')
    await expect(urlInput(page)).toHaveAttribute('aria-invalid', 'true')
    expect(posts()).toBe(0)
  })

  for (const bad of ['example.com', 'ftp://x.com', 'http://localhost:8080', 'http://127.0.0.1']) {
    test(`rejects ${bad} on the client`, async ({ page }) => {
      const posts = countPosts(page)
      await shorten(page, bad)

      await expect(fieldMessage(page)).toContainText("That doesn't look like a web link.")
      expect(posts()).toBe(0)
    })
  }

  test('a server 400 shows under the field, not as a snackbar', async ({ page }) => {
    await page.route(API, (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ statusCode: 400, message: ['customAlias should not exist'], error: 'Bad Request' }),
      }),
    )
    await shorten(page, 'https://example.com/server-says-no')

    await expect(fieldMessage(page)).toContainText("That doesn't look like a web link.")
    await expect(snackbar(page)).toHaveCount(0)
  })
})

test.describe('boundary', () => {
  test('2048 characters is accepted, 2049 is refused without a request', async ({ page }) => {
    await shorten(page, urlOfLength(2048))
    await expect(result(page)).toBeVisible()

    const posts = countPosts(page)
    await shorten(page, urlOfLength(2049))
    await expect(fieldMessage(page)).toContainText("That doesn't look like a web link.")
    expect(posts()).toBe(0)
  })
})

test.describe('errors and loading', () => {
  test('network failure shows a snackbar and keeps the input', async ({ page }) => {
    await page.route(API, (route) => route.abort())
    await shorten(page, 'https://example.com/offline')

    await expect(snackbar(page)).toContainText("Couldn't reach the server.")
    await expect(urlInput(page)).toHaveValue('https://example.com/offline')
    await expect(shortenButton(page)).toBeEnabled()
  })

  test('a 500 is handled like a network failure', async ({ page }) => {
    await page.route(API, (route) => route.fulfill({ status: 500, body: '{}' }))
    await shorten(page, 'https://example.com/boom')
    await expect(snackbar(page)).toContainText("Couldn't reach the server.")
  })

  test('the button shows a loading state while waiting', async ({ page }) => {
    await page.route(API, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await route.continue()
    })
    await urlInput(page).fill('https://example.com/slow')
    await shortenButton(page).click()

    await expect(page.locator('form .v-btn--loading')).toBeVisible()
    await expect(result(page)).toBeVisible({ timeout: 5000 })
  })
})

test.describe('mutation safety', () => {
  test('double-click while pending sends one request', async ({ page }) => {
    const posts = countPosts(page)
    await page.route(API, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })
    await urlInput(page).fill('https://example.com/double')
    await shortenButton(page).dblclick()

    await expect(result(page)).toBeVisible()
    expect(posts()).toBe(1)
  })

  test('the same URL twice gives two different codes', async ({ page }) => {
    await shorten(page, 'https://example.com/same')
    const first = await result(page).getByTestId('ticket-code').textContent()
    await shorten(page, 'https://example.com/same')
    await expect(result(page).getByTestId('ticket-code')).not.toHaveText(first ?? '')
  })

  test('a failed submit keeps the previous ticket', async ({ page }) => {
    await shorten(page, 'https://example.com/keep')
    const code = await result(page).getByTestId('ticket-code').textContent()

    await shorten(page, 'not a link')
    await expect(fieldMessage(page)).toContainText("That doesn't look like a web link.")
    await expect(result(page).getByTestId('ticket-code')).toHaveText(code ?? '')
  })
})

test.describe('accessibility', () => {
  test('moves focus to the result and announces it', async ({ page }) => {
    await shorten(page, 'https://example.com/a11y')

    await expect(result(page)).toBeFocused()
    await expect(page.locator('#announcer')).toContainText('Short link created:')
    const code = (await result(page).getByTestId('ticket-code').textContent())?.trim() ?? ''
    await expect(page.getByRole('button', { name: `Copy short link ${code}` })).toBeVisible()
  })
})

test.describe('copy', () => {
  test('copies the full short URL', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await shorten(page, 'https://example.com/copy')
    const code = (await result(page).getByTestId('ticket-code').textContent())?.trim() ?? ''

    await result(page).getByRole('button', { name: /Copy short link/ }).click()

    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`http://localhost:5300/${code}`)
    await expect(result(page).getByRole('button', { name: /Copy short link/ })).toContainText('Copied')
    await expect(snackbar(page)).toContainText('Copied')
  })

  test('reports a blocked clipboard', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: () => Promise.reject(new Error('denied')) },
      })
    })
    await page.reload()
    await shorten(page, 'https://example.com/no-clipboard')
    await result(page).getByRole('button', { name: /Copy short link/ }).click()

    await expect(snackbar(page)).toContainText("Couldn't copy.")
  })
})

test.describe('i18n and rendering', () => {
  test('Vietnamese copy for errors, button and ticket', async ({ page }) => {
    await page.getByRole('button', { name: 'Tiếng Việt' }).click()
    await page.getByRole('button', { name: 'Rút gọn' }).click()
    await expect(fieldMessage(page)).toContainText('Hãy dán link cần rút gọn.')

    await page.getByLabel('Link dài').fill('https://example.com/vi')
    await page.getByRole('button', { name: 'Rút gọn' }).click()
    await expect(page.getByRole('region', { name: 'Link ngắn của bạn' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Sao chép link ngắn/ })).toContainText('Sao chép')
  })

  test('a long original URL does not overflow on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await shorten(page, urlOfLength(600))
    await expect(result(page)).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(overflow).toBeLessThanOrEqual(375)
  })
})
