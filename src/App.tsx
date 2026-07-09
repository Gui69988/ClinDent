/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useDental, DentalProvider } from './context/DentalContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AgendaView from './components/Agenda/AgendaView';
import PatientList from './components/PatientManagement/PatientList';
import PatientDetail from './components/PatientManagement/PatientDetail';
import FinanceManagement from './components/Finance/FinanceManagement';
import StockManagement from './components/Stock/StockManagement';
import TeamManagement from './components/Team/TeamManagement';
import FileManager from './components/FileManager/FileManager';
import DatabaseDashboard from './components/Database/DatabaseDashboard';

// Subcomponent: Security / LGPD Audit Log (id: 'seguranca')
function AuditLogPanel() {
  const { auditLogs } = useDental();
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full">
      <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
        <div>
          <h2 className="font-bold text-slate-800 text-base">Painel de Auditoria e Conformidade LGPD</h2>
          <p className="text-xs text-slate-400">Tratamento de dados pessoais, rastreabilidade de acessos e termo de consentimento</p>
        </div>
        <span className="text-[10px] bg-teal-50 text-teal-700 font-mono px-2.5 py-1 rounded font-bold border border-teal-100">
          CONFORMIDADE ATIVA (ANPD)
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between text-xs font-semibold">
          <span>Relatório de Log de Operações de Prontuários (Acesso aos dados sensíveis)</span>
          <span className="text-[10px] text-teal-400">Tempo real</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-medium">
                <th className="py-2.5 px-4">Operador (Acesso)</th>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Ação executada</th>
                <th className="py-2.5 px-4">IP / Máquina</th>
                <th className="py-2.5 px-4">Detalhes da transação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {auditLogs.slice().reverse().map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800">{log.userId}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">{log.timestamp}</td>
                  <td className="py-3 px-4">
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 font-mono text-[9px] uppercase rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[10px]">{log.ipAddress}</td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Inner Application Shell with tabs routing
function AppShell() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'agenda':
        return <AgendaView />;
      case 'pacientes':
        return selectedPatientId ? (
          <PatientDetail patientId={selectedPatientId} onBack={() => setSelectedPatientId(null)} />
        ) : (
          <PatientList onPatientSelect={(id) => setSelectedPatientId(id)} />
        );
      case 'financeiro':
        return <FinanceManagement />;
      case 'estoque':
        return <StockManagement />;
      case 'equipe':
        return <TeamManagement />;
      case 'seguranca':
        return <AuditLogPanel />;
      case 'arquivos':
        return <FileManager />;
      case 'banco':
        return <DatabaseDashboard />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-600 antialiased">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => {
        setActiveTab(tab);
        setSelectedPatientId(null); // clear detail drilldown when jumping modules
      }} />

      {/* 2. Main Work Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Universal Header bar */}
        <Header onSearchSelect={(id) => {
          setSelectedPatientId(id);
          setActiveTab('pacientes'); // auto route to details
        }} />

        {/* Selected Clinical Screen Module */}
        <main className="flex-1 overflow-hidden bg-slate-50">
          {renderActiveModule()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DentalProvider>
      <AppShell />
    </DentalProvider>
  );
}
