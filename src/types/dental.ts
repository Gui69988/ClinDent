/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PatientStatus = 'ativo' | 'inativo' | 'em_tratamento' | 'concluido' | 'inadimplente';

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  rg: string;
  birthDate: string;
  gender: string;
  maritalStatus: string;
  profession: string;
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  phone: string;
  email: string;
  photoUrl?: string;
  responsibleName?: string;
  responsibleCpf?: string;
  insuranceName?: string; // Convênio
  insuranceCardNumber?: string;
  insuranceValidity?: string;
  referralSource: string; // Indicação (Google, Instagram, Indicação de Amigo, etc.)
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface AnamneseHistory {
  updatedAt: string;
  updatedBy: string;
  changes: string;
}

export interface Anamnese {
  patientId: string;
  allergies: string;
  medicationsInUse: string;
  preExistingDiseases: string[]; // diabetes, hipertensao, cardiaca, gestante, anticoagulantes, etc.
  heartProblems: boolean;
  isPregnant: boolean;
  usesAnticoagulant: boolean;
  additionalNotes?: string;
  patientSignature?: string; // Base64 signature
  signatureDate?: string;
  history: AnamneseHistory[];
}

export type ToothFaceState = 'none' | 'carie' | 'restaurado' | 'planejado' | 'extraido' | 'canal_necessario' | 'canal_feito';

export interface ToothState {
  toothNumber: number; // 11-18, 21-28, 31-38, 41-48, 51-55, 61-65, 71-75, 81-85
  faces: {
    oclusal: ToothFaceState; // Also incisal
    mesial: ToothFaceState;
    distal: ToothFaceState;
    vestibular: ToothFaceState;
    lingual: ToothFaceState; // Also palatina
  };
  anomalies: ('ausente' | 'implante' | 'protese' | 'coroa' | 'none')[];
  notes?: string;
}

export interface ClinicalEvolution {
  id: string;
  patientId: string;
  date: string;
  dentistId: string;
  dentistName: string;
  dentistCro: string;
  procedurePerformed: string;
  materialsUsed: string[];
  clinicalNotes: string;
  signatureBase64?: string;
  isLocked: boolean; // Evoluções clínicas homologadas são imutáveis
}

export interface DocumentFile {
  id: string;
  patientId: string;
  name: string;
  category: 'radiografias' | 'gto' | 'pessoais' | 'contratos' | 'antes_depois';
  url: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
  version: number;
  notes?: string;
}

export interface BudgetProcedure {
  id: string;
  toothNumber?: number;
  face?: string;
  procedureName: string;
  value: number;
  status: 'planejado' | 'em_execucao' | 'concluido';
}

export interface Budget {
  id: string;
  patientId: string;
  title: string;
  procedures: BudgetProcedure[];
  discountPercent: number;
  installments: number;
  totalValue: number;
  paymentMethod: string;
  status: 'pendente' | 'aprovado' | 'recusado' | 'concluido';
  createdAt: string;
  approvedAt?: string;
  signatureBase64?: string; // Aceite digital
}

export type AppointmentStatus = 'confirmado' | 'aguardando_confirmacao' | 'em_atendimento' | 'atendido' | 'falta' | 'cancelado';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  dentistId: string;
  dentistName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  chairNumber: number; // 1, 2, 3...
  unitId: string;
  status: AppointmentStatus;
  notes?: string;
  recurrenceId?: string; // Para tratamento ortodôntico, etc.
}

export interface WaitingListEntry {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  preferredDays: string[];
  preferredPeriods: ('manha' | 'tarde' | 'noite')[];
  dentistId?: string;
  notes?: string;
  createdAt: string;
  arrivalTime?: string; // Horário de chegada
}

export interface FinancialRecord {
  id: string;
  patientId?: string; // Se vinculado a paciente
  patientName?: string;
  type: 'receita' | 'despesa';
  category: string; // 'procedimento', 'laboratorio', 'fornecedor', 'aluguel', 'comissão', etc.
  description: string;
  value: number;
  dueDate: string;
  paymentDate?: string;
  paymentMethod?: string; // 'pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'boleto', 'convenio'
  status: 'pago' | 'pendente' | 'atrasado';
  unitId: string;
  dentistCommissionId?: string; // Se for repasse
  insuranceName?: string; // Se convênio
  nfeNumber?: string; // Número NF-e
  nfeStatus?: 'emitida' | 'pendente' | 'cancelada';
}

export interface StockItem {
  id: string;
  name: string;
  category: string; // 'consumivel', 'instrumental', 'orto', 'implante'
  quantity: number;
  minQuantity: number;
  unit: string; // 'un', 'cx', 'ml', 'g'
  expirationDate?: string;
  supplier: string;
  location: string;
}

export interface AutoclaveCycle {
  id: string;
  date: string;
  time: string;
  operatorName: string;
  temperatureCelsius: number;
  pressureBar: number;
  durationMinutes: number;
  chemicalIndicatorPassed: boolean;
  biologicalIndicatorPassed: boolean;
  sterilizedItems: string[];
}

export type UserRole = 'admin' | 'dentista' | 'recepcionista';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  cro?: string;
  specialty?: string;
  commissionPercent?: number; // Ex: 40% de comissão
  commissionInsurancePercent?: number; // Ex: 30% de comissão convênio
  active: boolean;
  avatarUrl?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string; // 'create_patient', 'view_prontuario', 'edit_odontogram', 'delete_finance'
  details: string;
  ipAddress: string;
}
