/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  Info,
  RefreshCw,
  Award,
  AlertTriangle
} from 'lucide-react';
import { useDental, createDefaultOdontogram } from '../../context/DentalContext';
import { Patient, ToothState, ToothFaceState } from '../../types/dental';

interface OdontogramTabProps {
  patient: Patient;
}

// Upper teeth (Left to Right FDI: 18 -> 11, then 21 -> 28)
const UPPER_ARCH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
// Lower teeth (Left to Right FDI: 48 -> 41, then 31 -> 38)
const LOWER_ARCH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export default function OdontogramTab({ patient }: OdontogramTabProps) {
  const { odontograms, updateOdontogram, resetOdontogram, logAction } = useDental();

  // Load patient's specific odontogram state or default to fresh 32 adult teeth
  const patientTeeth = odontograms[patient.id] || createDefaultOdontogram();

  // Active condition brush selected by the dentist
  const [activeBrush, setActiveBrush] = useState<ToothFaceState>('carie');
  
  // Currently selected tooth for detailed diagnostic notes and anomalies
  const [selectedToothNum, setSelectedToothNum] = useState<number>(16);

  const selectedTooth = patientTeeth.find(t => t.toothNumber === selectedToothNum) || {
    toothNumber: selectedToothNum,
    faces: { oclusal: 'none', mesial: 'none', distal: 'none', vestibular: 'none', lingual: 'none' },
    anomalies: [],
    notes: ''
  };

  // Brush styling mapper
  const getFaceColorClass = (state: ToothFaceState) => {
    switch (state) {
      case 'carie':
        return 'fill-rose-500 hover:fill-rose-600 stroke-rose-600';
      case 'restaurado':
        return 'fill-sky-500 hover:fill-sky-600 stroke-sky-600';
      case 'planejado':
        return 'fill-amber-400 hover:fill-amber-500 stroke-amber-500';
      case 'canal_necessario':
        return 'fill-indigo-500 hover:fill-indigo-600 stroke-indigo-600';
      case 'canal_feito':
        return 'fill-teal-500 hover:fill-teal-600 stroke-teal-600';
      case 'none':
      default:
        return 'fill-slate-50 hover:fill-teal-50 hover:stroke-teal-400 stroke-slate-300';
    }
  };

  const handleFaceClick = (toothNum: number, faceKey: 'oclusal' | 'mesial' | 'distal' | 'vestibular' | 'lingual') => {
    const tooth = patientTeeth.find(t => t.toothNumber === toothNum);
    if (!tooth) return;
    
    // Toggle: if clicked face has the same state, revert to none, else paint with brush
    const nextState: ToothFaceState = tooth.faces[faceKey] === activeBrush ? 'none' : activeBrush;
    updateOdontogram(patient.id, toothNum, faceKey, nextState);
  };

  const handleAnomalyToggle = (toothNum: number, anomaly: 'ausente' | 'implante' | 'protese' | 'coroa') => {
    updateOdontogram(patient.id, toothNum, 'none', 'none', true, anomaly);
  };

  const handleClearOdontogram = () => {
    if (confirm('Tem certeza de que deseja redefinir todo o odontograma deste paciente?')) {
      resetOdontogram(patient.id);
    }
  };

  // Render individual tooth anatomical SVG
  const renderToothCell = (tooth: ToothState) => {
    const isAusente = tooth.anomalies.includes('ausente');
    const isImplante = tooth.anomalies.includes('implante');
    const isCoroa = tooth.anomalies.includes('coroa');
    const isProtese = tooth.anomalies.includes('protese');

    if (isAusente) {
      return (
        <div
          key={tooth.toothNumber}
          onClick={() => setSelectedToothNum(tooth.toothNumber)}
          className={`w-11 h-12 flex flex-col items-center justify-center border rounded-lg cursor-pointer transition-all ${
            selectedToothNum === tooth.toothNumber ? 'bg-slate-100 border-rose-500 ring-1 ring-rose-500/50' : 'bg-slate-50 border-slate-200'
          }`}
          title={`Dente ${tooth.toothNumber} - Ausente`}
        >
          <span className="text-[8px] font-bold font-mono text-slate-400">{tooth.toothNumber}</span>
          <span className="text-sm font-black text-rose-500 font-mono mt-0.5">X</span>
        </div>
      );
    }

    return (
      <div
        key={tooth.toothNumber}
        onClick={() => setSelectedToothNum(tooth.toothNumber)}
        className={`w-11 h-12 flex flex-col items-center justify-center border rounded-lg cursor-pointer transition-all relative ${
          selectedToothNum === tooth.toothNumber ? 'bg-teal-50/40 border-teal-500 ring-1 ring-teal-500/50' : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className="text-[8px] font-bold font-mono text-slate-400 select-none leading-none">{tooth.toothNumber}</span>
        
        {/* Anatomical 5-surface representation */}
        <svg viewBox="0 0 40 40" className="w-6 h-6 mt-0.5">
          {/* Top: Vestibular */}
          <polygon
            points="5,5 35,5 28,12 12,12"
            className={`${getFaceColorClass(tooth.faces.vestibular)} cursor-pointer transition-colors`}
            onClick={(e) => { e.stopPropagation(); handleFaceClick(tooth.toothNumber, 'vestibular'); }}
          />
          {/* Right: Distal */}
          <polygon
            points="35,5 35,35 28,28 28,12"
            className={`${getFaceColorClass(tooth.faces.distal)} cursor-pointer transition-colors`}
            onClick={(e) => { e.stopPropagation(); handleFaceClick(tooth.toothNumber, 'distal'); }}
          />
          {/* Bottom: Lingual */}
          <polygon
            points="5,35 35,35 28,28 12,28"
            className={`${getFaceColorClass(tooth.faces.lingual)} cursor-pointer transition-colors`}
            onClick={(e) => { e.stopPropagation(); handleFaceClick(tooth.toothNumber, 'lingual'); }}
          />
          {/* Left: Mesial */}
          <polygon
            points="5,5 5,35 12,28 12,12"
            className={`${getFaceColorClass(tooth.faces.mesial)} cursor-pointer transition-colors`}
            onClick={(e) => { e.stopPropagation(); handleFaceClick(tooth.toothNumber, 'mesial'); }}
          />
          {/* Center: Oclusal */}
          <rect
            x="12" y="12" width="16" height="16"
            className={`${getFaceColorClass(tooth.faces.oclusal)} cursor-pointer transition-colors`}
            onClick={(e) => { e.stopPropagation(); handleFaceClick(tooth.toothNumber, 'oclusal'); }}
          />
        </svg>

        {/* Anomaly quick-indicator dots */}
        <div className="absolute bottom-0.5 right-0.5 flex gap-0.5">
          {isImplante && <div className="w-1.5 h-1.5 bg-sky-500 rounded-full" title="Implante integrado" />}
          {isCoroa && <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" title="Coroa protética" />}
          {isProtese && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" title="Prótese fixa" />}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Legend & Brush selection */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-500">Selecione um diagnóstico clínico abaixo para pintar as superfícies no mapa:</span>
        </div>

        {/* Diagnostic Brush Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveBrush('carie')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
              activeBrush === 'carie' ? 'bg-rose-500 text-white shadow-xs' : 'bg-slate-50 border border-slate-200 text-slate-600'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
            <span>Cárie (Patologia)</span>
          </button>

          <button
            onClick={() => setActiveBrush('restaurado')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
              activeBrush === 'restaurado' ? 'bg-sky-500 text-white shadow-xs' : 'bg-slate-50 border border-slate-200 text-slate-600'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-white" />
            <span>Restauração Concluída</span>
          </button>

          <button
            onClick={() => setActiveBrush('planejado')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
              activeBrush === 'planejado' ? 'bg-amber-400 text-slate-900 shadow-xs' : 'bg-slate-50 border border-slate-200 text-slate-600'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
            <span>Procedimento Planejado</span>
          </button>

          <button
            onClick={() => setActiveBrush('canal_necessario')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
              activeBrush === 'canal_necessario' ? 'bg-indigo-500 text-white shadow-xs' : 'bg-slate-50 border border-slate-200 text-slate-600'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-white" />
            <span>Canal Indicado</span>
          </button>
        </div>
      </div>

      {/* Anatomical Dental Arch rendering */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs overflow-x-auto space-y-6">
        
        {/* Upper Arch */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center border-b border-slate-100 pb-1.5">Maxilar Superior</span>
          <div className="flex justify-center gap-1">
            {UPPER_ARCH.map(num => {
              const tooth = patientTeeth.find(t => t.toothNumber === num) || {
                toothNumber: num,
                faces: { oclusal: 'none', mesial: 'none', distal: 'none', vestibular: 'none', lingual: 'none' },
                anomalies: []
              };
              return renderToothCell(tooth);
            })}
          </div>
        </div>

        {/* Lower Arch */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center border-b border-slate-100 pb-1.5">Mandíbula Inferior</span>
          <div className="flex justify-center gap-1">
            {LOWER_ARCH.map(num => {
              const tooth = patientTeeth.find(t => t.toothNumber === num) || {
                toothNumber: num,
                faces: { oclusal: 'none', mesial: 'none', distal: 'none', vestibular: 'none', lingual: 'none' },
                anomalies: []
              };
              return renderToothCell(tooth);
            })}
          </div>
        </div>

      </div>

      {/* Selected tooth parameters */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div>
          <h4 className="font-bold text-slate-800 text-sm">Status do Dente #{selectedToothNum}</h4>
          <p className="text-slate-400 mt-1">Marque ausência ou implante estrutural que afete a arcada inteira.</p>
          <button
            type="button"
            onClick={handleClearOdontogram}
            className="mt-3 text-[11px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Redefinir Todo o Mapa</span>
          </button>
        </div>

        {/* Anomalies checkrow */}
        <div className="flex flex-col gap-2">
          <label className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">Alterações Estruturais</label>
          
          <button
            onClick={() => handleAnomalyToggle(selectedToothNum, 'ausente')}
            className={`w-full py-2 px-3 border rounded-lg text-left font-semibold transition-all ${
              selectedTooth.anomalies.includes('ausente') ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/40'
            }`}
          >
            <span>{selectedTooth.anomalies.includes('ausente') ? '✓ Dente Ausente' : 'Marcar como Dente Ausente'}</span>
          </button>

          <button
            onClick={() => handleAnomalyToggle(selectedToothNum, 'implante')}
            className={`w-full py-2 px-3 border rounded-lg text-left font-semibold transition-all ${
              selectedTooth.anomalies.includes('implante') ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/40'
            }`}
          >
            <span>{selectedTooth.anomalies.includes('implante') ? '✓ Implante Integrado' : 'Marcar como Implante'}</span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">Próteses & Reabilitações</label>
          
          <button
            onClick={() => handleAnomalyToggle(selectedToothNum, 'coroa')}
            className={`w-full py-2 px-3 border rounded-lg text-left font-semibold transition-all ${
              selectedTooth.anomalies.includes('coroa') ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/40'
            }`}
          >
            <span>{selectedTooth.anomalies.includes('coroa') ? '✓ Coroa Concluída' : 'Marcar como Coroa'}</span>
          </button>

          <button
            onClick={() => handleAnomalyToggle(selectedToothNum, 'protese')}
            className={`w-full py-2 px-3 border rounded-lg text-left font-semibold transition-all ${
              selectedTooth.anomalies.includes('protese') ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/40'
            }`}
          >
            <span>{selectedTooth.anomalies.includes('protese') ? '✓ Prótese Fixa' : 'Marcar como Prótese'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
