/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Activity,
  Award,
  DollarSign,
  FileText,
  FolderOpen,
  History,
  Phone,
  Shield,
  Clock
} from 'lucide-react';
import { useDental } from '../../context/DentalContext';

import AnamneseTab from './AnamneseTab';
import OdontogramTab from './OdontogramTab';
import BudgetsTab from './BudgetsTab';
import EvolutionsTab from './EvolutionsTab';
import DocumentsTab from './DocumentsTab';
import FinanceTab from './FinanceTab';
import TimelineTab from './TimelineTab';

interface PatientDetailProps {
  patientId: string;
  onBack: () => void;
}

type TabType = 'anamnese' | 'odontograma' | 'budgets' | 'evolutions' | 'documents' | 'finance' | 'timeline';

export default function PatientDetail({ patientId, onBack }: PatientDetailProps) {
  const { patients, hiddenPII, logAction } = useDental();
  const [activeTab, setActiveTab] = useState<TabType>('timeline');

  const patient = patients.find(p => p.id === patientId);

  if (!patient) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 max-w-7xl mx-auto">
        Paciente não localizado no prontuário.
        <button onClick={onBack} className="block mt-4 mx-auto text-teal-600 font-bold hover:underline">Voltar à lista</button>
      </div>
    );
  }

  // Calculate age from birthdate
  const getAge = (birthDateStr: string) => {
    const today = new Date();
    const birthDate = new Date(birthDateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = getAge(patient.birthDate);

  // Tabs structure
  const TABS = [
    { id: 'timeline', label: 'Visão 360° (Timeline)', icon: <History className="w-4 h-4" /> },
    { id: 'anamnese', label: 'Ficha de Anamnese', icon: <Shield className="w-4 h-4" /> },
    { id: 'odontograma', label: 'Odontograma FDI', icon: <Activity className="w-4 h-4" /> },
    { id: 'evolutions', label: 'Evoluções Clínicas', icon: <Award className="w-4 h-4" /> },
    { id: 'budgets', label: 'Planos & Orçamentos', icon: <FileText className="w-4 h-4" /> },
    { id: 'documents', label: 'Pasta de Arquivos', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'finance', label: 'Financeiro Paciente', icon: <DollarSign className="w-4 h-4" /> }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'anamnese':
        return <AnamneseTab patient={patient} />;
      case 'odontograma':
        return <OdontogramTab patient={patient} />;
      case 'budgets':
        return <BudgetsTab patient={patient} />;
      case 'evolutions':
        return <EvolutionsTab patient={patient} />;
      case 'documents':
        return <DocumentsTab patient={patient} />;
      case 'finance':
        return <FinanceTab patient={patient} />;
      case 'timeline':
      default:
        return <TimelineTab patient={patient} />;
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto flex flex-col">
      
      {/* Back control & header card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        
        {/* Navigation row */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Prontuário</span>
          </button>

          <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 font-mono px-2 py-0.5 rounded uppercase font-bold">
            ID Prontuário: #{patient.id}
          </span>
        </div>

        {/* Patient Summary Card */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 text-xs">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-lg ring-4 ring-teal-50">
              {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-slate-800 text-lg">{patient.name}</h2>
                <span className={`px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded-full ${
                  patient.status === 'em_tratamento' ? 'bg-indigo-50 text-indigo-600' :
                  patient.status === 'ativo' ? 'bg-teal-50 text-teal-600' :
                  patient.status === 'concluido' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-rose-50 text-rose-600'
                }`}>
                  {patient.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-slate-400 font-medium font-mono mt-0.5">
                {age} Anos ({patient.birthDate}) | CPF: {hiddenPII ? '***.***.***-**' : patient.cpf}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 mt-2">
                <span className="flex items-center">
                  <Phone className="w-3.5 h-3.5 text-slate-400 mr-1" />
                  <span>{hiddenPII ? '***-***-***' : patient.phone}</span>
                  {!hiddenPII && (
                    <a
                      href={`https://wa.me/55${patient.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Enviar WhatsApp"
                      className="ml-1.5 inline-flex items-center justify-center p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded transition-colors"
                    >
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.166.001 6.141 1.233 8.375 3.469 2.235 2.235 3.465 5.212 3.465 8.381 0 6.533-5.322 11.859-11.851 11.859h-.019c-2.001-.002-3.97-.534-5.714-1.547L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.451 5.316 0 9.643-4.32 9.645-9.637C21.023 5.64 16.963 1.91 11.86 1.91c-5.102 0-9.25 4.15-9.25 9.254-.001 1.637.479 3.235 1.391 4.622L3.02 19.985l4.31-.131c-1.127.817-1.127.817-.683 1.3zm10.368-6.172c-.27-.135-1.597-.788-1.846-.879-.25-.09-.431-.135-.612.135-.181.271-.701.879-.859 1.06-.158.18-.315.2-.585.065-.27-.135-1.14-.42-2.172-1.341-.803-.715-1.346-1.6-1.504-1.872-.158-.271-.017-.418.118-.553.122-.122.27-.316.406-.473.135-.158.18-.271.271-.452.09-.18.045-.339-.022-.474-.068-.135-.612-1.474-.839-2.016-.221-.532-.443-.46-.612-.469-.158-.008-.339-.01-.52-.01-.18 0-.474.068-.721.339-.248.271-.947.925-.947 2.257s.969 2.616 1.104 2.8c.135.18 1.907 2.911 4.62 4.082.645.278 1.148.445 1.541.571.648.206 1.238.177 1.704.108.519-.077 1.597-.653 1.823-1.284.226-.631.226-1.173.158-1.284-.067-.112-.248-.18-.518-.315z"/>
                      </svg>
                    </a>
                  )}
                </span>
                <span className="flex items-center"><User className="w-3.5 h-3.5 text-slate-400 mr-1" /> Convênio: {patient.insuranceName || 'Particular'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 self-start md:self-center">
            {/* Quick action buttons */}
            <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl space-y-1 min-w-[150px]">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Última Consulta</span>
              <div className="flex items-center space-x-1 font-bold text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>05/01/2026</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Tabs navigation list */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1.5">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as TabType); }}
            className={`py-2.5 px-3.5 text-xs font-semibold rounded-t-xl transition-all flex items-center space-x-1.5 ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab screen render */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[400px]">
        {renderTabContent()}
      </div>

    </div>
  );
}
