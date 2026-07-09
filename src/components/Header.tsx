/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Bell, MapPin, ShieldCheck, HelpCircle } from 'lucide-react';
import { useDental } from '../context/DentalContext';

interface HeaderProps {
  onSearchSelect: (patientId: string) => void;
}

export default function Header({ onSearchSelect }: HeaderProps) {
  const { patients, currentUser, appointments } = useDental();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Filter patients based on query
  const filteredPatients = searchQuery
    ? patients.filter(
        p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.cpf.includes(searchQuery) ||
          p.phone.includes(searchQuery)
      )
    : [];

  // Custom dental-focused notification trigger
  const pendingAppointmentsCount = appointments.filter(a => a.status === 'aguardando_confirmacao').length;
  const [activeNotifications, setActiveNotifications] = useState([
    { id: 1, title: 'Confirmação Pendente', desc: `Existem ${pendingAppointmentsCount} consultas aguardando resposta de WhatsApp.`, type: 'info' },
    { id: 2, title: 'Alerta de Estoque', desc: 'Resina Fotopolimerizável A2 atingiu a quantidade mínima.', type: 'warning' },
    { id: 3, title: 'Auditoria Regularizada', desc: 'Backup georreferenciado e criptografado com sucesso às 04:00.', type: 'success' }
  ]);

  const handleNotificationClick = (id: number) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handlePatientSelect = (id: string) => {
    onSearchSelect(id);
    setSearchQuery('');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-30 relative shadow-sm">
      {/* Global Search */}
      <div className="relative w-96">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Busca global de paciente (Nome, CPF ou Celular)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
        />
        
        {/* Search Results Dropdown */}
        {searchQuery && (
          <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
            {filteredPatients.length > 0 ? (
              <div className="py-1">
                <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Pacientes Encontrados ({filteredPatients.length})
                </div>
                {filteredPatients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePatientSelect(p.id)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-400 font-mono">CPF: {p.cpf} | Cel: {p.phone}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      p.status === 'em_tratamento' ? 'bg-indigo-50 text-indigo-600' :
                      p.status === 'ativo' ? 'bg-teal-50 text-teal-600' :
                      p.status === 'concluido' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">
                Nenhum paciente encontrado com esses termos.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Info & Actions */}
      <div className="flex items-center space-x-6">
        {/* Security / LGPD Compliance Status Badge */}
        <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 bg-teal-50/70 border border-teal-100 rounded-full text-xs text-teal-700">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
          <span className="font-medium">LGPD Ativo (Criptografado)</span>
        </div>

        {/* Notifications Icon with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {activeNotifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-700">Notificações Recentes</span>
                <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full font-bold">
                  {activeNotifications.length} Ativas
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {activeNotifications.length > 0 ? (
                  activeNotifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n.id)}
                      className="p-3 hover:bg-slate-50 cursor-pointer transition-colors relative group"
                      title="Clique para descartar"
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-teal-600 transition-colors">
                          {n.title}
                        </p>
                        <span className={`w-1.5 h-1.5 rounded-full mt-1 ${
                          n.type === 'warning' ? 'bg-amber-400' :
                          n.type === 'success' ? 'bg-emerald-400' : 'bg-indigo-400'
                        }`}></span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">{n.desc}</p>
                      <span className="absolute right-3 bottom-1.5 text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Descartar ✕
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">Nenhuma notificação pendente.</p>
                )}
              </div>
              <div className="px-4 py-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-medium text-teal-500 hover:text-teal-600"
                >
                  Fechar Painel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
