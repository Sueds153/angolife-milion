@echo off
echo ==========================================
echo    AngoLife - Finalizador de Seguranca
echo ==========================================
echo.
echo Este script vai terminar a configuracao do seu servidor Supabase.
echo.

echo Passo 1: Login no Supabase (Ira abrir o seu navegador)
call npx supabase login
if %ERRORLEVEL% NEQ 0 (
    echo Erro ao fazer login.
    pause
    exit /b
)

echo.
echo Passo 2: Ligar ao seu projecto
call npx supabase link --project-ref efhelvzdlwewsjkdknkl
if %ERRORLEVEL% NEQ 0 (
    echo Erro ao ligar ao projecto. Verifique se o ID efhelvzdlwewsjkdknkl esta correto.
    pause
    exit /b
)

echo.
echo Passo 3: Enviar a funcao de seguranca (Proxy)
call npx supabase functions deploy gemini-proxy
if %ERRORLEVEL% NEQ 0 (
    echo Erro ao fazer deploy da funcao.
    pause
    exit /b
)

echo.
echo Passo 4: Configurar a sua chave GEMINI
set /p API_KEY="Cole aqui a sua GEMINI_API_KEY e carregue em ENTER: "
call npx supabase secrets set GEMINI_API_KEY=%API_KEY%

echo.
echo ==========================================
echo    CONCLUIDO! O seu app esta seguro.
echo ==========================================
pause
