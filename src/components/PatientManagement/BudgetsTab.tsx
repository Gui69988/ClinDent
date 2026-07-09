/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Phone,
  Printer,
  DollarSign
} from 'lucide-react';
import { useDental } from '../../context/DentalContext';
import { Patient, Budget, BudgetProcedure } from '../../types/dental';

interface BudgetsTabProps {
  patient: Patient;
}

const PRESET_PROCEDURES = [
  { name: 'Profilaxia e Raspagem (Limpeza)', value: 180 },
  { name: 'Restauração de Resina Fotopolimerizável', value: 250 },
  { name: 'Tratamento de Canal (Endodontia) Unirradicular', value: 680 },
  { name: 'Implante Dentário de Titânio (Pilar + Cirurgia)', value: 2400 },
  { name: 'Coroa Total de Zircônia', value: 1800 },
  { name: 'Aparelho Ortodôntico Autoligável (Instalação)', value: 850 }
];

export default function BudgetsTab({ patient }: BudgetsTabProps) {
  const { budgets, addBudget, updateBudgetStatus, logAction } = useDental();

  // Create budget form state
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [items, setItems] = useState<BudgetProcedure[]>([]);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [customTooth, setCustomTooth] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [installments, setInstallments] = useState<number>(1);
  const [budgetTitle, setBudgetTitle] = useState('Tratamento Estético Integrado');

  const patientBudgets = budgets.filter(b => b.patientId === patient.id);

  // Add item to active draft
  const handleAddItem = () => {
    const preset = PRESET_PROCEDURES[selectedPresetIndex];
    setItems(prev => [
      ...prev,
      {
        id: `bp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        procedureName: preset.name,
        toothNumber: customTooth ? Number(customTooth) : undefined,
        value: preset.value,
        status: 'planejado'
      }
    ]);
    setCustomTooth('');
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  // Submit budget
  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Por favor, adicione ao menos um procedimento ao orçamento.');
      return;
    }

    const subtotal = items.reduce((sum, item) => sum + item.value, 0);
    const finalValue = subtotal * (1 - discountPercent / 100);

    addBudget(patient.id, {
      title: budgetTitle,
      procedures: items,
      discountPercent,
      installments,
      totalValue: finalValue,
      paymentMethod: 'pix' // default method
    });

    setShowAddBudget(false);
    setItems([]);
    setDiscountPercent(0);
    setInstallments(1);
    setBudgetTitle('Tratamento Estético Integrado');
    alert('Orçamento gerado e salvo no prontuário digital com sucesso!');
  };

  // Share Budget via WhatsApp
  const shareBudgetWhatsApp = (budget: Budget) => {
    const phoneFormatted = patient.phone.replace(/[^0-9]/g, '');
    const message = `Olá, ${patient.name}! Preparamos a proposta do seu planejamento odontológico "${budget.title}".\n\n` +
      `Procedimentos:\n${budget.procedures.map(p => `• ${p.procedureName} ${p.toothNumber ? `(Dente ${p.toothNumber})` : ''}: R$ ${p.value.toFixed(2)}`).join('\n')}\n\n` +
      `Total com desconto: R$ ${budget.totalValue.toFixed(2)} em até ${budget.installments}x de R$ ${(budget.totalValue / budget.installments).toFixed(2)}.\n` +
      `Gostaria de aprovar e agendar o início do tratamento? Responda SIM.`;

    const url = `https://web.whatsapp.com/send?phone=55${phoneFormatted}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    logAction('share_budget_whatsapp', `Compartilhou proposta de orçamento #${budget.id} com o paciente via WhatsApp.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Controls */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center"><FileText className="w-4 h-4 mr-1.5 text-teal-600" /> Planos de Tratamento e Orçamentos</h3>
          <p className="text-xs text-slate-400">Monte, aprove e vincule parcelamentos de tratamentos</p>
        </div>
        
        <button
          onClick={() => setShowAddBudget(true)}
          className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-md shadow-teal-500/10"
        >
          <Plus className="w-3.5 h-3.5 text-slate-950" />
          <span>Criar Orçamento</span>
        </button>
      </div>

      {/* Grid of budgets */}
      <div className="space-y-4">
        {patientBudgets.length > 0 ? (
          patientBudgets.map(budget => (
            <div key={budget.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between relative">
              {/* Corner status */}
              <div className="absolute top-5 right-5 flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wider ${
                  budget.status === 'aprovado' ? 'bg-emerald-50 text-emerald-600' :
                  budget.status === 'recusado' ? 'bg-rose-50 text-rose-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {budget.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="text-xs text-slate-400 font-mono">Orçamento: #{budget.id} | Título: {budget.title} | Criado em: {budget.createdAt}</div>
                
                {/* List items inside budget */}
                <div className="border border-slate-100 rounded-lg overflow-hidden divide-y divide-slate-100">
                  {budget.procedures.map((proc, i) => (
                    <div key={i} className="p-3 bg-slate-50/40 flex justify-between text-xs font-semibold text-slate-700">
                      <span>{proc.procedureName} {proc.toothNumber ? `(Dente ${proc.toothNumber})` : ''}</span>
                      <span className="font-bold text-slate-800">R$ {proc.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing Summary */}
                <div className="pt-2 flex flex-col sm:flex-row sm:justify-between border-t border-slate-100 text-xs text-slate-500 gap-2">
                  <div className="space-y-1">
                    {budget.discountPercent > 0 && <p>Desconto Comercial: {budget.discountPercent}%</p>}
                    <p className="font-bold text-slate-800 text-sm">Valor Final: R$ {budget.totalValue.toFixed(2)} ({budget.installments}x de R$ {(budget.totalValue / budget.installments).toFixed(2)})</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2.5 self-end sm:self-center">
                    <button
                      onClick={() => shareBudgetWhatsApp(budget)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-indigo-600 text-xs font-semibold flex items-center space-x-1"
                      title="Compartilhar com o paciente via WhatsApp"
                    >
                      <Phone className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => alert('Contrato Clínico odontológico emitido em PDF!')}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
                      title="Imprimir contrato clínico"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {budget.status === 'pendente' && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            updateBudgetStatus(budget.id, 'aprovado');
                            alert('Orçamento Aprovado! As parcelas foram geradas automaticamente no contas a receber do paciente.');
                          }}
                          className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-[11px]"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => updateBudgetStatus(budget.id, 'recusado')}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-lg text-[11px]"
                        >
                          Recusar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-xs text-slate-400">
            Nenhum orçamento clínico gerado para este paciente. Clique em "Criar Orçamento" para iniciar.
          </div>
        )}
      </div>

      {/* MODAL: Create Budget form */}
      {showAddBudget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-semibold text-sm">Gerador de Orçamento</span>
              <button onClick={() => setShowAddBudget(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleCreateBudget} className="p-5 space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-600 font-medium mb-1">Título do Planejamento</label>
                <input
                  type="text"
                  value={budgetTitle}
                  onChange={(e) => setBudgetTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2 text-xs"
                />
              </div>

              {/* Selector preset item */}
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50 space-y-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Adicionar Procedimento</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <select
                      value={selectedPresetIndex}
                      onChange={(e) => setSelectedPresetIndex(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded p-1.5 bg-white text-xs"
                    >
                      {PRESET_PROCEDURES.map((p, i) => (
                        <option key={i} value={i}>{p.name} - R$ {p.value}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Dente"
                      value={customTooth}
                      onChange={(e) => setCustomTooth(e.target.value)}
                      className="w-full border border-slate-200 rounded p-1.5 bg-white font-mono"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-1.5 rounded transition-all"
                >
                  Incluir Procedimento no Plano
                </button>
              </div>

              {/* Draft List */}
              {items.length > 0 && (
                <div className="border border-slate-100 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="font-semibold text-slate-800">{item.procedureName}</span>
                        {item.toothNumber && <span className="text-[10px] text-teal-600 block">Dente selecionado: {item.toothNumber}</span>}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-700">R$ {item.value}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total settings */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Desconto (%)</label>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Parcelamento</label>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded p-2 bg-white"
                  >
                    <option value="1">À vista (Sem juros)</option>
                    <option value="2">2x</option>
                    <option value="3">3x</option>
                    <option value="4">4x</option>
                    <option value="5">5x</option>
                    <option value="6">6x</option>
                    <option value="10">10x</option>
                    <option value="12">12x</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBudget(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-lg"
                >
                  Salvar Proposta
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
