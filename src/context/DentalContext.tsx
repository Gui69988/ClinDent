/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Patient,
  Anamnese,
  ToothState,
  ClinicalEvolution,
  DocumentFile,
  Budget,
  Appointment,
  WaitingListEntry,
  FinancialRecord,
  StockItem,
  AutoclaveCycle,
  User,
  AuditLog,
  UserRole,
  PatientStatus,
  ToothFaceState
} from '../types/dental';

interface DentalContextType {
  patients: Patient[];
  anamneses: { [patientId: string]: Anamnese };
  odontograms: { [patientId: string]: ToothState[] };
  evolutions: ClinicalEvolution[];
  documents: DocumentFile[];
  budgets: Budget[];
  appointments: Appointment[];
  waitingList: WaitingListEntry[];
  financials: FinancialRecord[];
  stock: StockItem[];
  autoclaveCycles: AutoclaveCycle[];
  users: User[];
  auditLogs: AuditLog[];
  currentUser: User;
  currentUnit: string;
  units: string[];
  hiddenPII: boolean;
  setHiddenPII: (val: boolean) => void;
  setCurrentUser: (user: User) => void;
  setCurrentUnit: (unit: string) => void;

  // Actions
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  updateAnamnese: (patientId: string, anamnese: Partial<Anamnese>) => void;
  updateOdontogram: (patientId: string, toothNumber: number, face: string, state: ToothFaceState, isAnomaly?: boolean, anomalyType?: any, notes?: string) => void;
  resetOdontogram: (patientId: string) => void;
  addEvolution: (patientId: string, evolution: Omit<ClinicalEvolution, 'id' | 'patientId' | 'date'>) => void;
  addDocument: (patientId: string, name: string, category: DocumentFile['category'], url: string, fileSize: string, notes?: string) => void;
  deleteDocument: (id: string) => void;
  addBudget: (patientId: string, budget: Omit<Budget, 'id' | 'patientId' | 'createdAt' | 'status'>) => string;
  updateBudgetStatus: (id: string, status: Budget['status'], signatureBase64?: string) => void;
  addAppointment: (appt: Omit<Appointment, 'id'>) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  deleteAppointment: (id: string) => void;
  addWaitingList: (entry: Omit<WaitingListEntry, 'id' | 'createdAt'>) => void;
  removeWaitingList: (id: string) => void;
  addFinancialRecord: (record: Omit<FinancialRecord, 'id' | 'status'> & { status?: FinancialRecord['status'] }) => void;
  updateFinancialStatus: (id: string, status: FinancialRecord['status'], paymentDate?: string) => void;
  updateFinancialRecord: (id: string, record: Partial<FinancialRecord>) => void;
  deleteFinancialRecord: (id: string) => void;
  addStockItem: (item: Omit<StockItem, 'id'>) => void;
  updateStockQuantity: (id: string, qty: number) => void;
  addAutoclaveCycle: (cycle: Omit<AutoclaveCycle, 'id' | 'date' | 'time'>) => void;
  addUser: (user: Omit<User, 'id' | 'active'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  logAction: (action: string, details: string) => void;
}

const DentalContext = createContext<DentalContextType | undefined>(undefined);

const UNITS = ['Unidade Paulista (Matriz)', 'Unidade Jardins', 'Unidade Campinas'];

// Standard Tooth setup (32 adult teeth, 11-18, 21-28, 31-38, 41-48)
export const createDefaultOdontogram = (): ToothState[] => {
  const teeth: ToothState[] = [];
  const adultToothNumbers = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
    48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38
  ];
  
  adultToothNumbers.forEach(num => {
    teeth.push({
      toothNumber: num,
      faces: {
        oclusal: 'none',
        mesial: 'none',
        distal: 'none',
        vestibular: 'none',
        lingual: 'none'
      },
      anomalies: [],
      notes: ''
    });
  });

  // Deciduous Teeth (child) 51-55, 61-65, 71-75, 81-85
  const childToothNumbers = [
    55, 54, 53, 52, 51, 61, 62, 63, 64, 65,
    85, 84, 83, 82, 81, 71, 72, 73, 74, 75
  ];
  childToothNumbers.forEach(num => {
    teeth.push({
      toothNumber: num,
      faces: {
        oclusal: 'none',
        mesial: 'none',
        distal: 'none',
        vestibular: 'none',
        lingual: 'none'
      },
      anomalies: [],
      notes: ''
    });
  });

  return teeth;
};

export const DentalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [anamneses, setAnamneses] = useState<{ [patientId: string]: Anamnese }>({});
  const [odontograms, setOdontograms] = useState<{ [patientId: string]: ToothState[] }>({});
  const [evolutions, setEvolutions] = useState<ClinicalEvolution[]>([]);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [financials, setFinancials] = useState<FinancialRecord[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [autoclaveCycles, setAutoclaveCycles] = useState<AutoclaveCycle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'u1',
    name: 'Dr. Carlos Silva',
    email: 'carlos.silva@clindent.com.br',
    role: 'admin',
    phone: '(11) 98888-7777',
    cro: 'CRO-SP 87654',
    specialty: 'Gestão Odontológica & Implante',
    commissionPercent: 50,
    active: true,
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150'
  });
  
  const [currentUnit, setCurrentUnit] = useState<string>(UNITS[0]);
  const [hiddenPII, setHiddenPII] = useState<boolean>(false);

  // Load and populate storage on init
  useEffect(() => {
    // FORÇA LIMPEZA DE TODOS OS DADOS SALVOS ANTERIORMENTE NO SITE (Wipe clean)
    const alreadyCleared = localStorage.getItem('clindent_is_cleared_v4');
    if (!alreadyCleared) {
      const keysToRemove = [
        'clindent_patients',
        'clindent_anamneses',
        'clindent_odontograms',
        'clindent_evolutions',
        'clindent_documents',
        'clindent_budgets',
        'clindent_appointments',
        'clindent_waiting',
        'clindent_financials',
        'clindent_stock',
        'clindent_autoclave',
        'clindent_users',
        'clindent_logs',
        'clindent_local_general_files'
      ];
      keysToRemove.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('clindent_is_cleared_v4', 'true');
    }

    const localPatients = localStorage.getItem('clindent_patients');
    const localAnamneses = localStorage.getItem('clindent_anamneses');
    const localOdontograms = localStorage.getItem('clindent_odontograms');
    const localEvolutions = localStorage.getItem('clindent_evolutions');
    const localDocuments = localStorage.getItem('clindent_documents');
    const localBudgets = localStorage.getItem('clindent_budgets');
    const localAppointments = localStorage.getItem('clindent_appointments');
    const localWaitingList = localStorage.getItem('clindent_waiting');
    const localFinancials = localStorage.getItem('clindent_financials');
    const localStock = localStorage.getItem('clindent_stock');
    const localAutoclave = localStorage.getItem('clindent_autoclave');
    const localUsers = localStorage.getItem('clindent_users');
    const localLogs = localStorage.getItem('clindent_logs');

    if (localPatients) {
      setPatients(JSON.parse(localPatients));
      setAnamneses(JSON.parse(localAnamneses || '{}'));
      setOdontograms(JSON.parse(localOdontograms || '{}'));
      setEvolutions(JSON.parse(localEvolutions || '[]'));
      setDocuments(JSON.parse(localDocuments || '[]'));
      setBudgets(JSON.parse(localBudgets || '[]'));
      setAppointments(JSON.parse(localAppointments || '[]'));
      setWaitingList(JSON.parse(localWaitingList || '[]'));
      setFinancials(JSON.parse(localFinancials || '[]'));
      setStock(JSON.parse(localStock || '[]'));
      setAutoclaveCycles(JSON.parse(localAutoclave || '[]'));
      setUsers(JSON.parse(localUsers || '[]'));
      setAuditLogs(JSON.parse(localLogs || '[]'));
    } else {
      // PRE-POPULATE FULL SYSTEM MOCK DATA
      const mockUsers: User[] = [
        {
          id: 'u1',
          name: 'Dr. Carlos Silva',
          email: 'carlos.silva@clindent.com.br',
          role: 'admin',
          phone: '(11) 98888-7777',
          cro: 'CRO-SP 87654',
          specialty: 'Implantodontia',
          commissionPercent: 50,
          active: true,
          avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150'
        },
        {
          id: 'u2',
          name: 'Dra. Guinevere Vance',
          email: 'guinevere.vance@clindent.com.br',
          role: 'dentista',
          phone: '(11) 97777-6666',
          cro: 'CRO-SP 65432',
          specialty: 'Endodontia & Estética',
          commissionPercent: 40,
          active: true,
          avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150'
        },
        {
          id: 'u3',
          name: 'Dr. Arthur Pendragon',
          email: 'arthur.pendragon@clindent.com.br',
          role: 'dentista',
          phone: '(11) 96666-5555',
          cro: 'CRO-SP 12345',
          specialty: 'Ortodontia',
          commissionPercent: 35,
          active: true,
          avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150'
        },
        {
          id: 'u4',
          name: 'Marina Costa',
          email: 'marina.costa@clindent.com.br',
          role: 'recepcionista',
          phone: '(11) 95555-4444',
          active: true,
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150'
        }
      ];

      const mockPatients: Patient[] = [
        {
          id: 'p1',
          name: 'Maria de Souza Santos',
          cpf: '123.456.789-00',
          rg: '12.345.678-9',
          birthDate: '1988-04-12',
          gender: 'Feminino',
          maritalStatus: 'Casada',
          profession: 'Designer Gráfica',
          address: {
            cep: '01311-200',
            street: 'Avenida Paulista',
            number: '1000',
            complement: 'Apto 42',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP'
          },
          phone: '(11) 99111-2222',
          email: 'maria.souza@gmail.com',
          photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
          insuranceName: 'Amil Dental',
          insuranceCardNumber: '987654321012',
          insuranceValidity: '2028-12-31',
          referralSource: 'Instagram',
          status: 'em_tratamento',
          createdAt: '2026-01-10T10:00:00Z',
          updatedAt: '2026-07-08T15:30:00Z'
        },
        {
          id: 'p2',
          name: 'João Pedro Alencar',
          cpf: '456.789.123-11',
          rg: '34.567.890-X',
          birthDate: '2016-08-22',
          gender: 'Masculino',
          maritalStatus: 'Solteiro',
          profession: 'Estudante',
          address: {
            cep: '04524-030',
            street: 'Rua Normandia',
            number: '120',
            neighborhood: 'Moema',
            city: 'São Paulo',
            state: 'SP'
          },
          phone: '(11) 98222-3333',
          email: 'pai.joao@gmail.com',
          photoUrl: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=150',
          responsibleName: 'Julio Alencar (Pai)',
          responsibleCpf: '111.222.333-44',
          insuranceName: 'SulAmérica Odonto',
          insuranceCardNumber: 'SA-99988812',
          insuranceValidity: '2027-06-30',
          referralSource: 'Google Pesquisa',
          status: 'ativo',
          createdAt: '2026-03-15T09:15:00Z',
          updatedAt: '2026-06-12T11:00:00Z'
        },
        {
          id: 'p3',
          name: 'Francisco de Andrade Lima',
          cpf: '789.123.456-22',
          rg: '23.456.789-1',
          birthDate: '1962-11-05',
          gender: 'Masculino',
          maritalStatus: 'Divorciado',
          profession: 'Engenheiro Civil',
          address: {
            cep: '01424-001',
            street: 'Alameda Lorena',
            number: '450',
            complement: 'Sl 1102',
            neighborhood: 'Jardins',
            city: 'São Paulo',
            state: 'SP'
          },
          phone: '(11) 97333-4444',
          email: 'francisco.andrade@outlook.com',
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
          referralSource: 'Indicação de Paciente (Maria de Souza)',
          status: 'concluido',
          createdAt: '2025-10-05T14:00:00Z',
          updatedAt: '2026-07-02T16:45:00Z'
        },
        {
          id: 'p4',
          name: 'Ana Carolina Oliveira',
          cpf: '321.654.987-44',
          rg: '45.678.901-2',
          birthDate: '1995-02-28',
          gender: 'Feminino',
          maritalStatus: 'Solteira',
          profession: 'Analista de Sistemas',
          address: {
            cep: '05408-001',
            street: 'Rua Teodoro Sampaio',
            number: '1800',
            complement: 'Apto 152B',
            neighborhood: 'Pinheiros',
            city: 'São Paulo',
            state: 'SP'
          },
          phone: '(11) 96444-5555',
          email: 'ana.oliveira@yahoo.com.br',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
          insuranceName: 'Particular',
          referralSource: 'Instagram',
          status: 'inadimplente',
          createdAt: '2026-02-20T11:00:00Z',
          updatedAt: '2026-07-05T09:00:00Z'
        }
      ];

      const mockAnamneses: { [patientId: string]: Anamnese } = {
        p1: {
          patientId: 'p1',
          allergies: 'Alergia a Penicilina',
          medicationsInUse: 'Anticoncepcional, complexo vitamínico',
          preExistingDiseases: ['hipertensao'],
          heartProblems: false,
          isPregnant: false,
          usesAnticoagulant: false,
          additionalNotes: 'Paciente relata leve ansiedade em procedimentos cirúrgicos.',
          patientSignature: 'Assinado Eletronicamente por Maria de Souza Santos',
          signatureDate: '2026-01-10',
          history: [
            { updatedAt: '2026-01-10T10:15:00Z', updatedBy: 'Marina Costa', changes: 'Preenchimento Inicial no balcão.' }
          ]
        },
        p2: {
          patientId: 'p2',
          allergies: 'Sem alergias conhecidas',
          medicationsInUse: 'Nenhum',
          preExistingDiseases: [],
          heartProblems: false,
          isPregnant: false,
          usesAnticoagulant: false,
          additionalNotes: 'Paciente infantil. Bastante assustado com barulho do motor odontológico.',
          patientSignature: 'Assinado por Julio Alencar (Responsável)',
          signatureDate: '2026-03-15',
          history: [
            { updatedAt: '2026-03-15T09:30:00Z', updatedBy: 'Marina Costa', changes: 'Criado cadastro pelo responsável legal.' }
          ]
        },
        p3: {
          patientId: 'p3',
          allergies: 'Lactose, Látex',
          medicationsInUse: 'Enalapril para controle de pressão',
          preExistingDiseases: ['hipertensao', 'cardiaca'],
          heartProblems: true,
          isPregnant: false,
          usesAnticoagulant: true,
          additionalNotes: 'Uso de anticoagulante diário. Necessário monitoramento de tempo de coagulação antes de cirurgias de implante.',
          patientSignature: 'Assinado Eletronicamente por Francisco de Andrade Lima',
          signatureDate: '2025-10-05',
          history: [
            { updatedAt: '2025-10-05T14:10:00Z', updatedBy: 'Dra. Guinevere Vance', changes: 'Anotada condição cardíaca e uso de anticoagulantes.' }
          ]
        },
        p4: {
          patientId: 'p4',
          allergies: 'Sem alergias registradas',
          medicationsInUse: 'Nenhum',
          preExistingDiseases: [],
          heartProblems: false,
          isPregnant: false,
          usesAnticoagulant: false,
          patientSignature: 'Assinado Eletronicamente por Ana Carolina Oliveira',
          signatureDate: '2026-02-20',
          history: [
            { updatedAt: '2026-02-20T11:05:00Z', updatedBy: 'Marina Costa', changes: 'Preenchimento Inicial.' }
          ]
        }
      };

      // Set up specific interactive odontograms for mock patients
      const p1Odontogram = createDefaultOdontogram();
      // Tooth 16 has a carie on oclusal
      p1Odontogram.find(t => t.toothNumber === 16)!.faces.oclusal = 'carie';
      // Tooth 24 is planejado on mesial
      p1Odontogram.find(t => t.toothNumber === 24)!.faces.mesial = 'planejado';
      // Tooth 36 is restaurado on oclusal
      p1Odontogram.find(t => t.toothNumber === 36)!.faces.oclusal = 'restaurado';
      // Tooth 46 has crown/crown anomaly
      p1Odontogram.find(t => t.toothNumber === 46)!.anomalies = ['coroa'];

      const p3Odontogram = createDefaultOdontogram();
      // Tooth 11 and 21 are implants (concluded treatment)
      p3Odontogram.find(t => t.toothNumber === 11)!.anomalies = ['implante'];
      p3Odontogram.find(t => t.toothNumber === 21)!.anomalies = ['implante'];
      // Tooth 48 is ausente
      p3Odontogram.find(t => t.toothNumber === 48)!.anomalies = ['ausente'];

      const mockOdontograms: { [patientId: string]: ToothState[] } = {
        p1: p1Odontogram,
        p2: createDefaultOdontogram(),
        p3: p3Odontogram,
        p4: createDefaultOdontogram()
      };

      const mockEvolutions: ClinicalEvolution[] = [
        {
          id: 'ev1',
          patientId: 'p1',
          date: '2026-07-02T14:30:00Z',
          dentistId: 'u3',
          dentistName: 'Dr. Arthur Pendragon',
          dentistCro: 'CRO-SP 12345',
          procedurePerformed: 'Manutenção Mensal de Aparelho Ortodôntico',
          materialsUsed: ['Arco ortodôntico NiTi 0.016', 'Ligas elásticas azuis'],
          clinicalNotes: 'Troca de arco superior e inferior. Ativação da mecânica de fechamento de espaços. Paciente relata boa adaptação e higiene bucal satisfatória.',
          signatureBase64: 'Assinatura Digitalizada - Dr. Arthur Pendragon (ICP-Brasil)',
          isLocked: true
        },
        {
          id: 'ev2',
          patientId: 'p3',
          date: '2026-07-02T16:00:00Z',
          dentistId: 'u1',
          dentistName: 'Dr. Carlos Silva',
          dentistCro: 'CRO-SP 87654',
          procedurePerformed: 'Instalação de Prótese Tipo Protocolo sobre Implante',
          materialsUsed: ['Prótese em Zircônia Protocolo', 'Parafusos protéticos de Titânio', 'Pasta profilática'],
          clinicalNotes: 'Parafusamento do protocolo superior sobre 4 implantes. Ajuste oclusal fino realizado. Torque de 15 Ncm aplicado nos parafusos protéticos. Selamento dos acessos com resina fotopolimerizável. Paciente extremamente satisfeito com o resultado estético e funcional.',
          signatureBase64: 'Assinatura Digitalizada - Dr. Carlos Silva (ICP-Brasil)',
          isLocked: true
        }
      ];

      const mockDocuments: DocumentFile[] = [
        {
          id: 'doc1',
          patientId: 'p1',
          name: 'Radiografia Panorâmica Digital.png',
          category: 'radiografias',
          url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=800',
          fileSize: '2.4 MB',
          uploadedAt: '2026-01-10T10:15:00Z',
          uploadedBy: 'Marina Costa',
          version: 1,
          notes: 'Panorâmica inicial para planejamento ortodôntico.'
        },
        {
          id: 'doc2',
          patientId: 'p3',
          name: 'Tomografia Computadorizada Maxila.pdf',
          category: 'radiografias',
          url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=800', // Mock representation
          fileSize: '8.1 MB',
          uploadedAt: '2025-10-06T15:00:00Z',
          uploadedBy: 'Dr. Carlos Silva',
          version: 1,
          notes: 'Tomografia para cálculo de espessura óssea na região dos dentes 11 e 21.'
        },
        {
          id: 'doc3',
          patientId: 'p1',
          name: 'Contrato de Prestação de Serviços Ortodônticos.pdf',
          category: 'contratos',
          url: '',
          fileSize: '450 KB',
          uploadedAt: '2026-01-10T11:00:00Z',
          uploadedBy: 'Marina Costa',
          version: 1,
          notes: 'Contrato assinado em duas vias.'
        }
      ];

      const mockBudgets: Budget[] = [
        {
          id: 'b1',
          patientId: 'p1',
          title: 'Planejamento Ortodôntico Completo',
          procedures: [
            { id: 'bp1', toothNumber: 11, procedureName: 'Instalação de Aparelho Autoligado Estético', value: 2500, status: 'concluido' },
            { id: 'bp2', procedureName: 'Manutenção Ortodôntica Mensal (x24)', value: 4800, status: 'em_execucao' },
            { id: 'bp3', toothNumber: 16, face: 'Oclusal', procedureName: 'Restauração em Resina Fotopolimerizável', value: 250, status: 'planejado' }
          ],
          discountPercent: 10,
          installments: 12,
          totalValue: 6795, // (2500+4800+250) * 0.9 = 6795
          paymentMethod: 'cartao_credito',
          status: 'aprovado',
          createdAt: '2026-01-10T10:30:00Z',
          approvedAt: '2026-01-10'
        },
        {
          id: 'b2',
          patientId: 'p4',
          title: 'Estética Anterior & Profilaxia',
          procedures: [
            { id: 'bp4', toothNumber: 11, face: 'Vestibular', procedureName: 'Faceta de Porcelana', value: 1800, status: 'planejado' },
            { id: 'bp5', toothNumber: 21, face: 'Vestibular', procedureName: 'Faceta de Porcelana', value: 1800, status: 'planejado' },
            { id: 'bp6', procedureName: 'Profilaxia e Aplicação de Flúor', value: 180, status: 'planejado' }
          ],
          discountPercent: 5,
          installments: 6,
          totalValue: 3591, // (1800+1800+180) * 0.95 = 3591
          paymentMethod: 'pix',
          status: 'pendente',
          createdAt: '2026-07-05T09:30:00Z'
        }
      ];

      // Formulate appointments spanning current, previous and next days (based on 2026-07-09 current time in prompt)
      const mockAppointments: Appointment[] = [
        {
          id: 'a1',
          patientId: 'p1',
          patientName: 'Maria de Souza Santos',
          patientPhone: '(11) 99111-2222',
          dentistId: 'u3',
          dentistName: 'Dr. Arthur Pendragon',
          date: '2026-07-09', // Today
          time: '09:00',
          durationMinutes: 45,
          chairNumber: 1,
          unitId: UNITS[0],
          status: 'confirmado',
          notes: 'Manutenção aparelho fixo.'
        },
        {
          id: 'a2',
          patientId: 'p2',
          patientName: 'João Pedro Alencar',
          patientPhone: '(11) 98222-3333',
          dentistId: 'u2',
          dentistName: 'Dra. Guinevere Vance',
          date: '2026-07-09', // Today
          time: '14:00',
          durationMinutes: 30,
          chairNumber: 2,
          unitId: UNITS[0],
          status: 'aguardando_confirmacao',
          notes: 'Aplicação de selante dentes decíduos.'
        },
        {
          id: 'a3',
          patientId: 'p4',
          patientName: 'Ana Carolina Oliveira',
          patientPhone: '(11) 96444-5555',
          dentistId: 'u2',
          dentistName: 'Dra. Guinevere Vance',
          date: '2026-07-09', // Today
          time: '16:00',
          durationMinutes: 60,
          chairNumber: 2,
          unitId: UNITS[0],
          status: 'falta',
          notes: 'Avaliação clínica geral para facetas.'
        },
        {
          id: 'a4',
          patientId: 'p3',
          patientName: 'Francisco de Andrade Lima',
          patientPhone: '(11) 97333-4444',
          dentistId: 'u1',
          dentistName: 'Dr. Carlos Silva',
          date: '2026-07-08', // Yesterday
          time: '15:00',
          durationMinutes: 60,
          chairNumber: 1,
          unitId: UNITS[1],
          status: 'atendido',
          notes: 'Ajuste protético pós-implante.'
        },
        {
          id: 'a5',
          patientId: 'p1',
          patientName: 'Maria de Souza Santos',
          patientPhone: '(11) 99111-2222',
          dentistId: 'u3',
          dentistName: 'Dr. Arthur Pendragon',
          date: '2026-08-09', // Future recurrence
          time: '09:00',
          durationMinutes: 45,
          chairNumber: 1,
          unitId: UNITS[0],
          status: 'confirmado',
          notes: 'Manutenção ortodôntica mensal.',
          recurrenceId: 'rec_ortho_p1'
        }
      ];

      const mockWaitingList: WaitingListEntry[] = [
        {
          id: 'w1',
          patientId: 'p2',
          patientName: 'João Pedro Alencar',
          phone: '(11) 98222-3333',
          preferredDays: ['Segunda', 'Quarta'],
          preferredPeriods: ['tarde'],
          dentistId: 'u2',
          notes: 'Prefere após o horário escolar (13:30h).',
          createdAt: '2026-07-07T10:00:00Z'
        }
      ];

      const mockFinancials: FinancialRecord[] = [
        // Revenues (Receitas)
        { id: 'f1', patientId: 'p1', patientName: 'Maria de Souza Santos', type: 'receita', category: 'procedimento', description: 'Entrada Aparelho Ortodôntico (Parc. 1/12)', value: 566.25, dueDate: '2026-02-10', paymentDate: '2026-02-10', paymentMethod: 'cartao_credito', status: 'pago', unitId: UNITS[0], nfeNumber: 'NF-2026042', nfeStatus: 'emitida' },
        { id: 'f2', patientId: 'p1', patientName: 'Maria de Souza Santos', type: 'receita', category: 'procedimento', description: 'Mensalidade Ortodontia (Parc. 2/12)', value: 566.25, dueDate: '2026-03-10', paymentDate: '2026-03-09', paymentMethod: 'cartao_credito', status: 'pago', unitId: UNITS[0], nfeNumber: 'NF-2026095', nfeStatus: 'emitida' },
        { id: 'f3', patientId: 'p1', patientName: 'Maria de Souza Santos', type: 'receita', category: 'procedimento', description: 'Mensalidade Ortodontia (Parc. 6/12)', value: 566.25, dueDate: '2026-07-10', status: 'pendente', unitId: UNITS[0] },
        { id: 'f4', patientId: 'p4', patientName: 'Ana Carolina Oliveira', type: 'receita', category: 'procedimento', description: 'Sessão Profilaxia Geral', value: 180, dueDate: '2026-06-20', status: 'atrasado', unitId: UNITS[0] },
        { id: 'f5', patientId: 'p3', patientName: 'Francisco de Andrade Lima', type: 'receita', category: 'procedimento', description: 'Implante Dentário Região 11 e 21 (À vista)', value: 9500, dueDate: '2025-10-15', paymentDate: '2025-10-15', paymentMethod: 'pix', status: 'pago', unitId: UNITS[1], nfeNumber: 'NF-2025987', nfeStatus: 'emitida' },
        
        // Expenses (Despesas)
        { id: 'f6', type: 'despesa', category: 'fornecedor', description: 'Compra de anestésicos e luvas - Dental Cremer', value: 1200, dueDate: '2026-07-10', status: 'pendente', unitId: UNITS[0] },
        { id: 'f7', type: 'despesa', category: 'aluguel', description: 'Aluguel do Consultório Unidade Paulista', value: 4500, dueDate: '2026-07-05', paymentDate: '2026-07-04', paymentMethod: 'pix', status: 'pago', unitId: UNITS[0] },
        { id: 'f8', type: 'despesa', category: 'laboratorio', description: 'Laboratório de Prótese - Coroa dente 46', value: 450, dueDate: '2026-06-15', paymentDate: '2026-06-15', paymentMethod: 'boleto', status: 'pago', unitId: UNITS[0] },
        
        // Commissions (Comissões)
        { id: 'f9', type: 'despesa', category: 'comissão', description: 'Repasse de Comissão - Dr. Arthur Pendragon (p1)', value: 198.18, dueDate: '2026-07-15', status: 'pendente', unitId: UNITS[0], dentistCommissionId: 'u3' },
        { id: 'f10', type: 'despesa', category: 'comissão', description: 'Repasse de Comissão - Dr. Carlos Silva (p3)', value: 4750.00, dueDate: '2025-10-30', paymentDate: '2025-10-28', paymentMethod: 'pix', status: 'pago', unitId: UNITS[1], dentistCommissionId: 'u1' }
      ];

      const mockStock: StockItem[] = [
        { id: 's1', name: 'Anestésico Mepivacaína 2% com Epinefrina', category: 'consumivel', quantity: 15, minQuantity: 10, unit: 'cx', expirationDate: '2027-04-18', supplier: 'Dental Cremer', location: 'Armário A - Recepção' },
        { id: 's2', name: 'Resina Fotopolimerizável Filtek Z250 A2', category: 'consumivel', quantity: 4, minQuantity: 5, unit: 'un', expirationDate: '2026-11-20', supplier: 'Dental Cremer', location: 'Armário B - Consultório 2' }, // Needs restocking!
        { id: 's3', name: 'Arco Ortodôntico NiTi 0.014 Superior', category: 'orto', quantity: 25, minQuantity: 15, unit: 'un', expirationDate: '2029-01-01', supplier: 'Orthometric', location: 'Gaveta C - Consultório 1' },
        { id: 's4', name: 'Implante Titânio Cone Morse 4.0x11mm', category: 'implante', quantity: 3, minQuantity: 4, unit: 'un', expirationDate: '2028-06-12', supplier: 'Neodent', location: 'Armário Especial - Esterilização' } // Needs restocking!
      ];

      const mockAutoclave: AutoclaveCycle[] = [
        {
          id: 'at1',
          date: '2026-07-08',
          time: '18:15',
          operatorName: 'Marina Costa',
          temperatureCelsius: 134,
          pressureBar: 2.1,
          durationMinutes: 45,
          chemicalIndicatorPassed: true,
          biologicalIndicatorPassed: true,
          sterilizedItems: ['Kit Clínico (Espelho, Pinça, Sonda) x12', 'Fórceps Adulto x4', 'Broqueiro de alta rotação x2']
        }
      ];

      const mockLogs: AuditLog[] = [
        { id: 'l1', timestamp: '2026-07-09T08:00:00Z', userId: 'u4', userName: 'Marina Costa', role: 'recepcionista', action: 'visualizar_agenda', details: 'Acessou agenda do dia - Unidade Paulista', ipAddress: '192.168.1.50' },
        { id: 'l2', timestamp: '2026-07-09T08:15:00Z', userId: 'u1', userName: 'Dr. Carlos Silva', role: 'admin', action: 'visualizar_prontuario', details: 'Visualizou prontuário eletrônico do paciente: Maria de Souza Santos', ipAddress: '192.168.1.12' }
      ];

      const cleanUsers = [mockUsers[0]]; // Only keep Dr. Carlos Silva as default administrator

      setPatients([]);
      setAnamneses({});
      setOdontograms({});
      setEvolutions([]);
      setDocuments([]);
      setBudgets([]);
      setAppointments([]);
      setWaitingList([]);
      setFinancials([]);
      setStock([]);
      setAutoclaveCycles([]);
      setUsers(cleanUsers);
      setAuditLogs([
        { 
          id: 'l1', 
          timestamp: new Date().toISOString(), 
          userId: 'u1', 
          userName: 'Dr. Carlos Silva', 
          role: 'admin', 
          action: 'limpeza_banco_dados', 
          details: 'Banco de dados reiniciado e limpo de todas as informações salvas.', 
          ipAddress: '127.0.0.1' 
        }
      ]);

      localStorage.setItem('clindent_patients', JSON.stringify([]));
      localStorage.setItem('clindent_anamneses', JSON.stringify({}));
      localStorage.setItem('clindent_odontograms', JSON.stringify({}));
      localStorage.setItem('clindent_evolutions', JSON.stringify([]));
      localStorage.setItem('clindent_documents', JSON.stringify([]));
      localStorage.setItem('clindent_budgets', JSON.stringify([]));
      localStorage.setItem('clindent_appointments', JSON.stringify([]));
      localStorage.setItem('clindent_waiting', JSON.stringify([]));
      localStorage.setItem('clindent_financials', JSON.stringify([]));
      localStorage.setItem('clindent_stock', JSON.stringify([]));
      localStorage.setItem('clindent_autoclave', JSON.stringify([]));
      localStorage.setItem('clindent_users', JSON.stringify(cleanUsers));
      localStorage.setItem('clindent_logs', JSON.stringify([
        { 
          id: 'l1', 
          timestamp: new Date().toISOString(), 
          userId: 'u1', 
          userName: 'Dr. Carlos Silva', 
          role: 'admin', 
          action: 'limpeza_banco_dados', 
          details: 'Banco de dados reiniciado e limpo de todas as informações salvas.', 
          ipAddress: '127.0.0.1' 
        }
      ]));
    }
  }, []);

  // Save changes wrapper
  const saveAndSetPatients = (newPatients: Patient[]) => {
    setPatients(newPatients);
    localStorage.setItem('clindent_patients', JSON.stringify(newPatients));
  };

  const saveAndSetAnamneses = (newAnamneses: { [patientId: string]: Anamnese }) => {
    setAnamneses(newAnamneses);
    localStorage.setItem('clindent_anamneses', JSON.stringify(newAnamneses));
  };

  const saveAndSetOdontograms = (newOdontograms: { [patientId: string]: ToothState[] }) => {
    setOdontograms(newOdontograms);
    localStorage.setItem('clindent_odontograms', JSON.stringify(newOdontograms));
  };

  const saveAndSetEvolutions = (newEvolutions: ClinicalEvolution[]) => {
    setEvolutions(newEvolutions);
    localStorage.setItem('clindent_evolutions', JSON.stringify(newEvolutions));
  };

  const saveAndSetDocuments = (newDocs: DocumentFile[]) => {
    setDocuments(newDocs);
    try {
      localStorage.setItem('clindent_documents', JSON.stringify(newDocs));
    } catch (error) {
      console.error('Failed to save documents to localStorage:', error);
      alert(
        'Aviso: O espaço de armazenamento do seu navegador está cheio para esta página.\n\n' +
        'O documento foi carregado e poderá ser visualizado nesta sessão, mas pode não ser salvo permanentemente. ' +
        'Recomendamos remover alguns documentos antigos ou usar imagens de menor resolução.'
      );
    }
  };

  const saveAndSetBudgets = (newBudgets: Budget[]) => {
    setBudgets(newBudgets);
    localStorage.setItem('clindent_budgets', JSON.stringify(newBudgets));
  };

  const saveAndSetAppointments = (newAppts: Appointment[]) => {
    setAppointments(newAppts);
    localStorage.setItem('clindent_appointments', JSON.stringify(newAppts));
  };

  const saveAndSetWaitingList = (newWait: WaitingListEntry[]) => {
    setWaitingList(newWait);
    localStorage.setItem('clindent_waiting', JSON.stringify(newWait));
  };

  const saveAndSetFinancials = (newFin: FinancialRecord[]) => {
    setFinancials(newFin);
    localStorage.setItem('clindent_financials', JSON.stringify(newFin));
  };

  const saveAndSetStock = (newStock: StockItem[]) => {
    setStock(newStock);
    localStorage.setItem('clindent_stock', JSON.stringify(newStock));
  };

  const saveAndSetAutoclave = (newAuto: AutoclaveCycle[]) => {
    setAutoclaveCycles(newAuto);
    localStorage.setItem('clindent_autoclave', JSON.stringify(newAuto));
  };

  const saveAndSetUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem('clindent_users', JSON.stringify(newUsers));
  };

  const logAction = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: 'log_' + Date.now() + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action,
      details,
      ipAddress: '192.168.1.100'
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    localStorage.setItem('clindent_logs', JSON.stringify(updated));
  };

  // Actions implementation
  const addPatient = async (patData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = 'p_' + Date.now();
    const timestamp = new Date().toISOString();
    const newPatient: Patient = {
      ...patData,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    // Attempt to create local folder
    const rootPath = localStorage.getItem('clindent_local_root_path') || 'C:\\ClinDent\\Armazenamento_Geral';
    const safeName = patData.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-zA-Z0-9]/g, "_");
    const patientPath = `${rootPath}\\Pacientes\\${id}_${safeName}`;

    try {
      await fetch('/api/create-patient-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: patientPath })
      });
    } catch (e) {
      console.error("Could not create local directory:", e);
    }

    const updated = [newPatient, ...patients];
    saveAndSetPatients(updated);

    // Set up empty odontogram & initial anamnese
    const initialOdontogram = createDefaultOdontogram();
    const updatedOdontograms = { ...odontograms, [id]: initialOdontogram };
    saveAndSetOdontograms(updatedOdontograms);

    const initialAnamnese: Anamnese = {
      patientId: id,
      allergies: '',
      medicationsInUse: '',
      preExistingDiseases: [],
      heartProblems: false,
      isPregnant: false,
      usesAnticoagulant: false,
      history: [{ updatedAt: timestamp, updatedBy: currentUser.name, changes: 'Ficha de Anamnese criada' }]
    };
    const updatedAnamneses = { ...anamneses, [id]: initialAnamnese };
    saveAndSetAnamneses(updatedAnamneses);

    logAction('create_patient', `Criado cadastro para o paciente: ${newPatient.name}`);
    return id;
  };

  const updatePatient = (id: string, updatedFields: Partial<Patient>) => {
    const patientIndex = patients.findIndex(p => p.id === id);
    if (patientIndex > -1) {
      const updatedPatients = [...patients];
      updatedPatients[patientIndex] = {
        ...updatedPatients[patientIndex],
        ...updatedFields,
        updatedAt: new Date().toISOString()
      };
      saveAndSetPatients(updatedPatients);
      logAction('update_patient', `Atualizado cadastro do paciente: ${updatedPatients[patientIndex].name}`);
    }
  };

  const deletePatient = async (id: string) => {
    const patientToDelete = patients.find(p => p.id === id);
    if (!patientToDelete) return;

    // Remove folder
    const rootPath = localStorage.getItem('clindent_local_root_path') || 'C:\\ClinDent\\Armazenamento_Geral';
    const safeName = patientToDelete.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-zA-Z0-9]/g, "_");
    const patientPath = `${rootPath}\\Pacientes\\${id}_${safeName}`;

    try {
      await fetch('/api/fs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: patientPath })
      });
    } catch (e) {
      console.error("Could not delete local directory:", e);
    }

    const updated = patients.filter(p => p.id !== id);
    saveAndSetPatients(updated);
    logAction('delete_patient', `Paciente removido: ${patientToDelete.name}`);
  };

  const updateAnamnese = (patientId: string, updatedFields: Partial<Anamnese>) => {
    const existingAnamnese = anamneses[patientId];
    const timestamp = new Date().toISOString();
    const historyEntry = {
      updatedAt: timestamp,
      updatedBy: currentUser.name,
      changes: 'Campos atualizados: ' + Object.keys(updatedFields).join(', ')
    };

    const newAnamnese: Anamnese = {
      ...(existingAnamnese || {
        patientId,
        allergies: '',
        medicationsInUse: '',
        preExistingDiseases: [],
        heartProblems: false,
        isPregnant: false,
        usesAnticoagulant: false,
        history: []
      }),
      ...updatedFields,
      history: existingAnamnese
        ? [historyEntry, ...existingAnamnese.history]
        : [historyEntry]
    };

    const updated = { ...anamneses, [patientId]: newAnamnese };
    saveAndSetAnamneses(updated);

    const pat = patients.find(p => p.id === patientId);
    logAction('update_anamnese', `Ficha de Anamnese atualizada para: ${pat?.name || patientId}`);
  };

  const updateOdontogram = (
    patientId: string,
    toothNumber: number,
    face: string,
    state: ToothFaceState,
    isAnomaly: boolean = false,
    anomalyType?: any,
    notes?: string
  ) => {
    const patientOdontogram = odontograms[patientId] || createDefaultOdontogram();
    const updatedTeeth = patientOdontogram.map(tooth => {
      if (tooth.toothNumber === toothNumber) {
        const updatedFaces = { ...tooth.faces };
        if (face && face !== 'none' && face in updatedFaces) {
          updatedFaces[face as keyof typeof tooth.faces] = state;
        } else if (face === 'all_faces') {
          // Apply to all faces
          updatedFaces.oclusal = state;
          updatedFaces.mesial = state;
          updatedFaces.distal = state;
          updatedFaces.vestibular = state;
          updatedFaces.lingual = state;
        }

        let updatedAnomalies = [...tooth.anomalies];
        if (isAnomaly && anomalyType) {
          if (anomalyType === 'remove_all_anomalies') {
            updatedAnomalies = [];
          } else {
            // Implants or crown are teeth-level anomalies
            if (updatedAnomalies.includes(anomalyType)) {
              updatedAnomalies = updatedAnomalies.filter(a => a !== anomalyType);
            } else {
              updatedAnomalies.push(anomalyType);
            }
          }
        }

        return {
          ...tooth,
          faces: updatedFaces,
          anomalies: updatedAnomalies,
          notes: notes !== undefined ? notes : tooth.notes
        };
      }
      return tooth;
    });

    const updated = { ...odontograms, [patientId]: updatedTeeth };
    saveAndSetOdontograms(updated);

    const pat = patients.find(p => p.id === patientId);
    logAction('edit_odontogram', `Odontograma alterado para o dente ${toothNumber} do paciente: ${pat?.name || patientId}`);
  };

  const resetOdontogram = (patientId: string) => {
    const cleared = createDefaultOdontogram();
    const updated = { ...odontograms, [patientId]: cleared };
    saveAndSetOdontograms(updated);
    const pat = patients.find(p => p.id === patientId);
    logAction('reset_odontogram', `Odontograma redefinido (limpo) para o paciente: ${pat?.name || patientId}`);
  };

  const addEvolution = (patientId: string, evoData: Omit<ClinicalEvolution, 'id' | 'patientId' | 'date'>) => {
    const newEvo: ClinicalEvolution = {
      ...evoData,
      id: 'evo_' + Date.now(),
      patientId,
      date: new Date().toISOString()
    };
    const updated = [newEvo, ...evolutions];
    saveAndSetEvolutions(updated);

    // Trigger potential automated inventory reduction based on materials used
    if (evoData.materialsUsed && evoData.materialsUsed.length > 0) {
      const stockUpdates = [...stock];
      evoData.materialsUsed.forEach(matName => {
        // Simple string match or prefix check to reduce stock
        const stockItem = stockUpdates.find(s => matName.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(matName.toLowerCase()));
        if (stockItem && stockItem.quantity > 0) {
          stockItem.quantity -= 1;
        }
      });
      saveAndSetStock(stockUpdates);
    }

    const pat = patients.find(p => p.id === patientId);
    logAction('add_evolution', `Nova evolução registrada por ${evoData.dentistName} para o paciente: ${pat?.name || patientId}`);
  };

  const addDocument = (
    patientId: string,
    name: string,
    category: DocumentFile['category'],
    url: string,
    fileSize: string,
    notes?: string
  ) => {
    const newDoc: DocumentFile = {
      id: 'doc_' + Date.now(),
      patientId,
      name,
      category,
      url,
      fileSize,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.name,
      version: 1,
      notes
    };
    const updated = [newDoc, ...documents];
    saveAndSetDocuments(updated);

    const pat = patients.find(p => p.id === patientId);
    logAction('upload_document', `Anexo adicionado (${category}): ${name} para o paciente: ${pat?.name || patientId}`);
  };

  const deleteDocument = (id: string) => {
    const docToDelete = documents.find(d => d.id === id);
    const updated = documents.filter(d => d.id !== id);
    saveAndSetDocuments(updated);
    if (docToDelete) {
      logAction('delete_document', `Removido documento ID ${id}: ${docToDelete.name}`);
    }
  };

  const addBudget = (patientId: string, budgetData: Omit<Budget, 'id' | 'patientId' | 'createdAt' | 'status'>) => {
    const id = 'b_' + Date.now();
    const newBudget: Budget = {
      ...budgetData,
      id,
      patientId,
      createdAt: new Date().toISOString(),
      status: 'pendente'
    };
    const updated = [newBudget, ...budgets];
    saveAndSetBudgets(updated);

    const pat = patients.find(p => p.id === patientId);
    logAction('create_budget', `Criado orçamento "${budgetData.title}" (R$ ${budgetData.totalValue.toFixed(2)}) para: ${pat?.name || patientId}`);
    return id;
  };

  const updateBudgetStatus = (id: string, status: Budget['status'], signatureBase64?: string) => {
    const budgetIndex = budgets.findIndex(b => b.id === id);
    if (budgetIndex > -1) {
      const updatedBudgets = [...budgets];
      const prevStatus = updatedBudgets[budgetIndex].status;
      updatedBudgets[budgetIndex] = {
        ...updatedBudgets[budgetIndex],
        status,
        approvedAt: status === 'aprovado' ? new Date().toISOString().split('T')[0] : updatedBudgets[budgetIndex].approvedAt,
        signatureBase64: signatureBase64 || updatedBudgets[budgetIndex].signatureBase64
      };
      saveAndSetBudgets(updatedBudgets);

      const budget = updatedBudgets[budgetIndex];
      const pat = patients.find(p => p.id === budget.patientId);
      logAction('update_budget', `Status do orçamento "${budget.title}" alterado de ${prevStatus} para ${status} (${pat?.name || 'Paciente'})`);

      // If budget is APPROVED, dynamically generate Accounts Receivable installments in the ledger!
      if (status === 'aprovado' && prevStatus !== 'aprovado') {
        const installValue = Number((budget.totalValue / budget.installments).toFixed(2));
        const newFinRecs: FinancialRecord[] = [];
        
        for (let i = 1; i <= budget.installments; i++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + i); // 30 days interval
          
          newFinRecs.push({
            id: `f_b_${id}_parc_${i}`,
            patientId: budget.patientId,
            patientName: pat?.name || 'Paciente',
            type: 'receita',
            category: 'procedimento',
            description: `Orçamento: ${budget.title} (Parc. ${i}/${budget.installments})`,
            value: installValue,
            dueDate: dueDate.toISOString().split('T')[0],
            status: 'pendente',
            unitId: currentUnit
          });
        }
        saveAndSetFinancials([...newFinRecs, ...financials]);
        logAction('generate_installments', `Geradas ${budget.installments} parcelas a receber para ${pat?.name || 'Paciente'}`);
      }
    }
  };

  const addAppointment = (apptData: Omit<Appointment, 'id'>) => {
    const newAppt: Appointment = {
      ...apptData,
      id: 'appt_' + Date.now()
    };
    const updated = [...appointments, newAppt];
    saveAndSetAppointments(updated);
    logAction('schedule_appointment', `Agendada consulta para ${apptData.patientName} no dia ${apptData.date} às ${apptData.time}`);
  };

  const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    const apptIndex = appointments.findIndex(a => a.id === id);
    if (apptIndex > -1) {
      const updatedAppts = [...appointments];
      const prevStatus = updatedAppts[apptIndex].status;
      updatedAppts[apptIndex] = {
        ...updatedAppts[apptIndex],
        status
      };
      saveAndSetAppointments(updatedAppts);
      logAction('update_appointment', `Status da consulta de ${updatedAppts[apptIndex].patientName} alterado para: ${status}`);

      // If marked as 'atendido' and there was an evolution, update patient status
      if (status === 'atendido') {
        const patId = updatedAppts[apptIndex].patientId;
        const pat = patients.find(p => p.id === patId);
        if (pat && pat.status === 'ativo') {
          updatePatient(patId, { status: 'em_tratamento' });
        }
      }
    }
  };

  const deleteAppointment = (id: string) => {
    const appt = appointments.find(a => a.id === id);
    const updated = appointments.filter(a => a.id !== id);
    saveAndSetAppointments(updated);
    if (appt) {
      logAction('cancel_appointment', `Cancelado agendamento de ${appt.patientName} no dia ${appt.date}`);
    }
  };

  const addWaitingList = (entryData: Omit<WaitingListEntry, 'id' | 'createdAt'>) => {
    const newEntry: WaitingListEntry = {
      ...entryData,
      id: 'w_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const updated = [...waitingList, newEntry];
    saveAndSetWaitingList(updated);
    logAction('add_waiting_list', `Paciente adicionado à fila de espera: ${entryData.patientName}`);
  };

  const removeWaitingList = (id: string) => {
    const entry = waitingList.find(w => w.id === id);
    const updated = waitingList.filter(w => w.id !== id);
    saveAndSetWaitingList(updated);
    if (entry) {
      logAction('remove_waiting_list', `Paciente removido da fila de espera: ${entry.patientName}`);
    }
  };

  const addFinancialRecord = (recData: Omit<FinancialRecord, 'id' | 'status'> & { status?: FinancialRecord['status'] }) => {
    const newRec: FinancialRecord = {
      ...recData,
      id: 'fin_' + Date.now(),
      status: recData.status || 'pendente'
    };
    const updated = [newRec, ...financials];
    saveAndSetFinancials(updated);
    logAction('create_financial_record', `Lançado ${recData.type}: ${recData.description} (R$ ${recData.value.toFixed(2)})`);
  };

  const updateFinancialStatus = (id: string, status: FinancialRecord['status'], paymentDate?: string) => {
    const recIndex = financials.findIndex(f => f.id === id);
    if (recIndex > -1) {
      const updatedFin = [...financials];
      updatedFin[recIndex] = {
        ...updatedFin[recIndex],
        status,
        paymentDate: status === 'pago' ? (paymentDate || new Date().toISOString().split('T')[0]) : undefined
      };
      saveAndSetFinancials(updatedFin);
      logAction('update_financial_status', `Transação "${updatedFin[recIndex].description}" marcada como ${status}`);
    }
  };

  const updateFinancialRecord = (id: string, recordData: Partial<FinancialRecord>) => {
    const recIndex = financials.findIndex(f => f.id === id);
    if (recIndex > -1) {
      const updatedFin = [...financials];
      updatedFin[recIndex] = {
        ...updatedFin[recIndex],
        ...recordData
      };
      saveAndSetFinancials(updatedFin);
      logAction('update_financial_record', `Lançamento financeiro "${updatedFin[recIndex].description}" editado.`);
    }
  };

  const deleteFinancialRecord = (id: string) => {
    const rec = financials.find(f => f.id === id);
    const updated = financials.filter(f => f.id !== id);
    saveAndSetFinancials(updated);
    if (rec) {
      logAction('delete_financial_record', `Removido lançamento financeiro "${rec.description}" (R$ ${rec.value.toFixed(2)})`);
    }
  };

  const addStockItem = (itemData: Omit<StockItem, 'id'>) => {
    const newDoc: StockItem = {
      ...itemData,
      id: 'stock_' + Date.now()
    };
    const updated = [...stock, newDoc];
    saveAndSetStock(updated);
    logAction('add_stock_item', `Cadastrado item no estoque: ${itemData.name}`);
  };

  const updateStockQuantity = (id: string, qty: number) => {
    const itemIndex = stock.findIndex(s => s.id === id);
    if (itemIndex > -1) {
      const updatedStock = [...stock];
      const prevQty = updatedStock[itemIndex].quantity;
      updatedStock[itemIndex].quantity = qty;
      saveAndSetStock(updatedStock);
      logAction('update_stock_qty', `Estoque de "${updatedStock[itemIndex].name}" atualizado de ${prevQty} para ${qty}`);
    }
  };

  const addAutoclaveCycle = (cycleData: Omit<AutoclaveCycle, 'id' | 'date' | 'time'>) => {
    const today = new Date();
    const newCycle: AutoclaveCycle = {
      ...cycleData,
      id: 'auto_' + Date.now(),
      date: today.toISOString().split('T')[0],
      time: today.toTimeString().split(' ')[0].substring(0, 5)
    };
    const updated = [newCycle, ...autoclaveCycles];
    saveAndSetAutoclave(updated);
    logAction('log_autoclave', `Registrado ciclo de autoclave esterilizando ${cycleData.sterilizedItems.length} tipos de instrumentos.`);
  };

  const addUser = (userData: Omit<User, 'id' | 'active'>) => {
    const newUser: User = {
      ...userData,
      id: 'u_' + Date.now(),
      active: true
    };
    const updated = [...users, newUser];
    saveAndSetUsers(updated);
    logAction('add_user', `Criado novo usuário de equipe: ${userData.name} (${userData.role})`);
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    const updated = users.map(u => u.id === id ? { ...u, ...userData } : u);
    saveAndSetUsers(updated);
    logAction('update_user', `Atualizadas informações do usuário: ${userData.name || id}`);
  };

  const deleteUser = (id: string) => {
    const u = users.find(user => user.id === id);
    const updated = users.filter(u => u.id !== id);
    saveAndSetUsers(updated);
    if (u) {
      logAction('delete_user', `Removido usuário de equipe: ${u.name}`);
    }
  };

  return (
    <DentalContext.Provider
      value={{
        patients,
        anamneses,
        odontograms,
        evolutions,
        documents,
        budgets,
        appointments,
        waitingList,
        financials,
        stock,
        autoclaveCycles,
        users,
        auditLogs,
        currentUser,
        currentUnit,
        units: UNITS,
        hiddenPII,
        setHiddenPII,
        setCurrentUser,
        setCurrentUnit,
        addPatient,
        updatePatient,
        deletePatient,
        updateAnamnese,
        updateOdontogram,
        resetOdontogram,
        addEvolution,
        addDocument,
        deleteDocument,
        addBudget,
        updateBudgetStatus,
        addAppointment,
        updateAppointmentStatus,
        deleteAppointment,
        addWaitingList,
        removeWaitingList,
        addFinancialRecord,
        updateFinancialStatus,
        updateFinancialRecord,
        deleteFinancialRecord,
        addStockItem,
        updateStockQuantity,
        addAutoclaveCycle,
        addUser,
        updateUser,
        deleteUser,
        logAction
      }}
    >
      {children}
    </DentalContext.Provider>
  );
};

export const useDental = () => {
  const context = useContext(DentalContext);
  if (context === undefined) {
    throw new Error('useDental must be used within a DentalProvider');
  }
  return context;
};
