# Checklist de Validação — Álbum Supermédica
> Verificação por leitura de código + análise da implementação. Data: 2026-05-30.

---

## 1. Layout — Título e botões
- [x] Título aparece no topo da tela
- [x] Botões com texto aparecem logo abaixo do título
- [x] Layout correto no mobile (sem sobreposição / corte)

**Resultado: ✅ OK**
- Título "⚽ Supermédica · Super Copa 2026" está no `<header>` (`FlipBook.tsx:904`)
- Botões Pacotes / Inventário / Trocas seguem na mesma linha (`FlipBook.tsx:906–960`)
- No mobile, botões mostram emoji ao invés de texto (`isPortrait ? '🎴' : 'Pacotes'`)

---

## 2. Paginação — Uma página por vez
- [x] Somente uma página visível na tela ao mesmo tempo
- [x] Transição entre páginas funciona corretamente
- [x] Sem scroll horizontal acidental mostrando página seguinte/anterior

**Resultado: ✅ OK**
- Mobile: `MobilePageView` (`FlipBook.tsx:432`) exibe apenas `cur` — uma página por vez
- Animação CSS 3D com `FLIP_HALF = 170ms` por direção (`FlipBook.tsx:430`)
- Desktop: biblioteca `page-flip` mostra spread de 2 páginas (comportamento padrão de álbum)

---

## 3. Figurinha — Abrir ao clicar
- [x] Clicar em uma figurinha abre ela (modal / zoom / detalhes)
- [x] Fecha corretamente ao sair
- [x] Funciona no mobile (touch)

**Resultado: ✅ OK**
- `FigurinhaPreview.tsx` implementa modal overlay com backdrop blur
- `onPreview` é passado por `buildPages` → `SectionPage` → figurinha
- Botões "Baixar" e "Trocar" dentro do modal
- Fechar clicando no fundo ou no X

---

## 4. Índice — Botão e conteúdo
- [x] Botão para abrir o índice está visível
- [x] Clicar no botão exibe o índice
- [x] Figurinhas aparecem dentro da página do índice
- [x] Figurinhas do índice são clicáveis / navegáveis

**Resultado: ✅ OK**
- Mobile: botão "▤" no header (`FlipBook.tsx:888–902`) abre `MobileFilmstrip`
- Desktop: painel lateral fixo 72px à esquerda (`FlipBook.tsx:315–373`)
- Páginas reais renderizadas em miniatura (escala real com `pgScale = TH_W / PAGE_W`)
- Clique na miniatura navega direto para a página (`onGo(i)`)

---

## 5. Abertura de pacote — Uma figurinha por vez
- [x] Abrir pacote revela as figurinhas uma por uma
- [x] Animação / sequência está correta
- [x] Último clique encerra o fluxo de abertura

**Resultado: ✅ OK (com observação)**
- Flip 3D individual por carta (`PacoteAbertura.tsx:419–451`)
- Texto indica `Clique para revelar · X/Y` e `Clique para próxima` (`PacoteAbertura.tsx:461–464`)
- Último clique mostra `Clique para fechar` e encerra
- ⚠️ **Observação**: um clique puro sem arrastar também abre o pacote (`PacoteAbertura.tsx:142`)
  — provavelmente intencional para facilitar uso no mobile, mas pode ser revisto

---

## 6. Identificação da conta logada
- [x] Exibe matrícula no formato `00000` + nome do usuário
- [x] Exibição visível na interface (header / menu)
- [ ] **Botão Sair presente e funcional** ← ❌ AUSENTE
- [ ] Logout redireciona para a tela de login ← ❌ NÃO TESTÁVEL SEM O BOTÃO

**Resultado: ❌ FALHA PARCIAL**
- Nome (2 primeiros nomes) e matrícula com `#` aparecem no header (`FlipBook.tsx:961–973`)
- **Botão "Sair" não existe em nenhum lugar da interface do álbum**
- O badge de usuário não é clicável e não tem menu de logout

---

## 7. Login — Aceitar matrícula sem zero à esquerda
- [x] Digitar `931` faz login normalmente (sem exigir `00931`)
- [x] Digitar `00931` também funciona
- [x] Espaços extras no início/fim são ignorados

**Resultado: ✅ OK**
- `auth.ts:56`: `matricula.replace(/\D/g, '').padStart(5, '0')`
- Remove tudo que não é dígito e preenche com zeros até 5 caracteres
- Cobre `931`, `00931`, ` 931 ` — todos viram `00931`
- Mesmo padrão em recuperar-senha e InventarioModal

---

## 8. Cores alternadas
- [x] Cores por seção aplicadas
- [ ] **Inconsistência de nomes entre componentes** ← ⚠️ RISCO DE BUG
- [x] Não quebra em telas menores

**Resultado: ✅ OK (com alerta)**
- `SECTION_COLOR` com 9 departamentos em `FlipBook.tsx:106–116` e `InventarioClient.tsx:10–21`
- As cores são por seção/departamento — distintas e com bom contraste
- ⚠️ **Inconsistência**: FlipBook usa `'MARKETING / TI'` (uppercase); InventarioClient usa `'Marketing'` e `'Tecnologia da Informação'` separados
  — se o banco retornar um padrão diferente, a cor cai no fallback `#333`

---

## 9. Inventário — Código da figurinha no canto superior esquerdo
- [ ] **Código no canto SUPERIOR esquerdo** ← ❌ ERRADO
- [x] Código visível em posições vazias
- [x] Tamanho / cor do código legível

**Resultado: ❌ FALHA**
- Código `#fig.id` está em `bottom: 0` (canto **inferior**, faixa larga) — `InventarioClient.tsx:62–72`
- O requisito especifica **canto superior esquerdo**
- Badge de repetidas está correto: `top: 5, right: 5` (canto superior direito)

---

## Resumo Executivo

| # | Item | Status | Ação necessária |
|---|------|--------|-----------------|
| 1 | Título e botões | ✅ OK | — |
| 2 | Uma página por vez | ✅ OK | — |
| 3 | Clicar na figurinha abre | ✅ OK | — |
| 4 | Botão índice + figurinhas | ✅ OK | — |
| 5 | Pacote — uma por uma | ✅ OK | Revisar se clique puro é intencional |
| 6 | Identificação + botão sair | ❌ Parcial | **Implementar botão Sair** |
| 7 | Login sem zero à esquerda | ✅ OK | — |
| 8 | Cores alternadas | ✅ OK ⚠️ | Alinhar nomes de seção entre componentes |
| 9 | Inventário — código no canto | ❌ Falha | **Mover código para `top: 0, left: 0`** |

**2 itens precisam de correção: item 6 (botão Sair) e item 9 (posição do código).**
