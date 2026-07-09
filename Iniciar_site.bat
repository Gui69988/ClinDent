@echo off
:: @license SPDX-License-Identifier: Apache-2.0
title Iniciar ClinDent - Sistema Odontologico
color 0B
echo ==========================================================
echo           INICIANDO SISTEMA CLINICO CLINDENT
echo ==========================================================
echo.
echo [1/4] Verificando se o Node.js esta instalado...
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
echo [2/4] Verificando dependencias do sistema (node_modules)...
if not exist node_modules (
    echo [Aviso] Pasta node_modules nao encontrada. Instalando dependencias...
    echo Isso pode demorar cerca de um minuto na primeira execucao.
    call npm install
) else (
    echo [OK] Dependencias ja instaladas.
)

echo.
echo [3/4] Configurando diretorios locais para salvamento de arquivos...
echo Criando estrutura de pastas em C:\ClinDent\Armazenamento_Geral...

:: Criar diretórios locais no computador do usuário
if not exist "C:\ClinDent\Armazenamento_Geral" (
    mkdir "C:\ClinDent\Armazenamento_Geral" >nul 2>&1
)
if not exist "C:\ClinDent\Armazenamento_Geral\Agenda" (
    mkdir "C:\ClinDent\Armazenamento_Geral\Agenda" >nul 2>&1
)
if not exist "C:\ClinDent\Armazenamento_Geral\Financeiro" (
    mkdir "C:\ClinDent\Armazenamento_Geral\Financeiro" >nul 2>&1
)
if not exist "C:\ClinDent\Armazenamento_Geral\Estoque" (
    mkdir "C:\ClinDent\Armazenamento_Geral\Estoque" >nul 2>&1
)
if not exist "C:\ClinDent\Armazenamento_Geral\Auditoria" (
    mkdir "C:\ClinDent\Armazenamento_Geral\Auditoria" >nul 2>&1
)
if not exist "C:\ClinDent\Armazenamento_Geral\Pacientes" (
    mkdir "C:\ClinDent\Armazenamento_Geral\Pacientes" >nul 2>&1
)

:: Criar uma pasta modelo/template de paciente para referência
if not exist "C:\ClinDent\Armazenamento_Geral\Pacientes\Modelo_Paciente_Template" (
    mkdir "C:\ClinDent\Armazenamento_Geral\Pacientes\Modelo_Paciente_Template" >nul 2>&1
)
if not exist "C:\ClinDent\Armazenamento_Geral\Pacientes\Modelo_Paciente_Template\Contratos" (
    mkdir "C:\ClinDent\Armazenamento_Geral\Pacientes\Modelo_Paciente_Template\Contratos" >nul 2>&1
)
if not exist "C:\ClinDent\Armazenamento_Geral\Pacientes\Modelo_Paciente_Template\Exames" (
    mkdir "C:\ClinDent\Armazenamento_Geral\Pacientes\Modelo_Paciente_Template\Exames" >nul 2>&1
)
if not exist "C:\ClinDent\Armazenamento_Geral\Pacientes\Modelo_Paciente_Template\Gerais" (
    mkdir "C:\ClinDent\Armazenamento_Geral\Pacientes\Modelo_Paciente_Template\Gerais" >nul 2>&1
)
if not exist "C:\ClinDent\Armazenamento_Geral\Pacientes\Modelo_Paciente_Template\Gto's" (
    mkdir "C:\ClinDent\Armazenamento_Geral\Pacientes\Modelo_Paciente_Template\Gto's" >nul 2>&1
)
if not exist "C:\ClinDent\Armazenamento_Geral\Pacientes\Modelo_Paciente_Template\Radiografias" (
    mkdir "C:\ClinDent\Armazenamento_Geral\Pacientes\Modelo_Paciente_Template\Radiografias" >nul 2>&1
)

echo [OK] Estrutura de pastas locais criada com sucesso!
echo.
echo [4/4] Abrindo o ClinDent no seu navegador e iniciando o servidor...
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
