/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  QrCode,
  FileText,
  Percent,
  TrendingUp,
  CreditCard,
  Building,
  Activity,
  Edit,
  Trash2
} from 'lucide-react';
import { useDental } from '../../context/DentalContext';
import { FinancialRecord } from '../../types/dental';

export default function FinanceManagement() {
  const {
    financials,
    addFinancialRecord,
    updateFinancialStatus,
    updateFinancialRecord,
    deleteFinancialRecord,
    patients,
    users,
    currentUnit,
    logAction
  } = useDental();

  const [activeTab, setActiveTab] = useState<'lancamentos' | 'comissoes' | 'convenios'>('lancamentos');
  
  // Filter States
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pago' | 'pendente' | 'atrasado'>('all');

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState<'receita' | 'despesa'>('receita');
  const [newCategory, setNewCategory] = useState('procedimento');
  const [newDescription, setNewDescription] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPatientId, setNewPatientId] = useState('');
  const [newDentistId, setNewDentistId] = useState('');
  const [newInsuranceName, setNewInsuranceName] = useState('Amil Dental');
  
  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [editType, setEditType] = useState<'receita' | 'despesa'>('receita');
  const [editCategory, setEditCategory] = useState('procedimento');
  const [editDescription, setEditDescription] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPatientId, setEditPatientId] = useState('');
  const [editDentistId, setEditDentistId] = useState('');
  const [editInsuranceName, setEditInsuranceName] = useState('Amil Dental');
  const [editStatus, setEditStatus] = useState<FinancialRecord['status']>('pendente');

  const handleOpenEdit = (rec: FinancialRecord) => {
    setEditingRecord(rec);
    setEditType(rec.type);
    setEditCategory(rec.category);
    setEditDescription(rec.description);
    setEditValue(rec.value.toString());
    setEditDueDate(rec.dueDate);
    setEditPatientId(rec.patientId || '');
    setEditDentistId(rec.dentistCommissionId || '');
    setEditInsuranceName(rec.insuranceName || 'Amil Dental');
    setEditStatus(rec.status);
    setShowEditModal(true);
  };

  const handleEditRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord) {
      const patientObj = patients.find(p => p.id === editPatientId);
      updateFinancialRecord(editingRecord.id, {
        type: editType,
        category: editCategory,
        description: editDescription,
        value: Number(editValue),
        dueDate: editDueDate,
        patientId: editPatientId || undefined,
        patientName: patientObj?.name || undefined,
        dentistCommissionId: editCategory === 'comissão' ? editDentistId : undefined,
        insuranceName: editCategory === 'glosa' ? editInsuranceName : undefined,
        status: editStatus
      });
      setShowEditModal(false);
      setEditingRecord(null);
    }
  };
  
  // Pix/Boleto Generator Modal
  const [activeBill, setActiveBill] = useState<FinancialRecord | null>(null);

  // Stats computation
  const totalReceitas = financials
    .filter(f => f.type === 'receita' && f.status === 'pago')
    .reduce((sum, f) => sum + f.value, 0);

  const totalDespesas = financials
    .filter(f => f.type === 'despesa' && f.status === 'pago')
    .reduce((sum, f) => sum + f.value, 0);

  const pendingReceivables = financials
    .filter(f => f.type === 'receita' && f.status === 'pendente')
    .reduce((sum, f) => sum + f.value, 0);

  const pastDueReceivables = financials
    .filter(f => f.type === 'receita' && f.status === 'atrasado')
    .reduce((sum, f) => sum + f.value, 0);

  // Filter records
  const filteredRecords = financials.filter(f => {
    const matchesType = filterType === 'all' || f.type === filterType;
    const matchesStatus = filterStatus === 'all' || f.status === filterStatus;
    const matchesUnit = f.unitId === currentUnit || f.category === 'comissão'; // Commissions can span
    return matchesType && matchesStatus && matchesUnit;
  });

  // Handle addition
  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const patientObj = patients.find(p => p.id === newPatientId);
    
    addFinancialRecord({
      patientId: newPatientId || undefined,
      patientName: patientObj?.name || undefined,
      type: newType,
      category: newCategory,
      description: newDescription,
      value: Number(newValue),
      dueDate: newDueDate,
      unitId: currentUnit,
      dentistCommissionId: newCategory === 'comissão' ? newDentistId : undefined,
      insuranceName: newCategory === 'glosa' ? newInsuranceName : undefined
    });

    setShowAddModal(false);
    // reset
    setNewDescription('');
    setNewValue('');
    setNewDueDate('');
    setNewPatientId('');
    setNewDentistId('');
    setNewInsuranceName('Amil Dental');
  };

  // Commission dynamic metrics (Arthur: 35%, Guinevere: 40%, Carlos: 50% on their respective appointments/procedures)
  const dentistCommissions = users
    .filter(u => u.role === 'dentista' || u.role === 'admin')
    .map(dentist => {
      // Find payments linked to patient or commissions already calculated
      const paidProceduresValue = financials
        .filter(f => f.type === 'receita' && f.status === 'pago' && f.category === 'procedimento' && f.patientName)
        .reduce((sum, f) => sum + f.value, 0);

      // Estimate total generated
      const rate = dentist.commissionPercent || 40;
      const calculatedTotal = (paidProceduresValue / 3) * (rate / 100); // Mock share

      // Actual logged commission records
      const paidCommission = financials
        .filter(f => f.type === 'despesa' && f.category === 'comissão' && f.dentistCommissionId === dentist.id && f.status === 'pago')
        .reduce((sum, f) => sum + f.value, 0);

      const pendingCommission = financials
        .filter(f => f.type === 'despesa' && f.category === 'comissão' && f.dentistCommissionId === dentist.id && f.status === 'pendente')
        .reduce((sum, f) => sum + f.value, 0);

      return {
        ...dentist,
        generated: calculatedTotal || 1500,
        paid: paidCommission,
        pending: pendingCommission
      };
    });

  // Convênios mock data faturamento with dynamic glosas aggregated
  const amilGlosas = financials
    .filter(f => f.category === 'glosa' && f.insuranceName === 'Amil Dental')
    .reduce((sum, f) => sum + f.value, 0);

  const sulAmericaGlosas = financials
    .filter(f => f.category === 'glosa' && f.insuranceName === 'SulAmérica Odonto')
    .reduce((sum, f) => sum + f.value, 0);

  const bradescoGlosas = financials
    .filter(f => f.category === 'glosa' && f.insuranceName === 'Bradesco Dental')
    .reduce((sum, f) => sum + f.value, 0);

  const insuranceBillings = [
    { name: 'Amil Dental', claimsCount: 24, submittedValue: 4800, paidValue: 4500, glosaValue: 300 + amilGlosas, status: 300 + amilGlosas > 300 ? 'revisao_glosa' : 'repasse_parcial' },
    { name: 'SulAmérica Odonto', claimsCount: 15, submittedValue: 3200, paidValue: 3200, glosaValue: sulAmericaGlosas, status: sulAmericaGlosas > 0 ? 'revisao_glosa' : 'pago_integral' },
    { name: 'Bradesco Dental', claimsCount: 18, submittedValue: 4100, paidValue: 3800, glosaValue: 300 + bradescoGlosas, status: 'revisao_glosa' }
  ];

  // Trigger invoice/NFS-e generation
  const handleGenerateInvoice = (record: FinancialRecord) => {
    record.nfeNumber = `NF-2026${Math.floor(100 + Math.random() * 900)}`;
    record.nfeStatus = 'emitida';
    logAction('emit_nfse', `Emitida Nota Fiscal de Serviço Eletrônica (NFS-e) para ${record.patientName || 'Clínica'}: ${record.nfeNumber}`);
    alert(`NFS-e ${record.nfeNumber} gerada com sucesso e integrada à prefeitura!`);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto">
      
      {/* Financial summary banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Receitas Pagas</p>
          <div className="flex items-center space-x-2 mt-2">
            <div className="p-1 bg-emerald-50 text-emerald-600 rounded">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Despesas Pagas</p>
          <div className="flex items-center space-x-2 mt-2">
            <div className="p-1 bg-rose-50 text-rose-600 rounded">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Previsão Pendente</p>
          <div className="flex items-center space-x-2 mt-2">
            <div className="p-1 bg-amber-50 text-amber-600 rounded">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">R$ {pendingReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inadimplência (Atrasados)</p>
          <div className="flex items-center space-x-2 mt-2">
            <div className="p-1 bg-rose-50 text-rose-600 rounded animate-pulse">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">R$ {pastDueReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-2 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('lancamentos')}
              className={`py-3 text-xs font-semibold border-b-2 px-1 transition-colors ${
                activeTab === 'lancamentos' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Livro Caixa (Lançamentos)
            </button>
            <button
              onClick={() => setActiveTab('comissoes')}
              className={`py-3 text-xs font-semibold border-b-2 px-1 transition-colors ${
                activeTab === 'comissoes' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Comissões de Dentistas
            </button>
            <button
              onClick={() => setActiveTab('convenios')}
              className={`py-3 text-xs font-semibold border-b-2 px-1 transition-colors ${
                activeTab === 'convenios' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Gestão de Convênios
            </button>
          </div>

          {activeTab === 'lancamentos' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-medium text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-md shadow-teal-500/10"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Lançamento</span>
            </button>
          )}
        </div>

        {/* Tab 1: Lancamentos */}
        {activeTab === 'lancamentos' && (
          <div className="p-6">
            {/* Table Filters */}
            <div className="flex flex-wrap items-center space-x-4 mb-4 text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Filtrar por:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="border border-slate-200 rounded p-1 bg-white"
              >
                <option value="all">Todas as transações</option>
                <option value="receita">Apenas Receitas</option>
                <option value="despesa">Apenas Despesas</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="border border-slate-200 rounded p-1 bg-white"
              >
                <option value="all">Todos os status</option>
                <option value="pago">Pagas / Recebidas</option>
                <option value="pendente">Pendentes</option>
                <option value="atrasado">Atrasadas</option>
              </select>
            </div>

            {/* List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-medium">
                    <th className="py-2.5">Descrição</th>
                    <th className="py-2.5">Categoria</th>
                    <th className="py-2.5">Vencimento</th>
                    <th className="py-2.5">Pagamento</th>
                    <th className="py-2.5">Valor</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3">
                        <div className="font-semibold text-slate-800">{rec.description}</div>
                        {rec.patientName && <div className="text-[10px] text-slate-400">Paciente: {rec.patientName}</div>}
                      </td>
                      <td className="py-3">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 font-mono text-[10px] uppercase rounded">
                          {rec.category}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 font-mono">{rec.dueDate}</td>
                      <td className="py-3 text-slate-500 font-mono">{rec.paymentDate || '-'}</td>
                      <td className={`py-3 font-bold ${rec.type === 'receita' ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {rec.type === 'receita' ? '+' : '-'} R$ {rec.value.toFixed(2)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full font-semibold uppercase text-[9px] tracking-wider ${
                          rec.status === 'pago' ? 'bg-emerald-50 text-emerald-600' :
                          rec.status === 'atrasado' ? 'bg-rose-50 text-rose-600 animate-pulse' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-1.5">
                        {/* Simulate Pix / QR Code for receivables */}
                        {rec.type === 'receita' && rec.status !== 'pago' && (
                          <button
                            onClick={() => setActiveBill(rec)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-teal-600 transition-colors"
                            title="Gerar Cobrança Pix / Boleto"
                          >
                            <QrCode className="w-4 h-4 inline" />
                          </button>
                        )}
                        
                        {/* NFS-e Action */}
                        {rec.type === 'receita' && rec.status === 'pago' && !rec.nfeNumber && (
                          <button
                            onClick={() => handleGenerateInvoice(rec)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                            title="Emitir Nota Fiscal NFS-e"
                          >
                            <FileText className="w-4 h-4 inline" />
                          </button>
                        )}

                        {rec.nfeNumber && (
                          <span className="text-[10px] text-emerald-600 font-mono bg-emerald-50 px-1.5 py-0.5 rounded" title="NFS-e Emitida">
                            {rec.nfeNumber}
                          </span>
                        )}

                        {rec.status !== 'pago' && (
                          <button
                            onClick={() => updateFinancialStatus(rec.id, 'pago')}
                            className="text-[10px] bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-semibold px-2 py-1 rounded transition-colors"
                          >
                            Quitar
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEdit(rec)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-teal-600 transition-colors"
                          title="Editar Lançamento"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm('Deseja realmente excluir este lançamento financeiro?')) {
                              deleteFinancialRecord(rec.id);
                            }
                          }}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition-colors"
                          title="Excluir Lançamento"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Comissoes de Dentistas */}
        {activeTab === 'comissoes' && (
          <div className="p-6 space-y-6">
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="font-semibold text-slate-800">Regra Geral de Comissionamento</h4>
                <p className="text-slate-500 leading-normal mt-1">
                  Os repasses são calculados dinamicamente com base nas receitas efetivamente recebidas (pagas) dos pacientes, de acordo com o percentual cadastrado no contrato de cada profissional.
                </p>
              </div>
              <div className="flex items-center space-x-1 text-teal-600 font-bold bg-white px-3 py-2 border border-teal-100 rounded-lg">
                <Percent className="w-4 h-4" />
                <span>Cálculo Automatizado</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {dentistCommissions.map(dentist => (
                <div key={dentist.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                    <img src={dentist.avatarUrl} alt={dentist.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h4 className="font-semibold text-slate-800 text-xs">{dentist.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{dentist.cro} | {dentist.specialty}</p>
                    </div>
                  </div>

                  <div className="py-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contrato:</span>
                      <span className="font-semibold text-slate-700">{dentist.commissionPercent}% de comissão</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Produzido (Mês):</span>
                      <span className="font-bold text-slate-700">R$ {dentist.generated.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Repasses Quitados:</span>
                      <span className="font-bold text-emerald-600">R$ {dentist.paid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pendente de Liberação:</span>
                      <span className="font-bold text-amber-600">R$ {dentist.pending.toFixed(2)}</span>
                    </div>
                  </div>

                  {dentist.pending > 0 && (
                    <button
                      onClick={() => {
                        // Find and pay the pending commissions
                        const recs = financials.filter(f => f.type === 'despesa' && f.category === 'comissão' && f.dentistCommissionId === dentist.id && f.status === 'pendente');
                        recs.forEach(r => updateFinancialStatus(r.id, 'pago'));
                        alert(`Repasse de comissão para ${dentist.name} efetuado com sucesso!`);
                      }}
                      className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold py-2 rounded-lg transition-colors text-xs text-center"
                    >
                      Liberar Comissões Pendentes
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Gestao de Convenios */}
        {activeTab === 'convenios' && (
          <div className="p-6 space-y-6">
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs">
              <h4 className="font-semibold text-slate-800">Processamento de Guias de Convênios (GTO)</h4>
              <p className="text-slate-500 leading-normal mt-1">
                Acompanhe o faturamento de guias, glosas (cortes injustificados do convênio) e recursos enviados.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-medium">
                    <th className="py-2.5">Convênio</th>
                    <th className="py-2.5">Guias Faturadas</th>
                    <th className="py-2.5">Valor Enviado</th>
                    <th className="py-2.5">Valor Recebido</th>
                    <th className="py-2.5 text-rose-500">Glosas Aplicadas</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {insuranceBillings.map((bill, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-semibold text-slate-800">{bill.name}</td>
                      <td className="py-3 font-mono">{bill.claimsCount} guias</td>
                      <td className="py-3 font-semibold text-slate-700">R$ {bill.submittedValue.toFixed(2)}</td>
                      <td className="py-3 font-semibold text-emerald-600">R$ {bill.paidValue.toFixed(2)}</td>
                      <td className="py-3 font-semibold text-rose-500 font-mono">R$ {bill.glosaValue.toFixed(2)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full font-semibold uppercase text-[9px] tracking-wider ${
                          bill.status === 'pago_integral' ? 'bg-emerald-50 text-emerald-600' :
                          bill.status === 'revisao_glosa' ? 'bg-rose-50 text-rose-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {bill.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {bill.glosaValue > 0 && (
                          <button
                            onClick={() => {
                              alert(`Recurso de Glosa enviado eletronicamente para o convênio ${bill.name}!`);
                              logAction('appeal_glosa', `Entrou com recurso de glosa contra o convênio: ${bill.name}`);
                            }}
                            className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold px-2 py-1 rounded transition-colors"
                          >
                            Recorrer Glosa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Detalhamento de Glosas */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                Histórico Detalhado de Glosas Aplicadas (Erros em Guia / Procedimento)
              </h4>
              
              {financials.filter(f => f.category === 'glosa').length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-medium">
                        <th className="py-2">Data Lançamento</th>
                        <th className="py-2">Convênio</th>
                        <th className="py-2">Paciente Vinculado</th>
                        <th className="py-2">Descrição / Motivo do Erro</th>
                        <th className="py-2 text-rose-600">Valor Glosado</th>
                        <th className="py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {financials.filter(f => f.category === 'glosa').map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-mono text-slate-500">{f.dueDate}</td>
                          <td className="py-2.5 font-semibold text-slate-700">{f.insuranceName}</td>
                          <td className="py-2.5 text-slate-600">{f.patientName || 'Não Vinculado'}</td>
                          <td className="py-2.5 text-slate-500 italic">{f.description}</td>
                          <td className="py-2.5 font-bold text-rose-600 font-mono">R$ {f.value.toFixed(2)}</td>
                          <td className="py-2.5 text-right">
                            <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[9px] bg-amber-50 text-amber-700 border border-amber-200">
                              Em Análise
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">Nenhuma glosa adicional lançada recentemente.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Add Record */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-semibold text-sm">Adicionar Lançamento Financeiro</span>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddRecord} className="p-5 space-y-4 text-xs">
              <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setNewType('receita'); setNewCategory('procedimento'); }}
                  className={`flex-1 text-center py-1.5 text-xs rounded font-medium transition-colors ${
                    newType === 'receita' ? 'bg-white text-emerald-600 font-bold shadow-xs' : 'text-slate-500 hover:bg-white/50'
                  }`}
                >
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => { setNewType('despesa'); setNewCategory('fornecedor'); }}
                  className={`flex-1 text-center py-1.5 text-xs rounded font-medium transition-colors ${
                    newType === 'despesa' ? 'bg-white text-rose-600 font-bold shadow-xs' : 'text-slate-500 hover:bg-white/50'
                  }`}
                >
                  Despesa
                </button>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Categoria</label>
                {newType === 'receita' ? (
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none"
                  >
                    <option value="procedimento">Procedimento Clínico</option>
                    <option value="convenio">Repasse de Convênio</option>
                    <option value="glosa">Glosa de Convênio (Guia/Procedimento com erro)</option>
                    <option value="outros">Outras Receitas</option>
                  </select>
                ) : (
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none"
                  >
                    <option value="fornecedor">Fornecedores / Materiais</option>
                    <option value="laboratorio">Laboratório de Prótese</option>
                    <option value="aluguel">Aluguel / Infraestrutura</option>
                    <option value="comissão">Repasse de Comissão</option>
                    <option value="outros">Outros Custos</option>
                  </select>
                )}
              </div>

              {newCategory === 'glosa' && (
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Convênio Vinculado *</label>
                  <select
                    value={newInsuranceName}
                    onChange={(e) => setNewInsuranceName(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none"
                  >
                    <option value="Amil Dental">Amil Dental</option>
                    <option value="SulAmérica Odonto">SulAmérica Odonto</option>
                    <option value="Bradesco Dental">Bradesco Dental</option>
                  </select>
                </div>
              )}

              {newCategory === 'comissão' && (
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Dentista para Comissão</label>
                  <select
                    value={newDentistId}
                    onChange={(e) => setNewDentistId(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none"
                  >
                    <option value="">Selecione...</option>
                    {users.filter(u => u.role === 'dentista' || u.role === 'admin').map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {newType === 'receita' && (
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Vincular Paciente (Opcional)</label>
                  <select
                    value={newPatientId}
                    onChange={(e) => setNewPatientId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none"
                  >
                    <option value="">Nenhum</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-medium mb-1">Descrição</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ex: Compra de Resina, Mensalidade Ortodontia..."
                  required
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="250.00"
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Data Vencimento</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-medium rounded-lg"
                >
                  Lançar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Record */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-semibold text-sm">Editar Lançamento Financeiro</span>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleEditRecord} className="p-5 space-y-4 text-xs">
              <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setEditType('receita'); setEditCategory('procedimento'); }}
                  className={`flex-1 text-center py-1.5 text-xs rounded font-medium transition-colors ${
                    editType === 'receita' ? 'bg-white text-emerald-600 font-bold shadow-xs' : 'text-slate-500 hover:bg-white/50'
                  }`}
                >
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => { setEditType('despesa'); setEditCategory('fornecedor'); }}
                  className={`flex-1 text-center py-1.5 text-xs rounded font-medium transition-colors ${
                    editType === 'despesa' ? 'bg-white text-rose-600 font-bold shadow-xs' : 'text-slate-500 hover:bg-white/50'
                  }`}
                >
                  Despesa
                </button>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Categoria</label>
                {editType === 'receita' ? (
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none"
                  >
                    <option value="procedimento">Procedimento Clínico</option>
                    <option value="convenio">Repasse de Convênio</option>
                    <option value="glosa">Glosa de Convênio (Guia/Procedimento com erro)</option>
                    <option value="outros">Outras Receitas</option>
                  </select>
                ) : (
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none"
                  >
                    <option value="fornecedor">Fornecedores / Materiais</option>
                    <option value="laboratorio">Laboratório de Prótese</option>
                    <option value="aluguel">Aluguel / Infraestrutura</option>
                    <option value="comissão">Repasse de Comissão</option>
                    <option value="outros">Outros Custos</option>
                  </select>
                )}
              </div>

              {editCategory === 'glosa' && (
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Convênio Vinculado *</label>
                  <select
                    value={editInsuranceName}
                    onChange={(e) => setEditInsuranceName(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none"
                  >
                    <option value="Amil Dental">Amil Dental</option>
                    <option value="SulAmérica Odonto">SulAmérica Odonto</option>
                    <option value="Bradesco Dental">Bradesco Dental</option>
                  </select>
                </div>
              )}

              {editCategory === 'comissão' && (
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Dentista para Comissão</label>
                  <select
                    value={editDentistId}
                    onChange={(e) => setEditDentistId(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none"
                  >
                    <option value="">Selecione...</option>
                    {users.filter(u => u.role === 'dentista' || u.role === 'admin').map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {editType === 'receita' && (
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Vincular Paciente (Opcional)</label>
                  <select
                    value={editPatientId}
                    onChange={(e) => setEditPatientId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none"
                  >
                    <option value="">Nenhum</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-medium mb-1">Descrição</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Ex: Compra de Resina..."
                  required
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="250.00"
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Status Pagamento</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago / Quitado</option>
                    <option value="atrasado">Atrasado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Data Vencimento</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BILL MODAL: Pix QR Code and Boleto Generator */}
      {activeBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-100 overflow-hidden text-center p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Cobrança e Faturamento</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Cobrança vinculada à transação:<br/>
              <span className="font-semibold text-slate-700">{activeBill.description}</span>
            </p>

            {/* Generated Pix details */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3.5 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-teal-600 tracking-wider">Pix Copia e Cola / QRCode</span>
              <div className="w-36 h-36 bg-slate-300 rounded-lg flex items-center justify-center border border-slate-200 relative">
                {/* Visual Simulation of QR Code using clean CSS styling */}
                <div className="absolute inset-2 bg-white p-2 border border-slate-200 grid grid-cols-4 gap-1 opacity-90">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className={`rounded-xs ${i % 3 === 0 || i % 5 === 0 ? 'bg-slate-900' : 'bg-transparent'}`} />
                  ))}
                </div>
                <div className="w-8 h-8 bg-teal-500 rounded-lg text-slate-950 font-black text-center pt-1 z-10 text-xs">PIX</div>
              </div>
              <p className="font-mono text-[9px] break-all bg-white p-2 border border-slate-100 rounded text-slate-500 select-all leading-normal">
                00020101021226830014br.gov.bcb.pix2561pix.clindent.com/recebivel/{activeBill.id}
              </p>
            </div>

            <div className="flex space-x-2.5">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`00020101021226830014br.gov.bcb.pix2561pix.clindent.com/recebivel/${activeBill.id}`);
                  alert('Pix copia e cola copiado!');
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-xs font-semibold"
              >
                Copiar Pix
              </button>
              <button
                onClick={() => {
                  alert('Simulação de PDF de Boleto Bancário enviada por WhatsApp para o paciente!');
                  logAction('send_boleto_whatsapp', `Enviou link de boleto para o paciente: ${activeBill.patientName}`);
                  setActiveBill(null);
                }}
                className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 py-2 rounded-lg text-xs font-semibold"
              >
                Enviar Boleto
              </button>
            </div>

            <button onClick={() => setActiveBill(null)} className="text-xs font-medium text-slate-400 hover:text-slate-600 block mx-auto pt-2">
              Voltar ao financeiro
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
