
# Angolife Automation Scripts 🤖

Este diretório contém os scripts para automação de conteúdo (Vagas de Emprego e Notícias).

## Pré-requisitos
- Python instalado (você já tem!)

## Como Configurar (Apenas na primeira vez)
dê duplo clique em:
👉 **`setup_env.bat`**

Isso vai instalar as bibliotecas necessárias (`requests`, `beautifulsoup4`, `feedparser`).

## Como Rodar os "Robôs"
Sempre que quiser buscar novas vagas ou notícias, dê duplo clique em:
👉 **`run_scrapers.bat`**

Isso vai:
1.  Rodar o `scraper_jobs.py` (buscar vagas)
2.  Rodar o `rss_news.py` (buscar notícias RSS)
3.  Simular o envio para o banco de dados (estado `pending`)

Depois, vá ao **Painel de Admin** na web app para aprovar o conteúdo.
