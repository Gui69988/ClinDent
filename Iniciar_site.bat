@echo off
:: @license SPDX-License-Identifier: Apache-2.0
title Iniciar ClinDent - Sistema Odontologico
color 0B
echo ==========================================================
echo           INICIANDO SISTEMA CLINICO CLINDENT
echo ==========================================================
echo.
echo [1/3] Verificando se o Node.js esta instalado...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] O Node.js nao foi encontrado no seu computador!
    echo Por favor, instale o Node.js em: https://nodejs.org/
    echo Pressione qualquer tecla para abrir o site de instalacao...
    pause >nul
    start https://nodejs.org/
    exit
)

echo [OK] Node.js detectado com sucesso.
echo.
echo [2/3] Verificando dependencias do sistema (node_modules)...
if not exist node_modules (
    echo [Aviso] Pasta node_modules nao encontrada. Instalando dependencias...
    echo Isso pode demorar cerca de um minuto na primeira execucao.
    call npm install
) else (
    echo [OK] Dependencias ja instaladas.
)

echo.
echo [3/3] Abrindo o ClinDent no seu navegador e iniciando o servidor...
echo O site abrira em instantes na sua tela!
echo.
echo Para encerrar o sistema, basta fechar esta janela do CMD.
echo.
echo ==========================================================

:: Abrir o navegador na porta padrao 3000 do ClinDent
start http://localhost:3000

:: Iniciar o servidor local do ClinDent
npm run dev

pause
