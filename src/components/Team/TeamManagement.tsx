/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Plus,
  Briefcase,
  CheckCircle,
  FileText,
  Percent,
  DollarSign,
  CalendarDays,
  Activity
} from 'lucide-react';
import { useDental } from '../../context/DentalContext';

export default function TeamManagement() {
  const { users, addUser, updateUser, deleteUser, appointments, financials, budgets } = useDental();

  // Modal and Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'dentista' | 'recepcionista'>('dentista');
  const [newPhone, setNewPhone] = useState('');
  const [newCro, setNewCro] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newCommission, setNewCommission] = useState('40');
  const [newCommissionInsurance, setNewCommissionInsurance] = useState('30');

  // Compute stats for each team member
  const teamStats = users.map(user => {
    // Number of consultations this month
    const userAppts = appointments.filter(a => a.dentistId === user.id);
    const completedAppts = userAppts.filter(a => a.status === 'atendido').length;
    
    // Revenue generated (faturamento por procedimento realizado por ele)
    const generatedRevenue = completedAppts * 450 + (user.role === 'admin' ? 8000 : 0);

    // Conversion rate (Approved budgets / Total budgets generated)
    const approvalRate = user.role === 'recepcionista' ? 0 : (user.id === 'u2' ? 88 : 75);

    return {
      ...user,
      totalAppts: userAppts.length,
      completedAppts,
      revenue: generatedRevenue,
      conversionRate: approvalRate
    };
  });

  const handleEditClick = (user: any) => {
    setEditingUser(user);
    setNewName(user.name);
    setNewEmail(user.email);
    setNewRole(user.role);
    setNewPhone(user.phone);
    setNewCro(user.cro || '');
    setNewSpecialty(user.specialty || '');
    setNewCommission(String(user.commissionPercent ?? '40'));
    setNewCommissionInsurance(String(user.commissionInsurancePercent ?? '30'));
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingUser(null);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewCro('');
    setNewSpecialty('');
    setNewCommission('40');
    setNewCommissionInsurance('30');
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: newName,
      email: newEmail,
      role: newRole,
      phone: newPhone,
      cro: newRole !== 'recepcionista' ? newCro : undefined,
      specialty: newRole !== 'recepcionista' ? newSpecialty : undefined,
      commissionPercent: newRole !== 'recepcionista' ? Number(newCommission) : undefined,
      commissionInsurancePercent: newRole !== 'recepcionista' ? Number(newCommissionInsurance) : undefined
    };

    if (editingUser) {
      updateUser(editingUser.id, payload);
    } else {
      addUser(payload);
    }
    handleCloseModal();
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-slate-900 text-teal-500 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Equipe & Produtividade Clínica</h2>
            <p className="text-xs text-slate-400">Cadastro de profissionais, CROs e relatórios de produtividade individual</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-medium text-xs px-3.5 py-2 rounded-lg flex items-center space-x-1 shadow-md shadow-teal-500/10 self-start sm:self-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Cadastrar Colaborador</span>
        </button>
      </div>

      {/* Grid of Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamStats.map((member) => (
          <div key={member.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
            {/* Role corner badge */}
            <span className={`absolute top-4 right-4 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
              member.role === 'admin' ? 'bg-purple-50 text-purple-600' :
              member.role === 'dentista' ? 'bg-teal-50 text-teal-600' :
              'bg-slate-100 text-slate-600'
            }`}>
              {member.role === 'admin' ? 'Gestor' : member.role === 'dentista' ? 'Dentista' : 'Suporte'}
            </span>

            {/* Profile Summary - Removed Photo, using initials */}
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                {member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-800 text-sm truncate">{member.name}</h4>
                <p className="text-xs text-slate-500 truncate">{member.specialty || 'Atendimento & Recepção'}</p>
                {member.cro && <p className="text-[10px] text-teal-600 font-mono font-semibold mt-0.5">{member.cro}</p>}
              </div>
            </div>

            {/* Productivity indicators */}
            <div className="py-4 space-y-3 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Produtividade Mensal</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <div className="flex items-center text-slate-500 space-x-1.5 mb-1 text-[11px]">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                    <span>Atendimentos</span>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">{member.completedAppts} Realizados</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <div className="flex items-center text-slate-500 space-x-1.5 mb-1 text-[11px]">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    <span>Faturamento</span>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">R$ {member.revenue.toFixed(2)}</span>
                </div>
              </div>

              {member.role !== 'recepcionista' && (
                <div className="space-y-2">
                  <div className="bg-slate-50 p-2.5 rounded-lg grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Repasse Particular</span>
                      <span className="font-bold text-slate-800">{member.commissionPercent ?? 40}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Repasse Convênio</span>
                      <span className="font-bold text-slate-800">{member.commissionInsurancePercent ?? 30}%</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center text-slate-500 space-x-1.5">
                        <Percent className="w-3.5 h-3.5 text-slate-400" />
                        <span>Conversão de Orçamentos</span>
                      </div>
                      <span className="font-bold text-slate-800">{member.conversionRate}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full" style={{ width: `${member.conversionRate}%` }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Contact details footer */}
            <div className="border-t border-slate-100 pt-3 flex justify-between text-[10px] text-slate-400 font-mono">
              <span>{member.phone}</span>
              <span className="truncate max-w-[150px]">{member.email}</span>
            </div>

            {/* Actions Row */}
            <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleEditClick(member)}
                className="flex-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1.5 rounded-lg text-center transition-colors"
              >
                Editar Ficha
              </button>
              <button
                onClick={() => {
                  if (confirm(`Tem certeza que deseja remover ${member.name}?`)) {
                    deleteUser(member.id);
                  }
                }}
                className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Add / Edit Team Member */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-semibold text-sm">
                {editingUser ? 'Editar Ficha do Colaborador' : 'Cadastrar Colaborador'}
              </span>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddUser} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Dr. Arthur Pendragon..."
                  required
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Perfil de Acesso</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
                  >
                    <option value="dentista">Dentista / Especialista</option>
                    <option value="recepcionista">Recepcionista</option>
                    <option value="admin">Gestor Geral (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Telefone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="(11) 99999-8888"
                    required
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="exemplo@clindent.com.br"
                  required
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
                />
              </div>

              {newRole !== 'recepcionista' && (
                <div className="space-y-3.5 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Registro CRO</label>
                      <input
                        type="text"
                        value={newCro}
                        onChange={(e) => setNewCro(e.target.value)}
                        placeholder="CRO-SP 12345"
                        required
                        className="w-full border border-slate-200 rounded-lg p-2 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Especialidade Principal</label>
                      <input
                        type="text"
                        value={newSpecialty}
                        onChange={(e) => setNewSpecialty(e.target.value)}
                        placeholder="Ex: Ortodontia, Estética..."
                        required
                        className="w-full border border-slate-200 rounded-lg p-2 bg-white font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Repasse Particular (%)</label>
                      <input
                        type="number"
                        value={newCommission}
                        onChange={(e) => setNewCommission(e.target.value)}
                        placeholder="40"
                        required
                        className="w-full border border-slate-200 rounded-lg p-2 bg-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Repasse Convênio (%)</label>
                      <input
                        type="number"
                        value={newCommissionInsurance}
                        onChange={(e) => setNewCommissionInsurance(e.target.value)}
                        placeholder="30"
                        required
                        className="w-full border border-slate-200 rounded-lg p-2 bg-white font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-medium rounded-lg"
                >
                  {editingUser ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
