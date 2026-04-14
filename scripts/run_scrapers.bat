
@echo off
echo [*] Running Job Scraper...
python scraper_jobs.py
echo.
echo [*] Running Rates Scraper...
python scraper_rates.py
echo.
echo [*] Running RSS Feed Reader...
python rss_news.py
echo.
echo [*] Automation finished. Check Admin Panel for pending items.
pause
