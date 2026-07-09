/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  Plus,
  Award,
  Lock
} from 'lucide-react';
import { useDental } from '../../context/DentalContext';
import { Patient, ClinicalEvolution } from '../../types/dental';

interface EvolutionsTabProps {
  patient: Patient;
}

export default function EvolutionsTab({ patient }: EvolutionsTabProps) {
  const { evolutions, addEvolution, users, stock } = useDental();

  // Create evolution form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [procedure, setProcedure] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [dentistId, setDentistId] = useState('');
  
  // Selected stock material
  const [selectedStockId, setSelectedStockId] = useState('');

  // Retrieve clinical evolutions linked to this patient from central state list
  const patientEvolutions = evolutions.filter(e => e.patientId === patient.id);

  const handleCreateEvolution = (e: React.FormEvent) => {
    e.preventDefault();
    const dentist = users.find(u => u.id === dentistId);
    
    if (dentist) {
      const selectedItem = stock.find(s => s.id === selectedStockId);
      const materials = selectedItem ? [selectedItem.name] : [];

      addEvolution(patient.id, {
        dentistId: dentist.id,
        dentistName: dentist.name,
        dentistCro: dentist.cro || 'CRO-SP 00000',
        procedurePerformed: procedure,
        clinicalNotes,
        materialsUsed: materials,
        isLocked: true,
        signatureBase64: `Assinado eletronicamente por ${dentist.name} - ${dentist.cro}`
      });

      setShowAddForm(false);
      setProcedure('');
      setClinicalNotes('');
      setDentistId('');
      setSelectedStockId('');
      alert('Evolução clínica registrada e assinada no prontuário digital com sucesso!');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Controls */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center"><Activity className="w-4 h-4 mr-1.5 text-teal-600" /> Diário de Evolução Clínica</h3>
          <p className="text-xs text-slate-400">Linha do tempo de procedimentos realizados na cadeira</p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-md shadow-teal-500/10"
        >
          <Plus className="w-3.5 h-3.5 text-slate-950" />
          <span>Evoluir Tratamento</span>
        </button>
      </div>

      {/* Evolutions logs */}
      <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-100 before:pointer-events-none">
        {patientEvolutions.length > 0 ? (
          patientEvolutions.map((evo) => (
            <div key={evo.id} className="relative pl-8 space-y-2">
              
              {/* Timeline bubble bullet */}
              <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full border-2 border-teal-500 bg-white" />

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2 text-[10px] text-slate-400 font-mono">
                  <span>Data: {new Date(evo.date).toLocaleString('pt-BR')}</span>
                  <span className="flex items-center text-teal-600 font-bold bg-teal-50/50 px-2 py-0.5 rounded border border-teal-100">
                    <Award className="w-3.5 h-3.5 mr-1" />
                    {evo.dentistName} ({evo.dentistCro})
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-slate-800 font-bold text-xs">{evo.procedurePerformed}</p>
                  <p className="text-slate-600 text-xs leading-relaxed">{evo.clinicalNotes}</p>
                </div>

                {/* Materials consumed listing */}
                {evo.materialsUsed && evo.materialsUsed.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Insumos consumidos:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {evo.materialsUsed.map((mat, idx) => (
                        <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-600 font-mono text-[9px] px-2 py-0.5 rounded">
                          {mat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {evo.isLocked && (
                  <div className="flex items-center text-[10px] text-teal-600 font-bold font-mono">
                    <Lock className="w-3 h-3 mr-1" />
                    <span>Registro Homologado - Assinatura Eletrônica Ativa</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-xs text-slate-400">
            Nenhuma evolução clínica anotada para este paciente. Clique em "Evoluir Tratamento" para adicionar.
          </div>
        )}
      </div>

      {/* MODAL: Add Clinical Evolution */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-semibold text-sm">Registrar Evolução Clínica</span>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleCreateEvolution} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Dentista Responsável</label>
                <select
                  value={dentistId}
                  onChange={(e) => setDentistId(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white"
                >
                  <option value="">Selecione o dentista...</option>
                  {users.filter(u => u.role === 'dentista' || u.role === 'admin').map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.cro})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Procedimento Realizado</label>
                <input
                  type="text"
                  value={procedure}
                  onChange={(e) => setProcedure(e.target.value)}
                  placeholder="Ex: Restauração de resina dente 16"
                  required
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Relatório Clinico (Notas complementares)</label>
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Ex: Realizada profilaxia e raspagem supra-gengival..."
                  required
                  className="w-full border border-slate-200 rounded-lg p-2.5 min-h-[90px]"
                />
              </div>

              {/* Materials integration */}
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50 space-y-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Baixa de Insumo no Estoque (Opcional)</span>
                <select
                  value={selectedStockId}
                  onChange={(e) => setSelectedStockId(e.target.value)}
                  className="w-full border border-slate-200 rounded p-1.5 bg-white text-[11px]"
                >
                  <option value="">Nenhum material usado</option>
                  {stock.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Qtd: {s.quantity})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg"
                >
                  Registrar e Assinar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
