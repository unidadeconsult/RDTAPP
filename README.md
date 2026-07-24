# Kylian+Movic

**Dados, odds e inteligências em busca do melhor consenso.**

Central de inteligência esportiva pré-jogo que organiza dados estatísticos do FutOdds, calcula
odds justas e valor esperado (EV), e compara relatórios produzidos por diferentes inteligências
artificiais para identificar consensos, divergências, riscos e mercados mal precificados — sem
inventar dados e sem prometer certezas.

## Stack

- **Front-end:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Formulários/validação:** React Hook Form + Zod
- **Gráficos:** Recharts (radar comparativo)
- **Animações:** Framer Motion
- **Ícones:** Lucide
- **Persistência (MVP):** `localStorage` do navegador — a arquitetura de tipos (`src/types`) já
  está desenhada para uma futura migração a Supabase/PostgreSQL (ver `.env.example`)
- **Testes:** Vitest (parser, cálculos e motor de consenso)

## Como rodar

```bash
npm install
npm run dev       # ambiente de desenvolvimento em http://localhost:3000
npm run build     # build de produção
npm run start     # serve o build de produção
npm run lint       # ESLint
npm test           # testes unitários (Vitest)
```

Não há variáveis de ambiente obrigatórias nesta versão (ver `.env.example`).

## Arquitetura

```text
src/
  app/                     rotas (App Router)
    page.tsx                tela inicial — colar dados do FutOdds
    analysis/[id]/page.tsx   dashboard da partida com as 8 abas
    history/page.tsx         histórico local de análises
  components/
    layout/                 cabeçalho da aplicação
    match/                   cabeçalho da partida, comparativos, cenários
    markets/                 tabela de mercados, semáforo, régua de EV
    consensus/               Consensus Lab (relatórios de IA, matriz, síntese)
    charts/                  radar comparativo (Recharts)
    forms/                   formulário de nova análise
    common/                  logo, tema, card recolhível, disclaimer etc.
  lib/
    parser/                  parser do texto do FutOdds (linhas "rótulo: valor")
    validators/               validação/consistência dos dados extraídos
    calculations/             odds justa, EV, risco, consistência
    consensus/                normalização de relatórios de IA e cálculo de consenso
    storage/                  persistência em localStorage
    scenarios.ts, checklist.ts, convergence.ts   lógica das demais abas
  types/                     modelo de domínio (FutOdds, AIReport, Analysis...)
  data/                       texto e relatórios de demonstração (seed)
  tests/                      testes unitários
```

### As três camadas do produto

1. **Dados-base** — extraídos do texto colado do FutOdds (`lib/parser`).
2. **Relatórios das IAs** — inseridos manualmente pelo usuário no Consensus Lab, com extração
   automática best-effort de campos estruturados (`lib/consensus/normalizeReport.ts`).
3. **Auditor Kylian+Movic** — normaliza, compara, pondera qualidade dos relatórios e produz a
   síntese final (`lib/consensus/consensus.ts`).

## O que está implementado nesta primeira entrega (MVP)

- Parser do FutOdds (times, odds, probabilidades, últimos 5 e últimos 20 jogos, xG, chutes,
  escanteios, cartões, posse etc.), com validação de inconsistências e nota de confiança
- Cálculo de probabilidade implícita, odd justa e EV por mercado
- Dashboard com as 8 abas: Visão Geral, Comparativo, Mercados Premium, Cenários, Consensus Lab,
  Matriz de Convergência, Checklist Final, Riscos e Conclusão
- Radar comparativo, semáforo de mercados, régua de EV, bloco de decisão (principal/alternativo/evitar)
- Consensus Lab completo: CRUD de relatórios de IA, matriz comparativa, mapa de similaridade,
  detecção de outliers, índice de consenso ponderado e síntese final auditada
- Histórico local com busca e filtro por confiança, duplicar/excluir
- Tema claro (padrão) e escuro, cards recolhíveis (preferência salva), impressão/PDF
- Dado de demonstração (Västerås SK x Örgryte) claramente marcado como `isDemo`, nunca misturado
  com análises reais
- Suíte de testes unitários para parser, cálculos e motor de consenso

## O que fica para uma próxima etapa (não simulado nesta versão)

Conforme a diretriz de não criar botões falsos, os itens abaixo aparecem sinalizados como "em
breve" na interface (ex.: botão *Desempenho* no cabeçalho) em vez de terem uma integração
simulada:

- Persistência em nuvem (Supabase/PostgreSQL) e autenticação
- Painel de desempenho (histórico de apostas, ROI, taxa de acerto)
- Acompanhamento de apostas (stake/retorno/lucro por mercado) — o tipo `BetTracking` já existe
  no modelo de dados, mas a UI de registro ainda não foi construída
- Exportação em PNG e link compartilhável (a impressão/PDF via navegador já funciona)

## Nota sobre dependências

`npm audit` reporta avisos de segurança do Next.js 14.2.x relacionados a recursos não utilizados
nesta aplicação (Image Optimizer com `remotePatterns`, Middleware, i18n de Pages Router, Server
Actions). Optamos por manter a versão 14 (última patch, `14.2.35`) em vez de migrar para o
Next 16 nesta entrega, para não introduzir mudanças de breaking change fora do escopo do MVP.

## Aviso de responsabilidade

Esta ferramenta oferece análises estatísticas e comparações entre relatórios de inteligência
artificial para fins informativos. Valor esperado positivo não representa garantia de lucro.
Apostas envolvem risco financeiro. O consenso entre modelos não equivale a independência
estatística. Utilize gestão responsável e nunca comprometa recursos essenciais.
