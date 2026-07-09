/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  Package,
  Activity,
  FileText,
  Shield,
  Eye,
  EyeOff,
  Briefcase,
  UserCheck,
  Folder,
  Database
} from 'lucide-react';
import { useDental } from '../context/DentalContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { currentUser, users, setCurrentUser, hiddenPII, setHiddenPII } = useDental();

  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard, roles: ['admin', 'dentista', 'recepcionista'] },
    { id: 'agenda', label: 'Agenda Clínica', icon: Calendar, roles: ['admin', 'dentista', 'recepcionista'] },
    { id: 'pacientes', label: 'Pacientes & Prontuários', icon: Users, roles: ['admin', 'dentista', 'recepcionista'] },
    { id: 'financeiro', label: 'Gestão Financeira', icon: DollarSign, roles: ['admin', 'recepcionista'] },
    { id: 'estoque', label: 'Estoque & Autoclave', icon: Package, roles: ['admin', 'recepcionista', 'dentista'] },
    { id: 'equipe', label: 'Equipe & CRO', icon: Briefcase, roles: ['admin'] },
    { id: 'seguranca', label: 'Auditoria & LGPD', icon: Shield, roles: ['admin'] }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen shrink-0 border-r border-slate-800">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-teal-500 text-slate-900 p-2 rounded-xl flex items-center justify-center font-bold text-xl tracking-wider shadow-lg shadow-teal-500/20">
          CD
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight text-white">ClinDent</h1>
          <span className="text-xs text-slate-400 font-mono tracking-wider">GESTÃO INTEGRADA</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 font-sans">
          Módulos Principais
        </div>
        {menuItems
          .filter(item => item.roles.includes(currentUser.role))
          .map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 font-semibold shadow-md shadow-teal-500/10'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
      </nav>

      {/* Canto inferior esquerdo: Gerenciamento Local */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <button
          onClick={() => setActiveTab('arquivos')}
          className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-150 ${
            activeTab === 'arquivos'
              ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-750 border border-slate-700/50'
          }`}
        >
          <Folder className={`w-4 h-4 shrink-0 ${activeTab === 'arquivos' ? 'text-slate-950' : 'text-teal-400'}`} />
          <div className="text-left">
            <p className="font-bold leading-none">Pastas Locais</p>
            <p className="text-[9px] text-slate-400 font-normal leading-none mt-1">Gerenciar armazenamento</p>
          </div>
        </button>
      </div>
    </aside>
  );
}
