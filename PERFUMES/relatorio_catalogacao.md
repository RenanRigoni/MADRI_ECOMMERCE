# Relatório de Catalogação — Estoque de Perfumes

## Números gerais

| Métrica | Valor |
|---|---|
| Imagens analisadas | 166 |
| Produtos únicos catalogados | 159 |
| Imagens agrupadas em duplicata (mesmo produto, mais de uma foto) | 2 pares |
| Confiança **alta** | 155 |
| Confiança **média** | 4 |
| Enviados para **INCONCLUSIVO** (confiança baixa) | 5 |
| Fichas com notas olfativas/descrição confirmadas por pesquisa | 156 / 159 |
| Fichas sem confirmação olfativa (marcadas honestamente, sem invenção) | 3 / 159 |

## Metodologia

1. **Identificação visual** — todas as 166 fotos foram lidas individualmente, extraindo marca, nome, versão, concentração, volume, gênero e tipo de produto quando visíveis na embalagem.
2. **Agrupamento** — fotos que representam o mesmo produto físico foram unificadas em um único cadastro (2 pares identificados: Emper Genius Blush e um perfume "Delilah" com brasão de leão fotografado duas vezes).
3. **Resolução de ambiguidades** — 26 itens ficaram com marca não visível na foto ou informação secundária incerta. Cada um foi pesquisado individualmente para tentar confirmar marca/produto real. Resultado: 20 confirmados (subiram para confiança alta/média), 6 permaneceram sem confirmação segura → INCONCLUSIVO.
4. **Pesquisa de fichas técnicas/olfativas** — para os 138 produtos de confiança alta/média, foi feita pesquisa individual (site oficial da marca → Fragrantica → grandes varejistas) para montar família olfativa, notas de topo/coração/fundo, perfil, ocasiões sugeridas e descrição original em português. 156 produtos tiveram a pesquisa confirmada com fontes citadas; 3 não tiveram confirmação suficiente e foram deixados **sem notas inventadas** (campos nulos, com explicação no campo `descricao`).

## Achado que exige revisão manual

**Maison Alhambra "Divine Mystique"** (imagem `13.52.47 (1)`) — a foto mostra claramente a marca Maison Alhambra na caixa, mas a pesquisa não encontrou nenhum produto com esse nome no catálogo oficial da marca. Existe um perfume de nome idêntico, porém sob a marca **Le Chameau (Emper)**. Por conflito entre foto e pesquisa, o item foi mantido no catálogo com a marca fotografada, mas rebaixado para confiança **média** e sinalizado em `observacoes` para conferência manual na embalagem física antes de publicar no site.

## Itens em INCONCLUSIVO/ (5 imagens)

| Arquivo | Palpite | Motivo |
|---|---|---|
| `13.46.46.jpeg` | "Bellissima" | Marca árabe não confirmada — nenhuma correspondência confiável encontrada |
| `13.46.57.jpeg` | "Kronos" | Existem 2 perfumes reais com esse nome (Fragrance World e Giardino Benessere) — foto não permite distinguir qual |
| `13.52.37.jpeg` | "Dunya" | "Dunya by Naseem" encontrado, mas sem confirmação da embalagem específica (rosa/dourada, feminina) |
| `13.52.39 (1).jpeg` | — | Foto borrada/ilegível |
| `13.52.54.jpeg` | Al Wataniah — Sabah Al Ward (variante roxa) | Marca e linha confirmadas, mas variante específica não identificada com segurança (risco de confundir com "Delilah", já catalogada à parte) |

## Problemas encontrados durante o processo

- **Pesquisa web esgotou limite de sessão da API repetidas vezes** durante a etapa de validação/notas olfativas (trabalho retomado em lotes menores com gravação incremental em disco para não perder progresso).
- Vários perfumes de marcas árabes de nicho (Lattafa, Maison Alhambra, Emper, Al Wataniah, Amaran, Grandeur, etc.) têm documentação online escassa fora de Fragrantica e do site oficial — nesses casos a pesquisa foi mais demorada e alguns ficaram em confiança "média".
- A linha "Brand Collection" (10 itens, frascos de 25ml numerados) é composta por perfumes clone/inspirados — quando a fonte confirmava a inspiração, isso foi mencionado no texto sem nunca afirmar tratar-se do perfume original.
- Volume (`ml`) não estava visível na foto em ~20 produtos; nesses casos, o volume padrão de mercado foi preenchido **apenas** quando a pesquisa trouxe fonte confiável — caso contrário o campo ficou `null`.

## Arquivos gerados

```
PERFUMES/
├── catalogo.json          (159 produtos — dados técnicos)
├── catalogo.csv            (mesma base, formato planilha)
├── produtos_site.json      (159 produtos — conteúdo pronto pro site: descrições, notas, SEO)
├── relatorio_catalogacao.md
└── INCONCLUSIVO/
    ├── inconclusivos.json
    └── 5 imagens copiadas
```
