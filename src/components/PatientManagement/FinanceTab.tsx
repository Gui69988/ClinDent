/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  QrCode,
  FileText
} from 'lucide-react';
import { useDental } from '../../context/DentalContext';
import { Patient } from '../../types/dental';

interface FinanceTabProps {
  patient: Patient;
}

export default function FinanceTab({ patient }: FinanceTabProps) {
  const { financials, updateFinancialStatus, logAction } = useDental();

  // Load finance items linked to this patient
  const patientRecords = financials.filter(f => f.patientId === patient.id);

  // Stats computation
  const totalPaid = patientRecords
    .filter(r => r.status === 'pago')
    .reduce((sum, r) => sum + r.value, 0);

  const totalPending = patientRecords
    .filter(r => r.status === 'pendente')
    .reduce((sum, r) => sum + r.value, 0);

  const totalOverdue = patientRecords
    .filter(r => r.status === 'atrasado')
    .reduce((sum, r) => sum + r.value, 0);

  return (
    <div className="space-y-6">
      
      {/* Patient billing banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-xs text-emerald-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Total Recebido / Pago</span>
          <span className="text-lg font-black text-emerald-700">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-xs text-amber-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Previsão Pendente (Parcelas)</span>
          <span className="text-lg font-black text-amber-700">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-xs text-rose-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Valores em Atraso</span>
          <span className={`text-lg font-black ${totalOverdue > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-500'}`}>
            R$ {totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Financial records table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-xs">Histórico Financeiro do Paciente</h3>
          <span className="text-[10px] text-slate-400 font-mono">Boletas, Carnês e Lançamentos</span>
        </div>

        {patientRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-medium">
                  <th className="py-2.5">Descrição do Lançamento</th>
                  <th className="py-2.5 font-mono">Categoria</th>
                  <th className="py-2.5">Data de Vencimento</th>
                  <th className="py-2.5">Pagamento</th>
                  <th className="py-2.5">Valor</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patientRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3 font-semibold text-slate-800">{rec.description}</td>
                    <td className="py-3 uppercase text-[10px] font-mono text-slate-500">{rec.category}</td>
                    <td className="py-3 text-slate-500 font-mono">{rec.dueDate}</td>
                    <td className="py-3 text-slate-500 font-mono">{rec.paymentDate || '-'}</td>
                    <td className="py-3 font-bold text-slate-800">R$ {rec.value.toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wider ${
                        rec.status === 'pago' ? 'bg-emerald-50 text-emerald-600' :
                        rec.status === 'atrasado' ? 'bg-rose-50 text-rose-600 animate-pulse' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {rec.status !== 'pago' && (
                        <button
                          onClick={() => {
                            updateFinancialStatus(rec.id, 'pago');
                            alert('Faturamento quitado com sucesso!');
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-2.5 py-1 rounded transition-colors text-[10px]"
                        >
                          Marcar como Pago
                        </button>
                      )}
                      
                      {rec.status === 'pago' && (
                        <button
                          onClick={() => {
                            alert('Impressão de recibo clínico de faturamento de serviço odontológico emitida com sucesso!');
                            logAction('print_receipt', `Gerou recibo fiscal para o paciente: ${patient.name}`);
                          }}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500"
                          title="Emitir Recibo do Tratamento"
                        >
                          <FileText className="w-4 h-4 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-xs text-slate-400">
            Nenhuma fatura de procedimento clínico ou orçamento gerada para este paciente.
          </div>
        )}
      </div>

    </div>
  );
}
