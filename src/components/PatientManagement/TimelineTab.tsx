/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Activity,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  FolderOpen
} from 'lucide-react';
import { useDental } from '../../context/DentalContext';
import { Patient } from '../../types/dental';

interface TimelineTabProps {
  patient: Patient;
}

interface TimelineEvent {
  date: string;
  type: 'agenda' | 'evolution' | 'document' | 'budget' | 'financial';
  title: string;
  details: string;
  meta?: string;
}

export default function TimelineTab({ patient }: TimelineTabProps) {
  const { appointments, financials, budgets, evolutions, documents } = useDental();

  // 1. Gather all events from the different arrays in the central state
  const events: TimelineEvent[] = [];

  // Appointments
  appointments
    .filter(a => a.patientId === patient.id)
    .forEach(a => {
      events.push({
        date: a.date,
        type: 'agenda',
        title: 'Consulta Agendada',
        details: `Consulta com ${a.dentistName} às ${a.time}. Status: ${a.status.toUpperCase()}`,
        meta: `Cadeira ${a.chairNumber}`
      });
    });

  // Clinical Evolutions
  evolutions
    .filter(e => e.patientId === patient.id)
    .forEach(e => {
      events.push({
        date: e.date,
        type: 'evolution',
        title: 'Evolução Clínica Registrada',
        details: `${e.procedurePerformed}: ${e.clinicalNotes}`,
        meta: `Autor: ${e.dentistName} (${e.dentistCro})`
      });
    });

  // Documents
  documents
    .filter(d => d.patientId === patient.id)
    .forEach(d => {
      events.push({
        date: d.uploadedAt,
        type: 'document',
        title: 'Documento / Radiografia Importado',
        details: `Arquivo "${d.name}" carregado na pasta digital na categoria "${d.category.toUpperCase()}"`,
        meta: 'Criptografado'
      });
    });

  // Budgets
  budgets
    .filter(b => b.patientId === patient.id)
    .forEach(b => {
      events.push({
        date: b.createdAt,
        type: 'budget',
        title: 'Proposta de Tratamento Gerada',
        details: `Orçamento "${b.title}" de R$ ${b.totalValue.toFixed(2)} em ${b.installments} parcelas. Status: ${b.status.toUpperCase()}`,
        meta: `${b.procedures.length} procedimentos inclusos`
      });
    });

  // Financials
  financials
    .filter(f => f.patientId === patient.id)
    .forEach(f => {
      events.push({
        date: f.dueDate,
        type: 'financial',
        title: f.type === 'receita' ? 'Fatura Gerada / Receita' : 'Despesa Vinculada',
        details: `${f.description}. Valor: R$ ${f.value.toFixed(2)} | Status: ${f.status.toUpperCase()}`,
        meta: f.category.toUpperCase()
      });
    });

  // Sort events chronologically (most recent first)
  const sortedEvents = events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Icon selector
  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'agenda':
        return <Calendar className="w-4 h-4 text-sky-500" />;
      case 'evolution':
        return <Activity className="w-4 h-4 text-teal-500" />;
      case 'document':
        return <FolderOpen className="w-4 h-4 text-amber-500" />;
      case 'budget':
        return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'financial':
        return <DollarSign className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      
      <div className="border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-sm">Linha do Tempo Integrada (Visão 360°)</h3>
        <p className="text-xs text-slate-400">Linha cronológica completa consolidando diagnósticos, agendas, propostas e histórico de pagamentos</p>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-100 before:pointer-events-none">
        {sortedEvents.length > 0 ? (
          sortedEvents.map((event, idx) => (
            <div key={idx} className="relative pl-9 flex items-start space-x-4">
              
              {/* Timeline dot */}
              <div className="absolute left-1.5 top-1.5 p-1 rounded-full bg-white border border-slate-200 shadow-2xs z-10 flex items-center justify-center">
                {getEventIcon(event.type)}
              </div>

              <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] font-mono">
                  <span className="font-bold text-slate-700">{event.title}</span>
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(event.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-normal">{event.details}</p>
                {event.meta && (
                  <span className="inline-block bg-slate-50 border text-slate-400 text-[9px] px-2 py-0.5 rounded font-mono">
                    {event.meta}
                  </span>
                )}
              </div>

            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-xs text-slate-400">
            Nenhuma atividade registrada na linha do tempo.
          </div>
        )}
      </div>

    </div>
  );
}
