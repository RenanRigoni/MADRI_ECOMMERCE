# Painel administrativo — instalação e uso

## O que foi feito

`public.products` (Supabase) virou a fonte única de verdade do catálogo — tanto para a
vitrine (`src/lib/perfumes.ts`) quanto para o checkout, que já usava essa tabela. O
JSON estático (`src/data/perfumes.json`) deixou de alimentar o site; ele só serve para
importar os 159 produtos pesquisados uma única vez (`scripts/seed-products.js`).

A dona da loja loga em `/admin` (Supabase Auth) e gerencia produtos: marca, nome,
versão, volume, gênero, tipo, preço, desconto, estoque, visibilidade, descrições e
fotos (Supabase Storage, bucket `product-photos`, público). Notas olfativas, família,
SEO e curadoria da home continuam vindo dos dados pesquisados; produtos novos criados
por ela simplesmente nascem sem essa camada extra (a loja funciona normalmente, só não
entram nos filtros de "família olfativa" até alguém preencher esses campos direto no
banco, se um dia isso for necessário).

## 1. Aplicar a migração

Depois de já ter o Supabase configurado (ver `docs/MERCADO_PAGO_SETUP.md` para o setup
inicial do projeto), aplique também:

```
supabase/migrations/20260805120000_product_catalog.sql
```

Isso estende `products` com os campos de catálogo, cria a política de leitura pública
(só produtos `active = true`) e cria o bucket `product-photos`.

## 2. Importar os 159 produtos pesquisados (uma vez só)

```powershell
node --env-file=.env.local scripts/seed-products.js
```

Os preços vieram zerados do JSON original — produtos com preço 0 entram como
`active = false` (invisíveis na loja) até alguém definir um preço real pelo painel.

## 3. Criar o login da dona da loja

No Supabase Studio: **Authentication → Users → Add user**. Preencha o e-mail dela e
uma senha temporária (ou marque "Auto confirm user" e envie um link de redefinição
depois). Não existe cadastro público — só esse usuário criado manualmente consegue
entrar no painel.

## 4. Variáveis de ambiente

Nenhuma variável nova além das que já existiam:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` (antes só usada em teoria) agora é obrigatória em
runtime — a leitura pública do catálogo e o login do admin passam por ela.

## 5. Como o painel funciona por dentro

- Login: Supabase Auth (e-mail+senha), sessão em cookie HttpOnly.
- `src/proxy.ts` bloqueia qualquer rota `/admin/*` sem sessão válida (redireciona pro
  login). Cada Server Action de escrita também revalida a sessão (`requireAdminUser`)
  — não depende só do proxy, seguindo a própria recomendação do Next.js 16.
- Escrita no banco usa o client de service role (mesmo padrão do módulo de
  pagamentos) — só é alcançável depois da checagem de sessão acima.
- "Desativar" produto nunca apaga a linha (produtos já vendidos têm `order_items`
  apontando pra eles — o banco proíbe exclusão via `on delete restrict`). Desativar só
  esconde da loja; reativar traz de volta com todo o histórico intacto.
- Toda alteração dispara `revalidatePath` nas páginas afetadas (home, `/produtos`,
  a página do produto) — a mudança aparece na loja na hora, sem precisar de novo
  deploy.

## 6. Guia rápido pra ela (sem jargão técnico)

Enviar isso pra dona da loja:

> **Acessar o painel:** entre em `seusite.com.br/admin`, digite seu e-mail e senha.
>
> **Adicionar um produto novo:** clique em "+ Novo produto". Preencha marca, nome,
> preço, quantidade em estoque, peso e as três dimensões da caixa embalada
> (altura/largura/profundidade em cm — é o que vai calcular o frete) e escreva uma
> descrição. Envie até 6 fotos (JPG, PNG ou WEBP, até 5MB cada). Deixe "Visível na
> loja" marcado se já quiser vender. Clique em "Salvar produto" — em poucos segundos
> ele aparece no site.
>
> **Produto sem botão de "Ativar":** falta preencher preço, peso ou dimensões — edita
> o produto, completa esses campos e salva.
>
> **Editar um produto:** na lista de produtos, clique em "Editar", mude o que precisar
> e salve de novo.
>
> **Tirar um produto da loja temporariamente:** clique em "Desativar" na lista — ele
> some do site na hora, mas os dados continuam guardados. Clique em "Ativar" pra
> trazer de volta.
>
> **Remover uma foto:** na tela de edição, clique no "×" vermelho em cima da foto.
>
> Não existe botão de "excluir para sempre" de propósito — assim nunca se perde um
> produto sem querer.

## 7. O que ainda fica de fora do painel (v1)

Notas olfativas (topo/coração/base), família olfativa detalhada, ocasião, tags de
estilo e SEO (meta título/descrição) continuam só nos 159 produtos importados do
JSON — não têm campo no formulário ainda. Se precisar editar isso depois, é direto na
tabela `products` do Supabase Studio. Dá pra adicionar esses campos ao formulário no
futuro se fizer sentido pro negócio.
