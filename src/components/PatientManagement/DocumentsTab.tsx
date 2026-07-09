/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Folder,
  FileText,
  Upload,
  Image as ImageIcon,
  Columns,
  ZoomIn,
  ZoomOut,
  Sliders
} from 'lucide-react';
import { useDental } from '../../context/DentalContext';
import { Patient, DocumentFile } from '../../types/dental';

interface DocumentsTabProps {
  patient: Patient;
}

export default function DocumentsTab({ patient }: DocumentsTabProps) {
  const { documents, addDocument } = useDental();

  const [activeFolder, setActiveFolder] = useState<'exames' | 'radiografias' | 'contratos' | 'sorriso' | 'gto'>('radiografias');
  
  // Filtered documents linked to this patient in the active folder
  const filteredDocs = documents.filter(d => d.patientId === patient.id && d.category === activeFolder);

  // Image interactive visualizer state
  const [selectedDoc, setSelectedDoc] = useState<DocumentFile | null>(null);

  // Compare mode side-by-side (Antes vs Depois)
  const [compareMode, setCompareMode] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [showRuler, setShowRuler] = useState(false); // millimetric ruler

  const currentSelected = selectedDoc || filteredDocs[0] || null;

  // Simulate file upload
  const handleSimulatedUpload = (category: typeof activeFolder) => {
    const urls = {
      radiografias: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=600',
      exames: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
      contratos: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=600',
      sorriso: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=600',
      gto: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=600'
    };

    const name = `${category.toUpperCase()}_IMPLANTE_${Math.floor(100 + Math.random() * 900)}.jpg`;
    const url = urls[category];
    const size = '1.4 MB';

    addDocument(patient.id, name, category, url, size, 'Importado automaticamente via upload simulado.');
    alert(`Arquivo "${name}" importado e criptografado na pasta digital do paciente com sucesso!`);
  };

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar: Digital Folders */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Pasta Digital</span>
            
            <button
              onClick={() => { setActiveFolder('radiografias'); setSelectedDoc(null); }}
              className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold flex items-center space-x-2.5 transition-colors ${
                activeFolder === 'radiografias' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20" />
              <span>Radiografias & Panorâmicas</span>
            </button>

            <button
              onClick={() => { setActiveFolder('sorriso'); setSelectedDoc(null); }}
              className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold flex items-center space-x-2.5 transition-colors ${
                activeFolder === 'sorriso' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              <span>Antes e Depois (Estética)</span>
            </button>

            <button
              onClick={() => { setActiveFolder('exames'); setSelectedDoc(null); }}
              className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold flex items-center space-x-2.5 transition-colors ${
                activeFolder === 'exames' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20" />
              <span>Laudos & Tomografias</span>
            </button>

            <button
              onClick={() => { setActiveFolder('contratos'); setSelectedDoc(null); }}
              className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold flex items-center space-x-2.5 transition-colors ${
                activeFolder === 'contratos' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Contratos & Termos</span>
            </button>

            <button
              onClick={() => { setActiveFolder('gto'); setSelectedDoc(null); }}
              className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold flex items-center space-x-2.5 transition-colors ${
                activeFolder === 'gto' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Folder className="w-4 h-4 text-amber-600 fill-amber-600/20" />
              <span>Gto's (Guias de Autorização)</span>
            </button>
          </div>

          {/* Quick upload trigger */}
          <button
            onClick={() => handleSimulatedUpload(activeFolder)}
            className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-xs"
          >
            <Upload className="w-4 h-4 text-teal-400" />
            <span>Importar para {activeFolder}</span>
          </button>
        </div>

        {/* Core display Area: Visualizer or Thumbnails list */}
        <div className="lg:col-span-3 space-y-4 text-xs">
          
          {/* Thumbnails grid */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-3">Documentos Criptografados nesta Pasta ({filteredDocs.length})</span>
            
            {filteredDocs.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => { setSelectedDoc(doc); setZoomScale(1); }}
                    className={`border rounded-lg p-1.5 cursor-pointer transition-all ${
                      currentSelected?.id === doc.id ? 'border-teal-500 ring-1 ring-teal-500/50 bg-teal-50/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="h-20 bg-slate-100 rounded-md overflow-hidden relative">
                      <img src={doc.fileUrl} alt={doc.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-700 truncate mt-1.5 px-0.5">{doc.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 font-medium">Nenhum documento salvo nesta pasta.</div>
            )}
          </div>

          {/* Detailed Diagnostic Tool Center (Section 1.3 - Pasta Digital) */}
          {currentSelected && (
            <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-xs">{currentSelected.name}</h4>
                  <p className="text-[9px] text-slate-400 font-mono">Modo de Diagnóstico Ativo</p>
                </div>

                {/* Toolbar controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCompareMode(!compareMode)}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                      compareMode ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    title="Ativar Comparador Antes vs Depois"
                  >
                    <Columns className="w-4 h-4" />
                    <span>Antes/Depois</span>
                  </button>

                  <button
                    onClick={() => setShowRuler(!showRuler)}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                      showRuler ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    title="Ativar Régua de Medição Clínica de Reabsorção Óssea"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Régua Diagnóstica</span>
                  </button>

                  <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                    <button onClick={() => setZoomScale(p => Math.max(0.5, p - 0.25))} className="p-1 text-slate-400 hover:text-white"><ZoomOut className="w-3.5 h-3.5" /></button>
                    <span className="text-[10px] px-1.5 py-1 font-mono">{Math.round(zoomScale * 100)}%</span>
                    <button onClick={() => setZoomScale(p => Math.min(3, p + 0.25))} className="p-1 text-slate-400 hover:text-white"><ZoomIn className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>

              {/* Central canvas visualizer */}
              <div className="h-80 bg-black/90 rounded-xl relative overflow-hidden flex items-center justify-center border border-slate-800">
                
                {/* Compare Side by Side Mode */}
                {compareMode ? (
                  <div className="w-full h-full grid grid-cols-2 divide-x divide-slate-800">
                    <div className="relative h-full flex flex-col justify-between p-3">
                      <img src="https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=600" alt="Antes" className="absolute inset-0 w-full h-full object-cover opacity-75" referrerPolicy="no-referrer" />
                      <span className="z-10 bg-rose-500 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase self-start">Estado Inicial (Antes)</span>
                    </div>
                    <div className="relative h-full flex flex-col justify-between p-3">
                      <img src={currentSelected.fileUrl} alt="Depois" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <span className="z-10 bg-emerald-500 text-slate-950 px-2 py-0.5 rounded text-[9px] font-bold uppercase self-start">Resultado Atual (Depois)</span>
                    </div>
                  </div>
                ) : (
                  // Single view with interactive transform scale
                  <div className="relative transition-transform" style={{ transform: `scale(${zoomScale})` }}>
                    <img src={currentSelected.fileUrl} alt={currentSelected.name} className="max-h-72 object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}

                {/* Overlaid Millimetric Ruler (Régua de Medição) (Section 1.3) */}
                {showRuler && !compareMode && (
                  <div className="absolute inset-x-10 bottom-10 bg-slate-900/95 border border-teal-500/50 p-3 rounded-lg shadow-xl text-xs space-y-2 z-20">
                    <div className="flex justify-between items-center text-[10px] text-teal-400 uppercase tracking-wider font-bold">
                      <span>Régua Milimetrada de Calibração Bone loss / Estética</span>
                      <button onClick={() => setShowRuler(false)} className="text-slate-400 hover:text-white">✕</button>
                    </div>
                    
                    {/* Visual Ruler markings bar */}
                    <div className="relative bg-teal-500/20 h-8 rounded border border-teal-500/30 flex items-end px-2 select-none overflow-hidden">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div
                          key={i}
                          className="bg-teal-400"
                          style={{
                            height: i % 10 === 0 ? '75%' : i % 5 === 0 ? '50%' : '30%',
                            width: '1px',
                            marginLeft: '4.5px'
                          }}
                        />
                      ))}
                      {/* Interactive indicator overlay */}
                      <div className="absolute top-1 left-12 text-[10px] font-mono text-teal-300 font-bold bg-slate-950 px-1 py-0.5 rounded border border-teal-500/20">
                        Dimensão Calculada: 8.4 mm (Ajuste Ósseo Seguro)
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400">Arraste para ajustar o referencial anatômico da coroa ou crista alveolar.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
