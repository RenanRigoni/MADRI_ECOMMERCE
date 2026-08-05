import { expect, test } from '@playwright/test'

test('catalog stays empty (not broken) when Supabase is unconfigured', async ({ page }) => {
  await page.goto('/produtos')
  await expect(page.getByText('Nenhum produto encontrado para este filtro.')).toBeVisible()
  await expect(page.getByRole('link', { name: /carrinho de compras/i })).toContainText('0')
})

test('empty cart and checkout are usable without Mercado Pago credentials', async ({ page }) => {
  await page.goto('/carrinho')
  await expect(page.getByRole('heading', { name: 'Seu carrinho' })).toBeVisible()
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()

  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible()
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
})

test('quote endpoint rejects cross-origin requests', async ({ request }) => {
  const response = await request.post('/api/checkout/quote', {
    headers: { Origin: 'https://attacker.invalid' },
    data: { items: [], customer: {} },
  })
  expect(response.status()).toBe(403)
  const body = await response.text()
  expect(body).not.toMatch(/SUPABASE|SERVICE_ROLE|MERCADO_PAGO_ACCESS_TOKEN/i)
})

test('missing server configuration fails closed without naming secrets', async ({ request }) => {
  const response = await request.post('/api/checkout/quote', {
    headers: { Origin: 'http://127.0.0.1:3100' },
    data: {
      items: [{ productId: 'product-1', quantity: 1 }],
      customer: {
        name: 'Cliente Teste', email: 'test@example.com', phone: '11999999999',
        address: { postalCode: '01001000', street: 'Rua A', number: '1', complement: '', neighborhood: 'Centro', city: 'São Paulo', state: 'SP' },
      },
    },
  })
  expect(response.status()).toBe(503)
  expect(await response.text()).not.toMatch(/SUPABASE|SERVICE_ROLE|MERCADO_PAGO_ACCESS_TOKEN/i)
})

test('admin panel fails closed without exposing secrets when Supabase is unconfigured', async ({ request }) => {
  const response = await request.get('/admin/produtos', { maxRedirects: 0 })
  expect([401, 403, 503]).toContain(response.status())
  expect(await response.text()).not.toMatch(/SUPABASE|SERVICE_ROLE/i)
})
