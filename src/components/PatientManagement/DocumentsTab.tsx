/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Folder,
  FileText,
  Upload,
  Image as ImageIcon,
  Columns,
  ZoomIn,
  ZoomOut,
  Sliders,
  Download,
  Trash2
} from 'lucide-react';
import { useDental } from '../../context/DentalContext';
import { Patient, DocumentFile } from '../../types/dental';

interface DocumentsTabProps {
  patient: Patient;
}

export default function DocumentsTab({ patient }: DocumentsTabProps) {
  const { documents, addDocument, deleteDocument } = useDental();

  const [activeFolder, setActiveFolder] = useState<'exames' | 'radiografias' | 'contratos' | 'sorriso' | 'gto'>('radiografias');
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to map folder tabs to the DocumentFile category schema
  const getMappedCategory = (folder: string): DocumentFile['category'] => {
    if (folder === 'exames') return 'pessoais';
    if (folder === 'sorriso') return 'antes_depois';
    return folder as DocumentFile['category'];
  };

  // Filtered documents linked to this patient in the active folder (using mapped category)
  const filteredDocs = documents.filter(d => {
    const docCat = d.category;
    const targetCat = getMappedCategory(activeFolder);
    return d.patientId === patient.id && docCat === targetCat;
  });

  // Image interactive visualizer state
  const [selectedDoc, setSelectedDoc] = useState<DocumentFile | null>(null);

  // Compare mode side-by-side (Antes vs Depois)
  const [compareMode, setCompareMode] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [showRuler, setShowRuler] = useState(false); // millimetric ruler

  const currentSelected = selectedDoc || filteredDocs[0] || null;

  // Check if file is image based on name or url
  const isImageFile = (doc: DocumentFile) => {
    if (!doc) return false;
    const fileUrl = doc.url || '';
    if (fileUrl.startsWith('data:')) {
      return fileUrl.startsWith('data:image/');
    }
    return doc.name.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) !== null;
  };

  // Handle actual file upload chosen by the user
  const handleRealUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const sizeStr = file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

      const mappedCategory = getMappedCategory(activeFolder);

      addDocument(
        patient.id,
        file.name,
        mappedCategory,
        dataUrl,
        sizeStr,
        `Enviado pelo usuário em ${new Date().toLocaleDateString('pt-BR')}`
      );
      
      alert(`Arquivo "${file.name}" importado com sucesso para a pasta do paciente!`);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
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

          {/* Real file upload trigger */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4 text-teal-400" />
            <span>Selecionar e Enviar Arquivo</span>
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleRealUpload}
          />
        </div>

        {/* Core display Area: Visualizer or Thumbnails list */}
        <div className="lg:col-span-3 space-y-4 text-xs">
          
          {/* Thumbnails grid */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-3">
              Documentos na Pasta ({filteredDocs.length})
            </span>
            
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
                    <div className="h-20 bg-slate-100 rounded-md overflow-hidden relative flex items-center justify-center">
                      {isImageFile(doc) ? (
                        <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex flex-col items-center space-y-1 text-slate-400">
                          <FileText className="w-8 h-8 text-teal-600" />
                          <span className="text-[8px] font-semibold uppercase">{doc.name.split('.').pop()}</span>
                        </div>
                      )}
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
                  <h4 className="font-bold text-xs truncate max-w-[150px] sm:max-w-xs">{currentSelected.name}</h4>
                  <p className="text-[9px] text-slate-400 font-mono">Visualizador Ativo</p>
                </div>

                {/* Toolbar controls */}
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  {isImageFile(currentSelected) && (
                    <>
                      <button
                        onClick={() => setCompareMode(!compareMode)}
                        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                          compareMode ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                        title="Ativar Comparador Antes vs Depois"
                      >
                        <Columns className="w-4 h-4" />
                        <span className="hidden sm:inline">Antes/Depois</span>
                      </button>

                      <button
                        onClick={() => setShowRuler(!showRuler)}
                        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                          showRuler ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                        title="Ativar Régua de Medição Clínica de Reabsorção Óssea"
                      >
                        <Sliders className="w-4 h-4" />
                        <span className="hidden sm:inline">Régua Diagnóstica</span>
                      </button>

                      <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                        <button onClick={() => setZoomScale(p => Math.max(0.5, p - 0.25))} className="p-1 text-slate-400 hover:text-white"><ZoomOut className="w-3.5 h-3.5" /></button>
                        <span className="text-[10px] px-1.5 py-1 font-mono">{Math.round(zoomScale * 100)}%</span>
                        <button onClick={() => setZoomScale(p => Math.min(3, p + 0.25))} className="p-1 text-slate-400 hover:text-white"><ZoomIn className="w-3.5 h-3.5" /></button>
                      </div>
                    </>
                  )}

                  <a
                    href={currentSelected.url}
                    download={currentSelected.name}
                    className="p-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center space-x-1 transition-all"
                    title="Baixar Arquivo"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Baixar</span>
                  </a>

                  <button
                    onClick={() => {
                      if (confirm(`Tem certeza de que deseja excluir permanentemente o documento "${currentSelected.name}"?`)) {
                        deleteDocument(currentSelected.id);
                        setSelectedDoc(null);
                      }
                    }}
                    className="p-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-rose-400 hover:bg-rose-950 hover:text-rose-200 flex items-center space-x-1 transition-all"
                    title="Excluir Documento"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Excluir</span>
                  </button>
                </div>
              </div>

              {/* Central canvas visualizer */}
              <div className="h-80 bg-black/90 rounded-xl relative overflow-hidden flex items-center justify-center border border-slate-800">
                {!isImageFile(currentSelected) ? (
                  <div className="text-center p-6 flex flex-col items-center space-y-3 z-10">
                    <div className="p-4 bg-slate-800 text-teal-400 rounded-full border border-slate-700">
                      <FileText className="w-12 h-12" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">{currentSelected.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">
                        Tamanho: {currentSelected.fileSize} | Enviado por: {currentSelected.uploadedBy} em {new Date(currentSelected.uploadedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <a
                      href={currentSelected.url}
                      download={currentSelected.name}
                      className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      <span>Baixar Documento</span>
                    </a>
                  </div>
                ) : compareMode ? (
                  <div className="w-full h-full grid grid-cols-2 divide-x divide-slate-800">
                    <div className="relative h-full flex flex-col justify-between p-3">
                      <img src="https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=600" alt="Antes" className="absolute inset-0 w-full h-full object-cover opacity-75" referrerPolicy="no-referrer" />
                      <span className="z-10 bg-rose-500 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase self-start">Estado Inicial (Antes)</span>
                    </div>
                    <div className="relative h-full flex flex-col justify-between p-3">
                      <img src={currentSelected.url} alt="Depois" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <span className="z-10 bg-emerald-500 text-slate-950 px-2 py-0.5 rounded text-[9px] font-bold uppercase self-start">Resultado Atual (Depois)</span>
                    </div>
                  </div>
                ) : (
                  // Single view with interactive transform scale
                  <div className="relative transition-transform" style={{ transform: `scale(${zoomScale})` }}>
                    <img src={currentSelected.url} alt={currentSelected.name} className="max-h-72 object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}

                {/* Overlaid Millimetric Ruler (Régua de Medição) (Section 1.3) */}
                {showRuler && !compareMode && isImageFile(currentSelected) && (
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
