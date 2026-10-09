# Resolve.AO — utilitários manuais (`scripts/`)

Scripts pontuais de manutenção/automação. **Não fazem parte do fluxo normal** da app.

> O scraping de conteúdo (empregos/notícias) **não** vive aqui: é feito por `scraper/`
> através dos GitHub Actions (`.github/workflows/scraper.yml` e `news_scraper.yml`).

| Ficheiro | Para que serve |
| --- | --- |
| `generate-logo.mjs` | Gera o logo/identidade visual (usado com `node scripts/generate-logo.mjs`) |
| `migrate_r2_sensitive_private.py` | Migra objetos R2 para o bucket privado `sensitive` |
| `setup_ads_bucket.sql` | Cria/define permissões do bucket de anúncios no Storage |
| `fix_admin_profile.py` | Corrige perfis de admin na base de dados |
| `requirements.txt` | Dependências Python dos scripts acima |

```bash
pip install -r scripts/requirements.txt   # deps dos scripts Python
```
