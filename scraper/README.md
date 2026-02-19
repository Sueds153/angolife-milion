# AngoJobScraper 🇦🇴

Script Python premium para alimentar automaticamente a tabela `jobs` no Supabase com vagas de emprego angolanas.

## ⚙️ Instalação

```bash
# 1. Instalar dependências
pip install -r requirements.txt

# 2. Garantir que o .env.local tem as credenciais do Supabase
# NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  (chave de serviço, não a anon)
```

## 🚀 Uso

```bash
python ango_job_scraper.py
```

## 🌐 Adicionar um Novo Site

Edite a lista `SITE_CONFIGS` no topo do ficheiro:

```python
{
    "name": "Nome do Site",
    "base_url": "https://www.meusite.ao",
    "list_url": "https://www.meusite.ao/empregos",
    "job_card_selector": "div.vaga-item",  # Seletor CSS do card
    "fields": {
        "title": "h2.titulo",
        "company": ".empresa",
        "location": ".cidade",
        "description": ".resumo",
        "link": "a",
    },
    "detail_page": {
        "enabled": False,  # True para entrar na página de detalhe
        "description": ".descricao-completa",
        "requirements": "ul.requisitos",
    },
}
```

## ⏰ Agendamento Automático (GitHub Actions)

Crie o ficheiro `.github/workflows/scraper.yml` no seu repositório:

```yaml
name: AngoJobScraper

on:
  schedule:
    - cron: '0 7 * * *'  # Todos os dias às 08:00 (hora de Angola = UTC+1)
  workflow_dispatch:       # Permite correr manualmente

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Instalar dependências
        run: pip install -r scraper/requirements.txt
      - name: Correr scraper
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: python scraper/ango_job_scraper.py
```

## 📋 Fluxo de Trabalho

```text
Sites Angolanos → AngoJobScraper → Supabase (status: pendente) → Admin aprova → App exibe
```

## 🔍 Como Encontrar os Seletores CSS

1. Abra o site alvo no Chrome
2. Clique com o botão direito numa vaga → **Inspecionar**
3. Identifique a classe CSS do container da vaga (ex: `div.job-card`)
4. Copie o seletor para `job_card_selector` na configuração
