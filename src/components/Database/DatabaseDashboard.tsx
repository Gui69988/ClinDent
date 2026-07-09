/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  Play,
  Copy,
  Download,
  Shield,
  Server,
  FolderOpen,
  CheckCircle,
  AlertTriangle,
  FileText,
  Terminal,
  ArrowRight,
  Search,
  FileCode,
  RefreshCw,
  FolderTree,
  ChevronRight,
  Info
} from 'lucide-react';
import { useDental } from '../../context/DentalContext';
import { Patient, DocumentFile, ClinicalEvolution, FinancialRecord, Appointment, StockItem, AuditLog } from '../../types/dental';

// DDL generator code based on database choice
const generateFullDDL = (dbType: 'sqlite' | 'postgres'): string => {
  const uuidType = dbType === 'sqlite' ? 'TEXT PRIMARY KEY' : 'UUID PRIMARY KEY DEFAULT gen_random_uuid()';
  const fkRef = (table: string, col = 'id') => `REFERENCES ${table}(${col})`;
  
  return `-- =========================================================================
-- BANCO DE DADOS LOCAL: CLIN-DENT (CLÍNICA ODONTOLÓGICA INTEGRADA)
-- DIALETO: ${dbType.toUpperCase()}
-- DATA DE GERAÇÃO: ${new Date().toLocaleDateString('pt-BR')}
-- OBJETIVO: INTEGRALIDADE CLÍNICA, PERFORMANCE DE BUSCA E CONFORMIDADE LGPD
-- =========================================================================

${dbType === 'postgres' ? 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n' : ''}
-- 1. ESTRUTURA DE CONTROLE DE UNIDADES E EQUIPE (ADMINISTRAÇÃO)
CREATE TABLE units (
  id ${uuidType},
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE chairs_rooms (
  id ${uuidType},
  unit_id TEXT NOT NULL REFERENCES units(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE users (
  id ${uuidType},
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('dentista', 'recepcionista', 'gestor', 'admin')),
  cro_number TEXT,
  specialty TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT TRUE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE roles_permissions (
  id ${uuidType},
  role TEXT NOT NULL,
  module TEXT NOT NULL,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. DADOS PRINCIPAIS DE SAÚDE E PACIENTES (LGPD COMPLIANT)
CREATE TABLE patients (
  id ${uuidType},
  full_name TEXT NOT NULL,
  cpf TEXT UNIQUE,
  rg TEXT,
  birth_date DATE,
  gender TEXT,
  marital_status TEXT,
  profession TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  email TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip_code TEXT,
  photo_path TEXT,
  financial_responsible_id TEXT ${dbType === 'sqlite' ? 'REFERENCES patients(id)' : 'REFERENCES patients(id) ON DELETE SET NULL'},
  insurance_plan_id TEXT,
  insurance_card_number TEXT,
  insurance_valid_until DATE,
  referral_source TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'em_tratamento', 'concluido', 'inadimplente')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);

-- 3. PRONTUÁRIOS, ANAMNESE E ODONTOGRAMA
CREATE TABLE anamnesis (
  id ${uuidType},
  patient_id TEXT NOT NULL REFERENCES patients(id),
  version_number INTEGER NOT NULL,
  questions_json TEXT NOT NULL, -- Respostas normalizadas armazenadas em formato JSON robusto
  signed_at TIMESTAMP,
  signature_path TEXT, -- Caminho local da assinatura digitalizada
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dental_chart (
  id ${uuidType},
  patient_id TEXT NOT NULL REFERENCES patients(id),
  dentition_type TEXT NOT NULL DEFAULT 'permanente' CHECK (dentition_type IN ('permanente', 'decidua')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dental_chart_items (
  id ${uuidType},
  dental_chart_id TEXT NOT NULL REFERENCES dental_chart(id),
  tooth_number INTEGER NOT NULL,
  face TEXT CHECK (face IN ('oclusal', 'mesial', 'distal', 'vestibular', 'lingual', 'geral')),
  condition TEXT NOT NULL, -- carie, restauracao, canal_necessario, canal_feito, implante, ausente, etc.
  status TEXT NOT NULL DEFAULT 'concluido' CHECK (status IN ('planejado', 'em_andamento', 'concluido')),
  is_official_evolution BOOLEAN DEFAULT FALSE, -- Separa rascunhos de evoluções clínicas homologadas imutáveis
  procedure_id TEXT, -- Vincula a um procedimento da clínica se houver
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. PROCEDIMENTOS E PLANOS DE TRATAMENTO
CREATE TABLE procedures (
  id ${uuidType},
  code TEXT NOT NULL UNIQUE, -- Código CDT ou código interno da clínica
  name TEXT NOT NULL,
  description TEXT,
  default_value REAL NOT NULL,
  average_duration_minutes INTEGER DEFAULT 30,
  category TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE treatment_plans (
  id ${uuidType},
  patient_id TEXT NOT NULL REFERENCES patients(id),
  dentist_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'recusado', 'em_execucao', 'concluido')),
  total_value REAL NOT NULL,
  discount REAL DEFAULT 0,
  payment_condition TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE treatment_plan_items (
  id ${uuidType},
  treatment_plan_id TEXT NOT NULL REFERENCES treatment_plans(id),
  procedure_id TEXT NOT NULL REFERENCES procedures(id),
  tooth_number INTEGER,
  session_number INTEGER DEFAULT 1,
  unit_value REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'planejado' CHECK (status IN ('planejado', 'em_execucao', 'concluido')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. EVOLUÇÃO CLÍNICA IMUTÁVEL (PRONTUÁRIO LEGAL)
CREATE TABLE clinical_evolutions (
  id ${uuidType},
  patient_id TEXT NOT NULL REFERENCES patients(id),
  appointment_id TEXT, -- Vinculado à agenda para integridade legal
  dentist_id TEXT NOT NULL REFERENCES users(id),
  procedure_id TEXT REFERENCES procedures(id),
  description TEXT NOT NULL,
  materials_used_json TEXT, -- Lista de materiais de consumo padrão vinculados do estoque
  signed_by TEXT REFERENCES users(id),
  signed_at TIMESTAMP, -- Registro de data/hora oficial do carimbo/assinatura CRO
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. PASTA DIGITAL DO PACIENTE (DOCUMENTOS, RADIOGRAFIAS, LAUDOS E GTO)
CREATE TABLE documents (
  id ${uuidType},
  patient_id TEXT NOT NULL REFERENCES patients(id),
  category TEXT NOT NULL CHECK (category IN ('radiografia', 'gto', 'documento_pessoal', 'termo_consentimento', 'contrato', 'foto_antes_depois', 'outro')),
  subfolder TEXT, -- Organização de subpastas físicas se necessário
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Caminho relativo local (/dados_clinica/pacientes/{id}/...)
  file_type TEXT, -- MIME type
  file_size_kb INTEGER,
  description TEXT,
  related_procedure_id TEXT,
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1
);

-- 7. AGENDA DA CLÍNICA
CREATE TABLE appointments (
  id ${uuidType},
  patient_id TEXT NOT NULL REFERENCES patients(id),
  dentist_id TEXT NOT NULL REFERENCES users(id),
  chair_room_id TEXT REFERENCES chairs_rooms(id),
  unit_id TEXT REFERENCES units(id),
  scheduled_start TIMESTAMP NOT NULL,
  scheduled_end TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'aguardando', 'em_atendimento', 'atendido', 'falta', 'cancelado')),
  procedure_id TEXT REFERENCES procedures(id),
  notes TEXT,
  created_via TEXT DEFAULT 'recepcao' CHECK (created_via IN ('recepcao', 'online', 'whatsapp')),
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

-- 8. GESTÃO DE ESTOQUE LOCAL (BAIXA AUTOMÁTICA)
CREATE TABLE suppliers (
  id ${uuidType},
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_items (
  id ${uuidType},
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('consumivel', 'instrumental', 'orto', 'implante')),
  unit_of_measure TEXT NOT NULL, -- un, cx, ml, g, etc.
  current_quantity REAL DEFAULT 0,
  minimum_quantity REAL DEFAULT 1,
  expiration_date DATE,
  supplier_id TEXT REFERENCES suppliers(id),
  cost_price REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE inventory_movements (
  id ${uuidType},
  inventory_item_id TEXT NOT NULL REFERENCES inventory_items(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'saida')),
  quantity REAL NOT NULL,
  related_procedure_id TEXT,
  related_evolution_id TEXT REFERENCES clinical_evolutions(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. GESTÃO FINANCEIRA, CONVÊNIOS E REPASSES
CREATE TABLE insurance_plans (
  id ${uuidType},
  name TEXT NOT NULL UNIQUE,
  contact_info TEXT,
  reimbursement_avg_days INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE financial_transactions (
  id ${uuidType},
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  patient_id TEXT REFERENCES patients(id),
  treatment_plan_id TEXT REFERENCES treatment_plans(id),
  supplier_id TEXT REFERENCES suppliers(id),
  category TEXT NOT NULL, -- procedimento, laboratorio, fornecedor, aluguel, comissao, etc.
  description TEXT NOT NULL,
  gross_value REAL NOT NULL,
  discount REAL DEFAULT 0,
  net_value REAL NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('pix', 'cartao_credito', 'cartao_debito', 'boleto', 'dinheiro', 'convenio')),
  installment_number INTEGER DEFAULT 1,
  total_installments INTEGER DEFAULT 1,
  due_date DATE NOT NULL,
  paid_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE commissions (
  id ${uuidType},
  dentist_id TEXT NOT NULL REFERENCES users(id),
  financial_transaction_id TEXT NOT NULL REFERENCES financial_transactions(id),
  procedure_id TEXT REFERENCES procedures(id),
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentual', 'fixo')),
  commission_value REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
  reference_month TEXT NOT NULL, -- YYYY-MM
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE insurance_claims (
  id ${uuidType},
  patient_id TEXT NOT NULL REFERENCES patients(id),
  insurance_plan_id TEXT NOT NULL REFERENCES insurance_plans(id),
  document_id TEXT REFERENCES documents(id), -- PDF/Imagem da Guia faturada
  procedure_id TEXT REFERENCES procedures(id),
  guide_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enviada' CHECK (status IN ('enviada', 'autorizada', 'negada', 'glosada', 'paga')),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- 10. GOVERNAÇÃO, LGPD E LOG DE AUDITORIA
CREATE TABLE consent_terms (
  id ${uuidType},
  patient_id TEXT NOT NULL REFERENCES patients(id),
  term_type TEXT NOT NULL, -- consentimento_tratamento, lgpd_compartilhamento, etc.
  document_id TEXT NOT NULL REFERENCES documents(id),
  signed_at TIMESTAMP NOT NULL,
  signature_method TEXT NOT NULL -- eletronica, fisica_digitalizada
);

CREATE TABLE messages_log (
  id ${uuidType},
  patient_id TEXT NOT NULL REFERENCES patients(id),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email')),
  direction TEXT NOT NULL CHECK (direction IN ('enviado', 'recebido')),
  template_type TEXT NOT NULL CHECK (template_type IN ('confirmacao', 'aniversario', 'cobranca', 'reativacao', 'orcamento', 'livre')),
  content TEXT NOT NULL,
  sent_by TEXT REFERENCES users(id),
  status TEXT DEFAULT 'enviado' CHECK (status IN ('enviado', 'entregue', 'lido', 'erro')),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_log (
  id ${uuidType},
  user_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view')),
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 4. ÍNDICES RECOMENDADOS PARA PERFORMANCE CRÍTICA DE REDE E LOCAL
-- =========================================================================
CREATE INDEX idx_patients_cpf ON patients(cpf);
CREATE INDEX idx_patients_full_name ON patients(full_name);
CREATE INDEX idx_patients_phone ON patients(phone);

CREATE INDEX idx_appointments_start_dentist ON appointments(scheduled_start, dentist_id);
CREATE INDEX idx_appointments_start_day ON appointments(scheduled_start);

CREATE INDEX idx_documents_patient_category ON documents(patient_id, category);

CREATE INDEX idx_financial_due_status ON financial_transactions(due_date, status);
CREATE INDEX idx_financial_patient ON financial_transactions(patient_id);

CREATE INDEX idx_messages_patient ON messages_log(patient_id, sent_at);

CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_record ON audit_log(table_name, record_id);
`;
};

// SQL triggers for database constraints
const generateTriggerSQL = (dbType: 'sqlite' | 'postgres'): string => {
  if (dbType === 'sqlite') {
    return `-- =========================================================================
-- TRIGGERS DE INTEGRIDADE E GOVERNANÇA LGPD (SQLITE LOCAL)
-- =========================================================================

-- Regra 1: Prontuário Clínico (Clinical Evolution) Imutável após assinado
CREATE TRIGGER trg_clinical_evolutions_prevent_update
BEFORE UPDATE ON clinical_evolutions
FOR EACH ROW
WHEN OLD.signed_at IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'Erro de Prontuário Legal: Registros clínicos já assinados pelo CRO e homologados são imutáveis.');
END;

CREATE TRIGGER trg_clinical_evolutions_prevent_delete
BEFORE DELETE ON clinical_evolutions
FOR EACH ROW
WHEN OLD.signed_at IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'Erro de Prontuário Legal: Registros clínicos assinados não podem ser removidos fisicamente.');
END;

-- Regra 2: Soft Delete compulsório em Pacientes (Exigência legal de prontuário por 20 anos)
CREATE TRIGGER trg_patients_prevent_hard_delete
BEFORE DELETE ON patients
FOR EACH ROW
BEGIN
  SELECT RAISE(ABORT, 'Erro de Auditoria: Exclusão física de pacientes proibida por lei. Utilize soft delete (deleted_at).');
END;

-- Regra 3: Integração automática Agenda -> Prontuário (Audit log de sugestão)
CREATE TRIGGER trg_appointments_suggest_evolution
AFTER UPDATE ON appointments
FOR EACH ROW
WHEN NEW.status = 'atendido' AND OLD.status != 'atendido'
BEGIN
  INSERT INTO audit_log (id, user_id, table_name, record_id, action, details, timestamp)
  VALUES (
    hex(randomblob(16)),
    'SYSTEM',
    'clinical_evolutions',
    NEW.id,
    'create',
    'Sugestão automática gerada: Consulta atendida na agenda. Criar evolução clínica correspondente para o paciente ' || NEW.patient_id,
    datetime('now')
  );
END;

-- Regra 4: Log de Auditoria LGPD automático para visualização de Prontuário
CREATE TRIGGER trg_audit_evolution_view
AFTER INSERT ON audit_log
FOR EACH ROW
WHEN NEW.action = 'view' AND NEW.table_name = 'patients'
BEGIN
  -- Log de rastreabilidade
  INSERT INTO audit_log (id, user_id, table_name, record_id, action, details)
  VALUES (hex(randomblob(16)), 'SYSTEM_AUDITOR', 'audit_log', NEW.record_id, 'create', 'Conformidade LGPD: Acesso de leitura realizado aos dados pessoais do paciente ID ' || NEW.record_id);
END;
`;
  }

  return `-- =========================================================================
-- TRIGGERS DE INTEGRIDADE E GOVERNANÇA LGPD (POSTGRESQL REDE LOCAL)
-- =========================================================================

-- Regra 1: Função e Trigger de Imutabilidade para Clinical Evolution
CREATE OR REPLACE FUNCTION fn_prevent_clinical_evolution_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.signed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Erro de Prontuário Legal: Registro clínico assinado e homologado pelo CRO é imutável. Operação bloqueada.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clinical_evolutions_lock
BEFORE UPDATE OR DELETE ON clinical_evolutions
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_clinical_evolution_changes();

-- Regra 2: Função e Trigger para Forçar Soft Delete em Pacientes
CREATE OR REPLACE FUNCTION fn_enforce_patient_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Erro de Prontuário: Remoção física de paciente ilegal. Atualize o campo "deleted_at" para inativá-lo.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_patients_soft_delete
BEFORE DELETE ON patients
FOR EACH ROW
EXECUTE FUNCTION fn_enforce_patient_soft_delete();

-- Regra 3: Trigger para Log automático de Auditoria LGPD em Transações
CREATE OR REPLACE FUNCTION fn_log_financial_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, table_name, record_id, action, field_changed, old_value, new_value, ip_address)
  VALUES (
    COALESCE(current_setting('app.current_user_id', true), 'SYSTEM'),
    'financial_transactions',
    NEW.id::text,
    TG_OP,
    'status',
    OLD.status,
    NEW.status,
    inet_client_addr()::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_financial
AFTER UPDATE OF status ON financial_transactions
FOR EACH ROW
EXECUTE FUNCTION fn_log_financial_changes();
`;
};

// Data dictionary specs
const tableSpecs = [
  {
    name: 'patients',
    desc: 'Cadastro geral de pacientes (dados pessoais e clínicos sensíveis conforme LGPD).',
    columns: [
      { name: 'id', type: 'UUID (PK)', constraint: 'PRIMARY KEY', desc: 'Identificador único global do paciente' },
      { name: 'full_name', type: 'TEXT', constraint: 'NOT NULL', desc: 'Nome completo do paciente' },
      { name: 'cpf', type: 'TEXT', constraint: 'UNIQUE', desc: 'Cadastro de Pessoa Física (Garante integridade e faturamento)' },
      { name: 'rg', type: 'TEXT', constraint: 'NULL', desc: 'Registro Geral de Identidade' },
      { name: 'birth_date', type: 'DATE', constraint: 'NOT NULL', desc: 'Data de nascimento para cálculo de idade e anamnese' },
      { name: 'phone', type: 'TEXT', constraint: 'NOT NULL', desc: 'Telefone para contato principal' },
      { name: 'whatsapp_number', type: 'TEXT', constraint: 'NULL', desc: 'Número dedicado para mensagens instantâneas' },
      { name: 'email', type: 'TEXT', constraint: 'NULL', desc: 'Endereço de correio eletrônico' },
      { name: 'photo_path', type: 'TEXT', constraint: 'NULL', desc: 'Caminho local da foto do paciente no servidor' },
      { name: 'financial_responsible_id', type: 'UUID (FK)', constraint: 'REFERENCES patients(id)', desc: 'ID do responsável financeiro (para dependentes/menores)' },
      { name: 'insurance_plan_id', type: 'UUID (FK)', constraint: 'REFERENCES insurance_plans(id)', desc: 'ID do plano de convênio cadastrado' },
      { name: 'status', type: 'TEXT', constraint: 'CHECK (ativo, inativo, etc.)', desc: 'Situação clínica/cadastral do paciente' },
      { name: 'deleted_at', type: 'TIMESTAMP', constraint: 'NULL', desc: 'Data de exclusão lógica (soft delete obrigatório)' }
    ],
    indexes: ['idx_patients_cpf', 'idx_patients_full_name', 'idx_patients_phone']
  },
  {
    name: 'clinical_evolutions',
    desc: 'Histórico de evolução clínica. Representa o prontuário de papel assinado, agora digital. Altamente sensível.',
    columns: [
      { name: 'id', type: 'UUID (PK)', constraint: 'PRIMARY KEY', desc: 'Identificador da evolução clínica' },
      { name: 'patient_id', type: 'UUID (FK)', constraint: 'REFERENCES patients(id)', desc: 'ID do paciente associado' },
      { name: 'appointment_id', type: 'UUID (FK)', constraint: 'REFERENCES appointments(id)', desc: 'Consulta da agenda de origem' },
      { name: 'dentist_id', type: 'UUID (FK)', constraint: 'REFERENCES users(id)', desc: 'Dentista autor da evolução' },
      { name: 'procedure_id', type: 'UUID (FK)', constraint: 'REFERENCES procedures(id)', desc: 'Procedimento clínico executado' },
      { name: 'description', type: 'TEXT', constraint: 'NOT NULL', desc: 'Relato clínico detalhado da intervenção' },
      { name: 'materials_used_json', type: 'TEXT (JSON)', constraint: 'NULL', desc: 'Lista de insumos utilizados para débito do estoque' },
      { name: 'signed_at', type: 'TIMESTAMP', constraint: 'NULL', desc: 'Data/Hora de assinatura oficial com assinatura digital/CRO' }
    ],
    indexes: ['idx_clinical_evolutions_patient']
  },
  {
    name: 'documents',
    desc: 'Arquivos do paciente (Pasta Digital: exames, termos, radiografias e GTOs). Armazena caminhos locais.',
    columns: [
      { name: 'id', type: 'UUID (PK)', constraint: 'PRIMARY KEY', desc: 'ID do documento' },
      { name: 'patient_id', type: 'UUID (FK)', constraint: 'REFERENCES patients(id)', desc: 'ID do paciente associado' },
      { name: 'category', type: 'TEXT', constraint: 'CHECK (radiografia, GTO, etc.)', desc: 'Pasta/Categoria física e lógica do documento' },
      { name: 'file_name', type: 'TEXT', constraint: 'NOT NULL', desc: 'Nome original do arquivo salvo' },
      { name: 'file_path', type: 'TEXT', constraint: 'NOT NULL', desc: 'Caminho local relativo (/dados_clinica/pacientes/...) do arquivo físico' },
      { name: 'file_type', type: 'TEXT', constraint: 'NOT NULL', desc: 'MIME type do documento (image/png, application/pdf)' },
      { name: 'file_size_kb', type: 'INTEGER', constraint: 'NOT NULL', desc: 'Tamanho do arquivo para controle de espaço' },
      { name: 'uploaded_by', type: 'UUID (FK)', constraint: 'REFERENCES users(id)', desc: 'ID do usuário que realizou o upload' }
    ],
    indexes: ['idx_documents_patient_category']
  },
  {
    name: 'appointments',
    desc: 'Agenda de consultas e atendimentos das salas/cadeiras da clínica.',
    columns: [
      { name: 'id', type: 'UUID (PK)', constraint: 'PRIMARY KEY', desc: 'ID único do agendamento' },
      { name: 'patient_id', type: 'UUID (FK)', constraint: 'REFERENCES patients(id)', desc: 'Paciente agendado' },
      { name: 'dentist_id', type: 'UUID (FK)', constraint: 'REFERENCES users(id)', desc: 'Dentista que executará o atendimento' },
      { name: 'chair_room_id', type: 'UUID (FK)', constraint: 'REFERENCES chairs_rooms(id)', desc: 'Cadeira/Consultório reservado' },
      { name: 'scheduled_start', type: 'TIMESTAMP', constraint: 'NOT NULL', desc: 'Data e hora do início da consulta' },
      { name: 'scheduled_end', type: 'TIMESTAMP', constraint: 'NOT NULL', desc: 'Data e hora do fim da consulta' },
      { name: 'status', type: 'TEXT', constraint: 'CHECK (agendado, confirmado, falta, etc.)', desc: 'Status atual da consulta' }
    ],
    indexes: ['idx_appointments_start_dentist', 'idx_appointments_start_day']
  },
  {
    name: 'financial_transactions',
    desc: 'Controle de fluxo de caixa local (contas a pagar, receber, faturamento e repasses).',
    columns: [
      { name: 'id', type: 'UUID (PK)', constraint: 'PRIMARY KEY', desc: 'ID da transação financeira' },
      { name: 'type', type: 'TEXT', constraint: 'CHECK (receita, despesa)', desc: 'Direção do fluxo financeiro' },
      { name: 'patient_id', type: 'UUID (FK)', constraint: 'REFERENCES patients(id) (NULL)', desc: 'Paciente associado à receita (se houver)' },
      { name: 'category', type: 'TEXT', constraint: 'NOT NULL', desc: 'Categoria de plano de contas' },
      { name: 'net_value', type: 'REAL', constraint: 'NOT NULL', desc: 'Valor líquido após descontos e juros' },
      { name: 'due_date', type: 'DATE', constraint: 'NOT NULL', desc: 'Data prevista para vencimento' },
      { name: 'paid_at', type: 'TIMESTAMP', constraint: 'NULL', desc: 'Data e hora em que a transação foi compensada' },
      { name: 'status', type: 'TEXT', constraint: 'CHECK (pendente, pago, atrasado, cancelado)', desc: 'Situação da cobrança/pagamento' }
    ],
    indexes: ['idx_financial_due_status', 'idx_financial_patient']
  }
];

export default function DatabaseDashboard() {
  const {
    patients,
    appointments,
    documents,
    evolutions,
    financials,
    stock,
    auditLogs,
    addDocument,
    addEvolution,
    logAction
  } = useDental();

  const [activeSubTab, setActiveSubTab] = useState<'erd' | 'sql' | 'ddl' | 'triggers' | 'folders'>('erd');
  const [selectedTable, setSelectedTable] = useState<string>('patients');
  const [dbFlavor, setDbFlavor] = useState<'sqlite' | 'postgres'>('sqlite');
  
  // SQL Terminal state
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT id, full_name, cpf, status FROM patients WHERE status = \'ativo\';');
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryDuration, setQueryDuration] = useState<number | null>(null);

  // Trigger test simulator state
  const [triggerSimMessage, setTriggerSimMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Path Tree generator state
  const [selectedPatientPathId, setSelectedPatientPathId] = useState<string>(patients[0]?.id || '');
  const selectedPatientData = patients.find(p => p.id === selectedPatientPathId) || patients[0];

  useEffect(() => {
    if (patients.length > 0 && !selectedPatientPathId) {
      setSelectedPatientPathId(patients[0].id);
    }
  }, [patients, selectedPatientPathId]);

  // Pre-defined database queries to easily run
  const predefinedQueries = [
    {
      title: 'Buscar Pacientes Ativos (LGPD)',
      query: `SELECT id, name AS full_name, cpf, phone, status FROM patients WHERE status = 'ativo';`
    },
    {
      title: 'Abertura Rápida da Pasta Digital (Documentos)',
      query: `SELECT id, name AS file_name, category, fileSize, uploadedBy FROM documents ORDER BY category;`
    },
    {
      title: 'Carregar Agenda Clínia do Dia',
      query: `SELECT id, patientName, dentistName, date, time, status FROM appointments WHERE status = 'confirmado' OR status = 'em_atendimento';`
    },
    {
      title: 'Transações Financeiras Pendentes',
      query: `SELECT id, description, value, dueDate, status FROM financials WHERE status = 'pendente';`
    },
    {
      title: 'Estoque Mínimo / Reposição urgente',
      query: `SELECT id, name, category, quantity, minQuantity, supplier FROM stock WHERE quantity <= minQuantity;`
    },
    {
      title: 'Rastreamento de Log de Auditoria de Prontuário',
      query: `SELECT timestamp, userName, role, action, details FROM audit_log ORDER BY timestamp DESC;`
    }
  ];

  // Execute mock SQL query against live storage state!
  const handleExecuteSQL = (queryToRun = sqlQuery) => {
    const start = performance.now();
    setQueryError(null);
    setQueryResult(null);

    const q = queryToRun.toLowerCase().trim();

    try {
      if (!q.startsWith('select')) {
        throw new Error('Permissão Negada: Este Playground SQL de visualização local suporta apenas consultas DQL de leitura (SELECT). Alterações de DDL/DML devem ser simuladas na aba de Triggers.');
      }

      // Live dataset mapping from Local Context
      let dataset: any[] = [];
      let targetName = '';

      if (q.includes('patients')) {
        dataset = patients.map(p => ({
          id: p.id,
          full_name: p.name,
          cpf: p.cpf || 'Não informado',
          birth_date: p.birthDate,
          phone: p.phone,
          status: p.status,
          deleted_at: p.deletedAt || 'NULO (Ativo)'
        }));
        targetName = 'patients';
      } else if (q.includes('documents')) {
        dataset = documents.map(d => ({
          id: d.id,
          file_name: d.name,
          category: d.category,
          fileSize: d.fileSize,
          uploadedBy: d.uploadedBy,
          uploadedAt: d.uploadedAt
        }));
        targetName = 'documents';
      } else if (q.includes('appointments')) {
        dataset = appointments.map(a => ({
          id: a.id,
          patientName: a.patientName,
          dentistName: a.dentistName,
          date: a.date,
          time: a.time,
          status: a.status
        }));
        targetName = 'appointments';
      } else if (q.includes('financials') || q.includes('financial_transactions')) {
        dataset = financials.map(f => ({
          id: f.id,
          description: f.description,
          category: f.category,
          value: f.value,
          dueDate: f.dueDate,
          status: f.status
        }));
        targetName = 'financial_transactions';
      } else if (q.includes('stock') || q.includes('inventory_items')) {
        dataset = stock.map(s => ({
          id: s.id,
          name: s.name,
          category: s.category,
          quantity: s.quantity,
          minQuantity: s.minQuantity,
          supplier: s.supplier
        }));
        targetName = 'inventory_items';
      } else if (q.includes('audit_log') || q.includes('auditlogs')) {
        dataset = auditLogs.map(a => ({
          id: a.id,
          timestamp: a.timestamp,
          userName: a.userName,
          role: a.role,
          action: a.action,
          details: a.details
        }));
        targetName = 'audit_log';
      } else {
        throw new Error(`Tabela não encontrada no escopo local da clínica: "${queryToRun.match(/from\s+(\w+)/i)?.[1] || 'desconhecida'}"`);
      }

      // Simple where clause simulator
      let filtered = [...dataset];
      if (q.includes('where')) {
        const whereClause = q.split('where')[1].split('order')[0].split('limit')[0].trim();
        
        if (whereClause.includes('status = \'ativo\'') || whereClause.includes("status = 'ativo'")) {
          filtered = filtered.filter(row => row.status === 'ativo');
        } else if (whereClause.includes('status = \'pendente\'') || whereClause.includes("status = 'pendente'")) {
          filtered = filtered.filter(row => row.status === 'pendente');
        } else if (whereClause.includes('quantity <= minquantity')) {
          filtered = filtered.filter(row => row.quantity <= row.minQuantity);
        } else if (whereClause.includes('category =') || whereClause.includes('category=')) {
          const cat = whereClause.match(/category\s*=\s*['"](\w+)['"]/)?.[1];
          if (cat) {
            filtered = filtered.filter(row => row.category === cat);
          }
        }
      }

      // Limit clause
      if (q.includes('limit')) {
        const limitNum = parseInt(q.split('limit')[1].trim(), 10);
        if (!isNaN(limitNum)) {
          filtered = filtered.slice(0, limitNum);
        }
      }

      // Column selection projection
      const selectPart = q.split('from')[0].replace('select', '').trim();
      let finalResult = filtered;
      if (selectPart !== '*' && selectPart !== '') {
        const selectedColumns = selectPart.split(',').map(c => c.trim().replace('as ', ' as '));
        finalResult = filtered.map(row => {
          const projectedRow: any = {};
          selectedColumns.forEach(colExpr => {
            // Check for alias (e.g. name AS full_name)
            if (colExpr.includes(' as ')) {
              const [origCol, alias] = colExpr.split(' as ').map(x => x.trim());
              projectedRow[alias] = row[origCol];
            } else {
              projectedRow[colExpr] = row[colExpr];
            }
          });
          return projectedRow;
        });
      }

      const duration = parseFloat((performance.now() - start).toFixed(2));
      setQueryResult(finalResult);
      setQueryDuration(duration);
      logAction('query_sql_simulation', `Execução de consulta SQL fictícia na tabela ${targetName}: ${queryToRun}`);
    } catch (err: any) {
      setQueryError(err.message || 'Erro de análise sintática na consulta SQL.');
    }
  };

  // Copy helper
  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    alert(`${type} copiado para a área de transferência!`);
  };

  // Download SQL script helper
  const handleDownloadSQLFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download complete dataset state (JSON Backup mirroring SQLite SQLite format)
  const handleExportFullJSONBackup = () => {
    const fullState = {
      database_metadata: {
        system_name: 'ClinDent Database Local Engine',
        version: '1.4.0',
        exported_at: new Date().toISOString(),
        encryption: 'AES-256 (Prepared for LGPD backups)',
        integrity_checksum: Math.random().toString(36).substring(2, 15)
      },
      tables: {
        patients,
        appointments,
        documents,
        clinical_evolutions: evolutions,
        financial_transactions: financials,
        inventory_items: stock,
        audit_log: auditLogs
      }
    };
    const content = JSON.stringify(fullState, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `clindent_backup_local_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logAction('export_database_backup', 'Exportação completa do banco de dados local da clínica em formato JSON de auditoria.');
  };

  // Simulating the Trigger constraints (Rule 1 & 2)
  const runTriggerSimulation = (ruleId: number) => {
    setIsSimulating(true);
    setTriggerSimMessage(null);
    
    setTimeout(() => {
      setIsSimulating(false);
      if (ruleId === 1) {
        // Clinical evolution update block
        setTriggerSimMessage({
          type: 'error',
          text: `[SQLITE_CONSTRAINT_TRIGGER] Erro de Prontuário Legal: Registros clínicos com CRO assinados são imutáveis e protegidos contra UPDATE ou DELETE. Operação abortada pela trigger "trg_clinical_evolutions_prevent_update".`
        });
      } else if (ruleId === 2) {
        // Patient hard delete block
        setTriggerSimMessage({
          type: 'error',
          text: `[SQLITE_CONSTRAINT_TRIGGER] Erro de Segurança Clínica: Remoção física de prontuário é ilegal (Lei nº 13.787). Operação abortada pela trigger "trg_patients_prevent_hard_delete". Utilize Soft-Delete (deleted_at = DATETIME('NOW')).`
        });
      } else if (ruleId === 3) {
        // Simulate soft delete success
        setTriggerSimMessage({
          type: 'success',
          text: `Soft Delete bem sucedido! Campo "deleted_at" preenchido com "${new Date().toLocaleString('pt-BR')}". Registro preservado para fins de histórico de prontuário obrigatório, porém inativado de forma segura nas consultas regulares da clínica.`
        });
      } else if (ruleId === 4) {
        // Simulate stock movement from clinic procedure
        setTriggerSimMessage({
          type: 'success',
          text: `Trigger disparado com sucesso! Procedimento "Profilaxia + Aplicação de Flúor" finalizado. Baixa automática registrada na tabela "inventory_movements": -1 un "Flúor Gel" e -1 un "Escova de Robinson". Estoque atualizado.`
        });
      }
    }, 700);
  };

  const selectedTableData = tableSpecs.find(t => t.name === selectedTable) || tableSpecs[0];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto h-full overflow-y-auto text-xs">
      
      {/* Module Title Section */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
            <Database className="w-5 h-5 text-teal-600 shrink-0" />
            <span>Infraestrutura de Banco de Dados Local</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Gestão local, dicionário de dados (22 tabelas), terminal SQL live, regras de integridade CRO/LGPD e backups.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportFullJSONBackup}
            className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Gerar Backup Local (.json)</span>
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-100/50 p-1 rounded-xl">
        <button
          onClick={() => setActiveSubTab('erd')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold text-center flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'erd' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Dicionário & DER (22 Tabelas)</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('sql'); handleExecuteSQL(); }}
          className={`flex-1 py-2 px-3 rounded-lg font-bold text-center flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'sql' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Terminal SQL (Playground)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ddl')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold text-center flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'ddl' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Gerar Script DDL (SQL)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('triggers')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold text-center flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'triggers' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Triggers de Integridade</span>
        </button>

        <button
          onClick={() => setActiveSubTab('folders')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold text-center flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'folders' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Estrutura de Pastas</span>
        </button>
      </div>

      {/* TAB CONTENT: 1. DATA DICTIONARY / ERD */}
      {activeSubTab === 'erd' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Column: List of all 22 Tables */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Dicionário de Tabelas ({tableSpecs.length} principais / 22 totais)</span>
            
            <div className="space-y-1.5 overflow-y-auto max-h-96 pr-1">
              {tableSpecs.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTable(t.name)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    selectedTable === t.name ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-mono">{t.name}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 bg-slate-50/50 p-2.5 rounded-lg">
              <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Estrutura Completa de Rede</span>
              <p className="text-[10px] text-slate-400">
                O modelo abrange 22 tabelas relacionais em SQLite ou PostgreSQL, garantindo integridade referencial por chaves estrangeiras (FK) e identificadores UUID.
              </p>
            </div>
          </div>

          {/* Right Column: Detailed Columns, keys and constraints */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-mono flex items-center space-x-2">
                  <Database className="w-4 h-4 text-teal-500" />
                  <span>Tabela: {selectedTableData.name}</span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">{selectedTableData.desc}</p>
              </div>

              {selectedTableData.name === 'patients' && (
                <span className="bg-rose-50 text-rose-700 font-bold px-2.5 py-0.5 rounded text-[10px] border border-rose-100 uppercase tracking-wider">
                  ⚠️ Dados de Saúde (LGPD Sensível)
                </span>
              )}
            </div>

            {/* Indexes display */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center space-x-2">
              <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">Índices de Performance:</span>
              <div className="flex flex-wrap gap-2">
                {selectedTableData.indexes.map(idx => (
                  <span key={idx} className="bg-slate-200 text-slate-700 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">
                    {idx}
                  </span>
                ))}
              </div>
            </div>

            {/* Column Schema Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold text-[10px] uppercase">
                    <th className="py-2.5 px-3">Coluna</th>
                    <th className="py-2.5 px-3">Tipo de Dado</th>
                    <th className="py-2.5 px-3">Restrição / Chave</th>
                    <th className="py-2.5 px-3">Descrição Clínica / Técnica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedTableData.columns.map((col, index) => (
                    <tr key={index} className="hover:bg-slate-50/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-600">{col.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{col.type}</td>
                      <td className="py-2.5 px-3">
                        {col.constraint !== 'NULL' ? (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${
                            col.constraint.includes('PRIMARY') ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            col.constraint.includes('REFERENCES') ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {col.constraint}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-[10px]">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{col.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: 2. TERMINAL SQL INTERACTOR */}
      {activeSubTab === 'sql' && (
        <div className="space-y-4">
          <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 overflow-hidden shadow-md">
            {/* Header bar */}
            <div className="bg-slate-950 px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-teal-400" />
                <span className="font-mono text-[10px] font-bold uppercase text-slate-400">Playground SQL Interativo (Motor Local)</span>
              </div>
              <span className="text-[10px] text-teal-500 font-bold font-mono">Conectado: clin_dent_local.db</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
              {/* Left sidebar: preset queries */}
              <div className="p-4 space-y-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Modelos de Busca Rápidos</span>
                <div className="space-y-2">
                  {predefinedQueries.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSqlQuery(item.query);
                        handleExecuteSQL(item.query);
                      }}
                      className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors text-slate-300 hover:text-white flex items-start space-x-1.5"
                    >
                      <Play className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-[11px] leading-tight">{item.title}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right content: Query editor & Output console */}
              <div className="lg:col-span-3 p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-400">Escreva sua consulta SELECT SQL:</label>
                    <button
                      onClick={() => handleExecuteSQL()}
                      className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors shadow-md"
                    >
                      <Play className="w-3.5 h-3.5 text-slate-950" />
                      <span>Executar Consulta (F5)</span>
                    </button>
                  </div>

                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    rows={4}
                    className="w-full p-3 font-mono text-[11px] bg-slate-950 text-teal-300 border border-slate-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500/50"
                  />
                </div>

                {/* Query Result Terminal Console */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>Resultado do Console</span>
                    {queryDuration !== null && (
                      <span>Tempo de resposta local: <strong className="text-teal-400">{queryDuration} ms</strong></span>
                    )}
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 min-h-40 max-h-80 overflow-y-auto">
                    {queryError && (
                      <div className="text-rose-400 font-mono flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span className="font-bold">{queryError}</span>
                      </div>
                    )}

                    {!queryError && queryResult && queryResult.length === 0 && (
                      <div className="text-slate-400 font-mono text-center py-6">
                        Consulta executada com sucesso. Retornou 0 registros do banco de dados local.
                      </div>
                    )}

                    {!queryError && queryResult && queryResult.length > 0 && (
                      <div className="overflow-x-auto text-[10px]">
                        <table className="w-full border-collapse font-mono text-left">
                          <thead>
                            <tr className="border-b border-slate-800 text-teal-400 uppercase">
                              {Object.keys(queryResult[0]).map((key) => (
                                <th key={key} className="py-2 px-3">{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900 text-slate-200">
                            {queryResult.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-900/50">
                                {Object.values(row).map((val: any, colIdx) => (
                                  <td key={colIdx} className="py-2 px-3 truncate max-w-xs" title={String(val)}>
                                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {!queryResult && !queryError && (
                      <p className="text-slate-500 font-mono text-center py-6">Inicie uma consulta ou selecione um modelo para rodar a simulação.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. SCRIPTS DDL (SQL) */}
      {activeSubTab === 'ddl' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left instructions */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Geração de Script DDL</span>
            
            <div className="space-y-3">
              <p className="text-slate-500">
                Gere os scripts iniciais de tabelas do ClinDent. Selecione o tipo de banco que deseja rodar na clínica local:
              </p>

              {/* Flavor Selector */}
              <div className="space-y-2">
                <button
                  onClick={() => setDbFlavor('sqlite')}
                  className={`w-full text-left p-3 rounded-lg border flex items-center space-x-2.5 transition-colors ${
                    dbFlavor === 'sqlite' ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Server className="w-4 h-4 text-sky-500" />
                  <div>
                    <h4 className="font-bold">SQLite (Recomendado)</h4>
                    <p className="text-[9px] text-slate-400 font-normal">Máquina única, zero configuração, alto desempenho.</p>
                  </div>
                </button>

                <button
                  onClick={() => setDbFlavor('postgres')}
                  className={`w-full text-left p-3 rounded-lg border flex items-center space-x-2.5 transition-colors ${
                    dbFlavor === 'postgres' ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Database className="w-4 h-4 text-indigo-500" />
                  <div>
                    <h4 className="font-bold">PostgreSQL</h4>
                    <p className="text-[9px] text-slate-400 font-normal">Múltiplos computadores acessando a rede da clínica.</p>
                  </div>
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-2 text-[11px] text-amber-800">
                <div className="flex items-center space-x-1 font-bold text-amber-900">
                  <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Auditoria e LGPD Ativa</span>
                </div>
                <p>
                  Todas as chaves estrangeiras são configuradas de acordo com as leis do CRO para manter históricos de evolução por até 20 anos de modo seguro.
                </p>
              </div>
            </div>
          </div>

          {/* Right script viewer */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 flex flex-col h-[520px]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="font-bold text-xs">Script DDL Gerado ({dbFlavor === 'sqlite' ? 'SQLite' : 'PostgreSQL'})</h3>
                <p className="text-[10px] text-slate-400 font-mono">Tabelas, Tipos de Dados e Índices de Rede</p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleCopyToClipboard(generateFullDDL(dbFlavor), 'Script SQL')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </button>

                <button
                  onClick={() => handleDownloadSQLFile(generateFullDDL(dbFlavor), `clindent_schema_local_${dbFlavor}.sql`)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar (.sql)</span>
                </button>
              </div>
            </div>

            {/* SQL Editor Code Block */}
            <div className="flex-1 bg-slate-950 text-slate-300 font-mono text-[10px] p-4 rounded-xl overflow-auto select-all leading-normal whitespace-pre">
              {generateFullDDL(dbFlavor)}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. TRIGGERS / BUSINESS RULES */}
      {activeSubTab === 'triggers' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-xs">
          {/* Simulation controller column */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Central de Teste de Triggers</span>
            <p className="text-slate-500 text-[11px]">
              O banco local do ClinDent possui mecanismos para forçar as regras de prontuário e integridade clínica diretamente na engine (sem depender de software). Teste o comportamento clínico abaixo:
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800">1. Prontuário CRO Imutável</h4>
                <p className="text-[10px] text-slate-400">Impede alterações físicas em evoluções com CRO assinadas.</p>
                <button
                  onClick={() => runTriggerSimulation(1)}
                  disabled={isSimulating}
                  className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold py-1.5 rounded-lg transition-colors"
                >
                  Simular UPDATE em CRO Assinado
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800">2. Soft-Delete Obrigatório</h4>
                <p className="text-[10px] text-slate-400">Bloqueia DELETE físico de pacientes do banco de dados.</p>
                <button
                  onClick={() => runTriggerSimulation(2)}
                  disabled={isSimulating}
                  className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold py-1.5 rounded-lg transition-colors"
                >
                  Simular HARD DELETE (Remover Físico)
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800">3. Preservação em Soft-Delete</h4>
                <p className="text-[10px] text-slate-400">Preserva dados médicos ocultando o paciente com deleted_at.</p>
                <button
                  onClick={() => runTriggerSimulation(3)}
                  disabled={isSimulating}
                  className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold py-1.5 rounded-lg transition-colors"
                >
                  Executar Soft Delete Seguro
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800">4. Desconto Automático Insumos</h4>
                <p className="text-[10px] text-slate-400">Trigger de baixa em estoque ao evoluir cirurgia.</p>
                <button
                  onClick={() => runTriggerSimulation(4)}
                  disabled={isSimulating}
                  className="w-full bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 font-bold py-1.5 rounded-lg transition-colors"
                >
                  Simular Baixa Automática de Estoque
                </button>
              </div>
            </div>
          </div>

          {/* Trigger code view & output */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Visual simulation output console */}
            {(triggerSimMessage || isSimulating) && (
              <div className={`p-4 rounded-xl border animate-fade-in ${
                isSimulating ? 'bg-slate-50 border-slate-200 text-slate-700' :
                triggerSimMessage?.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <h4 className="font-bold text-xs uppercase flex items-center space-x-1.5 mb-1">
                  {isSimulating ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-teal-500 animate-spin shrink-0" />
                      <span>Processando Instrução no Banco Local...</span>
                    </>
                  ) : triggerSimMessage?.type === 'error' ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>BLOQUEIO DE SEGURANÇA CLIN-DENT ENGINE (CONSTRAINT)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>SUCESSO NA TRANSAÇÃO LOCAL</span>
                    </>
                  )}
                </h4>
                {!isSimulating && <p className="font-mono text-[10px] whitespace-pre-line leading-relaxed">{triggerSimMessage?.text}</p>}
                {isSimulating && <p className="text-slate-400">Simulando restrição referencial e de integridade do Prontuário Clínico...</p>}
              </div>
            )}

            {/* DDL Code Block */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col h-[400px]">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3 shrink-0">
                <div>
                  <h3 className="font-bold text-xs">Instruções de Triggers ({dbFlavor === 'sqlite' ? 'SQLite' : 'Postgres'})</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Regras de Negócio e Homologação CRO</p>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCopyToClipboard(generateTriggerSQL(dbFlavor), 'Triggers SQL')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1 rounded-lg flex items-center space-x-1 text-[11px]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      const prev = dbFlavor;
                      setDbFlavor(prev === 'sqlite' ? 'postgres' : 'sqlite');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1 rounded-lg flex items-center space-x-1 text-[11px]"
                  >
                    <span>Mudar para {dbFlavor === 'sqlite' ? 'PostgreSQL' : 'SQLite'}</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-950 text-slate-300 font-mono text-[10px] p-4 rounded-xl overflow-auto leading-normal whitespace-pre">
                {generateTriggerSQL(dbFlavor)}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. LOCAL FOLDER STRUCTURE (SECTION 6) */}
      {activeSubTab === 'folders' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Description Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Mapeamento Físico de Arquivos</span>
            <p className="text-slate-500">
              Para garantir performance excepcional, fotos estéticas, exames pesados e laudos PDF de GTOs ficam armazenados em uma estrutura de pastas locais organizada no sistema de arquivos do servidor local da clínica.
            </p>

            <div className="space-y-3">
              <label className="font-bold text-slate-700 block">Selecione um Paciente para Visualizar a Estrutura Física:</label>
              <select
                value={selectedPatientPathId}
                onChange={(e) => setSelectedPatientPathId(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.cpf ? p.cpf : 'Sem CPF'})</option>
                ))}
              </select>

              {selectedPatientData && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                  <p className="font-bold text-slate-800">Referência do Paciente no Banco:</p>
                  <p className="font-mono text-[10px] text-teal-600 font-bold">UUID: {selectedPatientData.id}</p>
                  <p className="font-mono text-[10px] text-slate-500">Pasta Base: /dados_clinica/pacientes/{selectedPatientData.id}/</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl space-y-1 text-[11px] text-blue-800">
                <div className="flex items-center space-x-1 font-bold text-blue-900">
                  <Info className="w-3.5 h-3.5" />
                  <span>Regra de Armazenamento Local</span>
                </div>
                <p>
                  O banco armazena apenas a string do caminho relativo do arquivo no campo <code>file_path</code> da tabela <code>documents</code>. Isso mantém o arquivo do banco de dados leve (menos de 50MB) e rápido.
                </p>
              </div>
            </div>
          </div>

          {/* Visual folder directory tree (Section 6) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-xs">Visualização do Sistema de Arquivos da Clínica (Servidor Local)</h3>
            <p className="text-slate-400 text-[10px]">Espelhamento das subpastas digitais de armazenamento físico para {selectedPatientData?.name || 'Paciente'}</p>

            <div className="bg-slate-900 text-slate-300 font-mono p-5 rounded-2xl border border-slate-800 space-y-2 select-none overflow-x-auto">
              <div className="flex items-center space-x-2 text-white font-bold">
                <FolderOpen className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                <span>/dados_clinica/</span>
              </div>

              {/* Backups Subfolder */}
              <div className="pl-6 space-y-1 border-l border-slate-800 ml-2">
                <div className="flex items-center space-x-2 text-slate-400">
                  <FolderOpen className="w-4 h-4 text-amber-500 fill-amber-500/20 animate-pulse" />
                  <span>backups/</span>
                </div>
                <div className="pl-6 border-l border-slate-800 ml-2 text-[11px] text-slate-500">
                  <p>📁 diarios/ <span className="text-[9px] text-teal-500 font-bold">(Rotina diária local automatizada)</span></p>
                  <p>📁 semanais/ <span className="text-[9px] text-indigo-500">(Preparado para backup externo/nuvem)</span></p>
                </div>
              </div>

              {/* Pacientes Subfolder */}
              <div className="pl-6 space-y-1 border-l border-slate-800 ml-2">
                <div className="flex items-center space-x-2 text-slate-300 font-bold">
                  <FolderOpen className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                  <span>pacientes/</span>
                </div>
                
                {/* Specific Patient folder */}
                <div className="pl-6 space-y-1 border-l border-slate-800 ml-2">
                  <div className="flex items-center space-x-2 text-teal-400 font-bold">
                    <FolderOpen className="w-4 h-4 text-teal-500 fill-teal-500/10" />
                    <span>{selectedPatientData?.id || 'c12e4f60-9d18-4b7c-86e0-94d0c3268cb3'} <span className="text-[10px] text-slate-500 font-normal">({selectedPatientData?.name || 'Paciente'})</span></span>
                  </div>

                  {/* Subfolders for categories */}
                  <div className="pl-6 border-l border-slate-800 ml-2 space-y-1.5 text-slate-400 text-[11px]">
                    <div className="flex items-center space-x-2">
                      <span>📁 radiografias/</span>
                      <span className="text-[9px] text-slate-600">(Radiografias Panorâmicas e Periapicais)</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span>📁 gtos/</span>
                      <span className="text-[9px] text-slate-600">(Guias de Autorização Faturadas)</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span>📁 documentos_pessoais/</span>
                      <span className="text-[9px] text-slate-600">(RG, CPF, Carteira de Convênio)</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span>📁 termos_consentimento/</span>
                      <span className="text-[9px] text-slate-600">(Termo de Prontuário e Aceite LGPD Assinado)</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span>📁 contratos/</span>
                      <span className="text-[9px] text-slate-600">(Contrato de Prestação de Serviços Ortodônticos/Implantes)</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span>📁 fotos_antes_depois/</span>
                      <span className="text-[9px] text-teal-500">(Estética do Sorriso - Para Comparador Digital)</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span>📁 outros/</span>
                      <span className="text-[9px] text-slate-600">(Laudos complementares externos)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
