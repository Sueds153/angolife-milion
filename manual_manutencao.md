# 📖 Manual de Manutenção - Angolife

Este guia fornece instruções passo a passo para realizar alterações comuns no projeto, como mudar textos, cores, configurações e realizar manutenção básica.

---

## 1. Alterar Textos e Frases

A maioria dos textos está localizada diretamente nos componentes visuais.

### Como encontrar o texto

1. Use a função de "Procurar em todos os ficheiros" (Ctrl + Shift + F no VS Code).
2. Digite a frase exata que deseja alterar.
3. O editor mostrará o ficheiro `.tsx` onde o texto reside.

**Principais locais de texto:**

- **Página Inicial**: `pages/HomePage.tsx`
- **Cabeçalho (Menu)**: `components/layout/Navbar.tsx`
- **Rodapé**: `components/layout/Footer.tsx`
- **Página de Vagas**: `pages/JobsPage.tsx` e `components/jobs/`

---

## 2. Alterar Cores e Identidade Visual

As cores principais são geridas via CSS e classes utilitárias.

### Cores Globais (Ouro, Escuro, Claro)

Abra o ficheiro [index.css](file:///c:/Users/Administrator/Documents/angolife%20atualizado%20pro/angolife%20atualizado/angolife%20atualizado/angolife/index.css).

- Procure o bloco `@theme`.
- Altere os valores hexadecimais:

  ```css
  --color-brand-gold: #f59e0b;
  --color-brand-dark: #0f172a;
  ```

### Cores em Componentes (Tailwind)

O projeto usa Tailwind CSS. Se vir classes como `text-orange-500` ou `bg-orange-500` nos ficheiros `.tsx`:

- Substitua `orange-500` por outra cor (ex: `blue-600`, `emerald-500`).
- Consulte a documentação do Tailwind para ver a paleta disponível.

---

## 3. Configurações Globais (WhatsApp, Bancos, Horários)

Centralizei as informações de negócio num ficheiro de constantes para facilitar a manutenção rápida.

Abra o ficheiro [app.ts](file:///c:/Users/Administrator/Documents/angolife%20atualizado%20pro/angolife%20atualizado/angolife%20atualizado/angolife/constants/app.ts).

Pode alterar:

- **Número de WhatsApp**: `WHATSAPP_NUMBER`
- **Horário de Funcionamento**: `OPERATIONAL_HOURS`
- **Dados Bancários e Pagamentos**: `BANK_DETAILS` (Entidade, Referência, IBAN, etc.)

---

## 4. Estrutura do Projeto (Onde está o quê)

Após a reorganização, os ficheiros estão em locais lógicos:

- **`pages/`**: Os ecrãs principais do app.
- **`components/ads/`**: Gestão de publicidade.
- **`components/exchange/`**: Tudo relacionado com o Câmbio.
- **`components/jobs/`**: Tudo relacionado com o Portal de Emprego.
- **`components/modals/`**: Janelas pop-up (Login, Termos, Convites).
- **`services/`**: Lógica de conexão com a base de dados (Supabase).
- **`store/`**: Gestão do estado global (tema escuro, notificações).

---

## 5. Manutenção Técnica

### Adicionar novas funcionalidades

1. Crie o serviço em `services/api/`.
2. Crie os componentes em `components/`.
3. Adicione a rota em `App.tsx`.

### Verificar erros (Checkup)

Se fizer alterações e quiser garantir que não estragou nada, corra este comando no terminal:

```bash
npx tsc --noEmit
```

Se o resultado for vazio, o código está correto e pronto para produção!

---

## 6. Segurança do Supabase

Para manter o seu sistema seguro e livre de avisos no Dashboard do Supabase, siga estas recomendações:

### Resolver o aviso "Function Search Path Mutable"

Eu já atualizei o ficheiro [security_patch_v2.sql](file:///c:/Users/Administrator/Documents/angolife%20atualizado%20pro/angolife%20atualizado/angolife%20atualizado/angolife/database/security_patch_v2.sql).

- **Ação**: Copie o conteúdo da função `check_notification_limit` desse ficheiro e execute-o novamente no "SQL Editor" do seu painel Supabase. Isso restringirá o caminho de busca e protegerá a função.

### Resolver o aviso "Leaked Password Protection"

Este aviso indica que o Supabase pode verificar se as palavras-passe dos seus utilizadores foram expostas em fugas de dados globais.

- **Ação**: No painel do Supabase, vá a **Authentication** -> **Settings** -> **Security** e ative a opção **"Leaked password protection"**.

### Resolver o aviso "Function Search Path Mutable" em funções AUTH

Se aparecerem avisos sobre funções dentro do esquema `auth`, elas são geridas pelo Supabase, mas pode reforçá-las adicionando `SET search_path = public` na definição da função se as tiver criado manualmente.
