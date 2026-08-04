# MADRI Perfumes — E-commerce

## Visão Geral

E-commerce de venda de perfumes para a marca MADRI.
Domínio próprio já existente. Pagamento via Mercado Pago.

---

## Classificação

**Nível 2** — painel admin + integração de pagamento + banco + dados pessoais de compradores (LGPD).
Requer contrato de manutenção mensal.

---

## Stack

| Camada | Tecnologia | Motivo |
|---|---|---|
| Frontend + SSR | Next.js 14 (App Router) | SEO essencial para e-commerce |
| Banco + Auth + Storage | Supabase | PostgreSQL + auth admin + fotos de produto |
| Pagamento | Mercado Pago Checkout Pro | Redirect para MP; sem lidar com dados de cartão |
| Frete | Melhor Envio | Calcula Correios por CEP; mais simples que API direta |
| Hosting | Vercel | SSL automático, deploy contínuo, CDN |
| Estilo | Tailwind CSS | Responsivo por padrão |
| Fonte | Agatho | Já disponível em `../LANDING/assets/fonts/` |

---

## Paleta de Cores

```
Background principal:   #FFFFFF  — catálogo, produto
Background hero:        #FAF6F0  — creme off-white (luxo sem pesar)
Texto principal:        #0A0A0A
Acento gold:            #C4A55C  — fio condutor com a landing page
Botões CTA:             #1A1A1A  — preto elegante
Destaque Pix:           #2D6A4F  — verde escuro discreto
Badge OFF:              #B5363A  — vermelho discreto
```

---

## Decisões Confirmadas

| Decisão | Escolha |
|---|---|
| Frete | Correios nacional via Melhor Envio (sem frete grátis) |
| Conta de cliente | Visitante na v1; estrutura para login na v2 |
| Controle de estoque | Badge "Esgotado" visual; sem bloqueio rígido no checkout |
| Tema | Branco/clean — não dark (fotos sem fundo ficam melhor; menor fadiga visual) |
| Frete grátis | Não será oferecido |

---

## Escopo V1

### Obrigatório agora
- [ ] Homepage (hero, benefícios, produtos em destaque, novidades)
- [ ] Página de catálogo (listagem com filtro básico)
- [ ] Página de produto (fotos, descrição, preço, tamanho, botão comprar)
- [ ] Carrinho (localStorage)
- [ ] Checkout visitante (nome, e-mail, endereço)
- [ ] Cálculo de frete por CEP (Melhor Envio)
- [ ] Mercado Pago Checkout Pro (redirect + webhook)
- [ ] Página de confirmação de pedido
- [ ] Painel admin (CRUD produtos + listagem de pedidos)
- [ ] Mobile responsivo
- [ ] SEO básico (meta tags, OG, sitemap)
- [ ] Política de privacidade (LGPD)

### Para depois (v2)
- Login de cliente + histórico de pedidos
- Cupons de desconto
- Avaliações de produto
- Newsletter
- Busca de produto
- Dashboard de vendas com gráficos
- Notificação por e-mail automática

### Não recomendado
- App mobile nativo
- Assinaturas / recorrência
- Marketplace multi-vendedor
- Programa de pontos

---

## Estrutura de Pastas

```
ecommerce/
├── .env.local                        # secrets (NÃO versionar)
├── .env.example                      # nomes das variáveis (versionar)
├── .gitignore
├── next.config.js
├── tailwind.config.js
├── package.json
│
├── public/
│   ├── logos/                        # MADRI.svg, MADRI_HORIZONTAL.svg, MADRI_SUBMARK.svg
│   └── fonts/                        # Agatho (copiado de ../LANDING/assets/fonts/)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                # layout global (fonte, nav, footer)
│   │   ├── page.tsx                  # homepage
│   │   ├── produtos/
│   │   │   ├── page.tsx              # catálogo
│   │   │   └── [slug]/page.tsx       # página de produto
│   │   ├── carrinho/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── pedido/
│   │   │   ├── sucesso/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── privacidade/page.tsx      # política de privacidade (LGPD)
│   │   └── api/
│   │       ├── checkout/route.ts     # cria preferência MP
│   │       ├── frete/route.ts        # calcula frete via Melhor Envio
│   │       └── webhook/mercadopago/route.ts
│   │
│   ├── admin/                        # rota protegida por auth Supabase
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── produtos/page.tsx
│   │   └── pedidos/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                       # Button, Input, Card, Badge
│   │   ├── layout/                   # Header, Footer, AnnouncementBar
│   │   ├── produto/                  # ProductCard, ProductGallery, ProductInfo
│   │   └── checkout/                 # CartItem, OrderSummary, CheckoutForm, FreteCalc
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   └── mercadopago/
│   │       └── client.ts
│   │
│   └── types/
│       └── index.ts                  # Product, Order, CartItem, ShippingOption
│
└── supabase/
    └── migrations/                   # SQL das tabelas
```

---

## Schema do Banco (Supabase)

```sql
-- Produtos
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL,
  stock         INTEGER DEFAULT 0,
  category      TEXT,
  is_active     BOOLEAN DEFAULT true,
  weight_grams  INTEGER,           -- para cálculo de frete
  height_cm     INTEGER,
  width_cm      INTEGER,
  length_cm     INTEGER,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Imagens de produto
CREATE TABLE product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  "order"     INTEGER DEFAULT 0,
  is_primary  BOOLEAN DEFAULT false
);

-- Pedidos
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status          TEXT DEFAULT 'pending',  -- pending | paid | shipped | delivered | cancelled
  customer_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- nullable (visitante v1)
  customer_name   TEXT NOT NULL,
  customer_email  TEXT NOT NULL,
  customer_phone  TEXT,
  shipping_address JSONB NOT NULL,
  shipping_option  JSONB,                  -- serviço, prazo, preço escolhido
  subtotal        NUMERIC(10,2) NOT NULL,
  shipping_cost   NUMERIC(10,2) DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL,
  mp_payment_id   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Itens do pedido
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id),
  quantity    INTEGER NOT NULL,
  unit_price  NUMERIC(10,2) NOT NULL
);
```

---

## Variáveis de Ambiente (.env.example)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Mercado Pago
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=

# Melhor Envio
MELHOR_ENVIO_TOKEN=
MELHOR_ENVIO_FROM_POSTAL_CODE=  # CEP de origem da loja

# App
NEXT_PUBLIC_BASE_URL=            # ex: https://madriperfumes.com.br
```

---

## Benchmark — Features Extraídas

| Feature | Origem | Implementar na v1? |
|---|---|---|
| Announcement bar rotativa | Athena + Ateliê | ✅ |
| 4 benefícios em linha (hero) | Ateliê | ✅ |
| Grid 4 colunas | Todos | ✅ |
| Preço Pix + parcelamento no card | Athena + Ateliê | ✅ |
| WhatsApp flutuante | Todos | ✅ |
| Seção "Mais Vendidos" + "Novidades" | Athena + Ateliê | ✅ |
| Badge % OFF no card | Ateliê | ✅ |
| Navegação por família olfativa | Gisele | 🔲 (se aplicável ao catálogo MADRI) |
| Script font nas seções especiais | Ateliê | ✅ (fonte Agatho) |
| Popup email/cupom | Ateliê | ❌ v2 |
| Brinde progress bar | Gisele | ❌ v2 |
| Reviews no card | Ateliê | ❌ v2 |

---

## Etapas de Execução

| # | Etapa | Status |
|---|---|---|
| 1 | Setup inicial (scaffold, deps, gitignore, .env) | 🔲 |
| 2 | Homepage (hero, benefits, produtos em destaque) | 🔜 próxima |
| 3 | Banco de dados (migrations Supabase, RLS) | 🔲 |
| 4 | Catálogo + página de produto | 🔲 |
| 5 | Carrinho | 🔲 |
| 6 | Frete (Melhor Envio + CEP) | 🔲 |
| 7 | Checkout + Mercado Pago | 🔲 |
| 8 | Painel admin | 🔲 |
| 9 | SEO + LGPD | 🔲 |
| 10 | Testes manuais | 🔲 |
| 11 | Deploy + DNS | 🔲 |

---

## Assets Disponíveis

```
../MADRI_NOVO/
  MADRI.svg / .png / .ai / .eps / .pdf / .cdr
  MADRI_HORIZONTAL.svg / .png / .ai / .eps / .pdf
  MADRI_SUBMARK.svg / .png / .ai / .eps / .pdf

../LANDING/assets/fonts/
  Agatho-Bold.ttf (ou .woff2)
  Agatho-Light.ttf
  Agatho-Medium.ttf
  Agatho-Narrow.ttf
  Agatho-Regular.ttf

../output/
  madri-logo-master.svg
  madri-logo-horizontal.svg
  madri-seal-secondary.svg
  Variantes de cor (green, gold-mono, transparent, black, white)
```

---

## Custos Recorrentes (informar ao cliente)

| Serviço | Custo | Quem paga |
|---|---|---|
| Domínio | ~R$40/ano | Cliente (já tem) |
| Vercel | Free → Pro $20/mês | Cliente |
| Supabase | Free → Pro $25/mês | Cliente |
| Mercado Pago | % por transação | Cliente (automático) |
| Melhor Envio | Free até ~20 envios/mês | Cliente |

---

## LGPD — Mínimo Aplicado

- Dados coletados: nome, e-mail, telefone, endereço de entrega
- Finalidade: processar e entregar o pedido
- Base legal: execução de contrato
- Dados de pagamento: vão direto ao Mercado Pago, não armazenados no sistema
- Retenção: pedidos por 5 anos (fiscal); e-mail removível por solicitação
- Entregável: página `/privacidade` simples + aviso no checkout
