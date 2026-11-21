import { expect, test } from '@playwright/test'

test.describe('App shell (F1)', () => {
  test('renders the English home with only shipped promises', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shorten a link')
    await expect(
      page.getByText('Paste a long link and get a short one. No account needed.'),
    ).toBeVisible()
    await expect(page.getByText('No sign-up, no account')).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/QR|custom ending/i)
    await expect(page).toHaveTitle('Shorten Link')
  })

  test('switches to Vietnamese and remembers it', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Tiếng Việt' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rút gọn link')
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
    await expect(page.locator('body')).not.toContainText(/QR|tự đặt đuôi/i)

    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rút gọn link')
    await expect(page.getByRole('button', { name: 'English' })).toBeVisible()
  })

  test('follows the system theme, then remembers the user choice', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await expect(page.locator('.v-application')).toHaveClass(/v-theme--dark/)

    await page.getByRole('button', { name: 'Switch to light theme' }).click()
    await expect(page.locator('.v-application')).toHaveClass(/v-theme--light/)

    await page.reload()
    await expect(page.locator('.v-application')).toHaveClass(/v-theme--light/)
  })

  test('still works when localStorage is blocked', async ({ page }) => {
    // Throws only for the app's own keys: the dev-only Vue DevTools plugin also
    // reads localStorage without a guard, and it never ships to production.
    await page.addInitScript(() => {
      const { getItem, setItem } = Storage.prototype
      const blocked = (key: string) => key.startsWith('shorten-link:')
      Storage.prototype.getItem = function (key: string) {
        if (blocked(key)) throw new DOMException('blocked', 'SecurityError')
        return getItem.call(this, key)
      }
      Storage.prototype.setItem = function (key: string, value: string) {
        if (blocked(key)) throw new DOMException('blocked', 'SecurityError')
        setItem.call(this, key, value)
      }
    })
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shorten a link')
    await page.getByRole('button', { name: 'Tiếng Việt' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rút gọn link')
  })

  test('offers a skip link to the main content', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')

    const skip = page.getByRole('link', { name: 'Skip to main content' })
    await expect(skip).toBeFocused()
    await expect(page.getByRole('main')).toHaveCount(1)
  })
})
