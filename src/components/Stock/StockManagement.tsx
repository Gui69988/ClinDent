/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  Flame,
  Calendar,
  CheckCircle,
  Truck,
  Layers,
  Thermometer,
  RotateCw,
  Clock,
  History
} from 'lucide-react';
import { useDental } from '../../context/DentalContext';

export default function StockManagement() {
  const {
    stock,
    addStockItem,
    updateStockQuantity,
    autoclaveCycles,
    addAutoclaveCycle,
    currentUser,
    logAction
  } = useDental();

  const [activeTab, setActiveTab] = useState<'estoque' | 'esterilizacao'>('estoque');

  // Stock Form Modal
  const [showAddStock, setShowAddStock] = useState(false);
  const [stockName, setStockName] = useState('');
  const [stockCategory, setStockCategory] = useState('consumivel');
  const [stockQty, setStockQty] = useState('');
  const [stockMinQty, setStockMinQty] = useState('');
  const [stockUnit, setStockUnit] = useState('un');
  const [stockExpiration, setStockExpiration] = useState('');
  const [stockSupplier, setStockSupplier] = useState('');
  const [stockLocation, setStockLocation] = useState('');

  // Autoclave Cycle Modal
  const [showAddCycle, setShowAddCycle] = useState(false);
  const [autoclaveOperator, setAutoclaveOperator] = useState(currentUser.name);
  const [autoclaveTemp, setAutoclaveTemp] = useState('134');
  const [autoclavePressure, setAutoclavePressure] = useState('2.1');
  const [autoclaveDuration, setAutoclaveDuration] = useState('45');
  const [chemIndicator, setChemIndicator] = useState(true);
  const [bioIndicator, setBioIndicator] = useState(true);
  const [sterilizedInput, setSterilizedInput] = useState('');

  // Handle Add Stock Item
  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    addStockItem({
      name: stockName,
      category: stockCategory,
      quantity: Number(stockQty),
      minQuantity: Number(stockMinQty),
      unit: stockUnit,
      expirationDate: stockExpiration || undefined,
      supplier: stockSupplier,
      location: stockLocation
    });
    setShowAddStock(false);
    // Reset
    setStockName('');
    setStockQty('');
    setStockMinQty('');
    setStockSupplier('');
    setStockLocation('');
  };

  // Handle Autoclave addition
  const handleAddAutoclave = (e: React.FormEvent) => {
    e.preventDefault();
    addAutoclaveCycle({
      operatorName: autoclaveOperator,
      temperatureCelsius: Number(autoclaveTemp),
      pressureBar: Number(autoclavePressure),
      durationMinutes: Number(autoclaveDuration),
      chemicalIndicatorPassed: chemIndicator,
      biologicalIndicatorPassed: bioIndicator,
      sterilizedItems: sterilizedInput.split(',').map(s => s.trim())
    });
    setShowAddCycle(false);
    setSterilizedInput('');
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto">
      
      {/* Tab select banner */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-2 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('estoque')}
              className={`py-3 text-xs font-semibold border-b-2 px-1 transition-colors ${
                activeTab === 'estoque' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Controle de Insumos & Materiais
            </button>
            <button
              onClick={() => setActiveTab('esterilizacao')}
              className={`py-3 text-xs font-semibold border-b-2 px-1 transition-colors ${
                activeTab === 'esterilizacao' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Esterilização (Rastreabilidade Autoclave)
            </button>
          </div>

          <div>
            {activeTab === 'estoque' ? (
              <button
                onClick={() => setShowAddStock(true)}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-medium text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-md shadow-teal-500/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Insumo</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAddCycle(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1"
              >
                <Flame className="w-3.5 h-3.5 text-teal-500" />
                <span>Registrar Ciclo Autoclave</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Controle de Estoque */}
        {activeTab === 'estoque' && (
          <div className="p-6">
            
            {/* Quick warnings block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl flex items-start space-x-3 text-xs text-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <h4 className="font-semibold">Níveis Críticos de Estoque</h4>
                  <p className="text-slate-600 leading-normal mt-1">
                    Os seguintes itens estão abaixo ou próximos da quantidade mínima recomendada para segurança operacional. Sugere-se pedido de reposição.
                  </p>
                  <ul className="list-disc list-inside mt-2 font-semibold text-slate-700">
                    {stock.filter(s => s.quantity <= s.minQuantity).map(s => (
                      <li key={s.id}>{s.name} ({s.quantity} {s.unit} - Mínimo: {s.minQuantity})</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl flex items-start space-x-3 text-xs text-rose-800">
                <Calendar className="w-5 h-5 text-rose-500 shrink-0" />
                <div>
                  <h4 className="font-semibold">Alerta de Validade Próxima</h4>
                  <p className="text-slate-600 leading-normal mt-1">
                    Materiais anestésicos ou químicos restauradores que expiram em breve.
                  </p>
                  <ul className="list-disc list-inside mt-2 font-semibold text-slate-700">
                    {stock.filter(s => s.expirationDate && new Date(s.expirationDate).getFullYear() <= 2026).map(s => (
                      <li key={s.id}>{s.name} (Expira em: {s.expirationDate})</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Stock list Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-medium">
                    <th className="py-2.5">Nome do Item</th>
                    <th className="py-2.5">Categoria</th>
                    <th className="py-2.5">Quantidade</th>
                    <th className="py-2.5">Validade</th>
                    <th className="py-2.5">Localização</th>
                    <th className="py-2.5">Fornecedor</th>
                    <th className="py-2.5 text-right">Ajuste Rápido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stock.map((item) => {
                    const isCritical = item.quantity <= item.minQuantity;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 font-semibold text-slate-800">
                          {item.name}
                          {isCritical && (
                            <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] rounded-full uppercase font-bold animate-pulse">
                              Comprar
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 font-mono text-[10px] uppercase rounded">
                            {item.category}
                          </span>
                        </td>
                        <td className={`py-3 font-mono font-bold ${isCritical ? 'text-amber-600' : 'text-slate-600'}`}>
                          {item.quantity} / {item.minQuantity} {item.unit}
                        </td>
                        <td className="py-3 text-slate-500 font-mono">{item.expirationDate || 'N/A'}</td>
                        <td className="py-3 text-slate-500">{item.location}</td>
                        <td className="py-3 text-slate-500 flex items-center"><Truck className="w-3.5 h-3.5 text-slate-300 mr-1" /> {item.supplier}</td>
                        <td className="py-3 text-right space-x-1.5">
                          <button
                            onClick={() => updateStockQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity === 0}
                            className="p-1 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-600 rounded"
                          >
                            -
                          </button>
                          <button
                            onClick={() => updateStockQuantity(item.id, item.quantity + 1)}
                            className="p-1 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded"
                          >
                            +
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Esterilizacao */}
        {activeTab === 'esterilizacao' && (
          <div className="p-6 space-y-6">
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="font-semibold text-slate-800">Ciclos de Autoclave e Rastreabilidade da Célula de Esterilização</h4>
                <p className="text-slate-500 leading-normal mt-1">
                  Mantenha a segurança biológica registrando a temperatura, pressão e os resultados dos testes químicos e biológicos de cada lote autoclavado.
                </p>
              </div>
              <div className="flex items-center space-x-1.5 text-teal-600 font-bold bg-white px-3 py-2 border border-teal-100 rounded-lg shrink-0">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>Rastreabilidade Ativa</span>
              </div>
            </div>

            {/* List Autoclave Cycles */}
            <div className="space-y-4">
              {autoclaveCycles.map(cycle => (
                <div key={cycle.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative">
                  {/* Status lights */}
                  <div className="absolute top-5 right-5 flex items-center space-x-3 text-xs font-semibold">
                    <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                      Q: {cycle.chemicalIndicatorPassed ? 'APROVADO' : 'REPROVADO'}
                    </span>
                    <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                      B: {cycle.biologicalIndicatorPassed ? 'APROVADO' : 'REPROVADO'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3 mb-4">
                    <History className="w-4.5 h-4.5 text-slate-400" />
                    <div>
                      <h4 className="font-semibold text-slate-800 text-xs">Lote Autoclave: {cycle.id}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Processado em: {cycle.date} às {cycle.time} por {cycle.operatorName}</p>
                    </div>
                  </div>

                  {/* autoclave telemetry parameters */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3 rounded-lg text-xs mb-4">
                    <div className="flex items-center space-x-2">
                      <Thermometer className="w-4 h-4 text-rose-500" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Temperatura Pico</span>
                        <span className="font-bold text-slate-700">{cycle.temperatureCelsius}°C</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RotateCw className="w-4 h-4 text-indigo-500" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Pressão Manométrica</span>
                        <span className="font-bold text-slate-700">{cycle.pressureBar} bar</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Duração Ciclo</span>
                        <span className="font-bold text-slate-700">{cycle.durationMinutes} minutos</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Itens e instrumentais esterilizados:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {cycle.sterilizedItems.map((item, i) => (
                        <span key={i} className="bg-slate-100 border border-slate-200/50 text-slate-600 px-2.5 py-0.5 rounded font-mono text-[10px]">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Add Stock Item */}
      {showAddStock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-semibold text-sm">Cadastrar Novo Insumo</span>
              <button onClick={() => setShowAddStock(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddStock} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Nome do Material</label>
                <input
                  type="text"
                  value={stockName}
                  onChange={(e) => setStockName(e.target.value)}
                  placeholder="Ex: Resina Estética Filtek, Luvas Nitrílicas..."
                  required
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Categoria</label>
                  <select
                    value={stockCategory}
                    onChange={(e) => setStockCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white"
                  >
                    <option value="consumivel">Consumível Clínico</option>
                    <option value="instrumental">Instrumental</option>
                    <option value="orto">Ortodontia</option>
                    <option value="implante">Implantodontia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Unidade</label>
                  <select
                    value={stockUnit}
                    onChange={(e) => setStockUnit(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white"
                  >
                    <option value="un">un (unidades)</option>
                    <option value="cx">cx (caixas)</option>
                    <option value="g">g (gramas)</option>
                    <option value="ml">ml (mililitros)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Qtd Atual</label>
                  <input
                    type="number"
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                    placeholder="10"
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Qtd Mínima</label>
                  <input
                    type="number"
                    value={stockMinQty}
                    onChange={(e) => setStockMinQty(e.target.value)}
                    placeholder="5"
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Validade (Opcional)</label>
                  <input
                    type="date"
                    value={stockExpiration}
                    onChange={(e) => setStockExpiration(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Localização</label>
                  <input
                    type="text"
                    value={stockLocation}
                    onChange={(e) => setStockLocation(e.target.value)}
                    placeholder="Ex: Armário A - C1"
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Fornecedor / Distribuidor</label>
                <input
                  type="text"
                  value={stockSupplier}
                  onChange={(e) => setStockSupplier(e.target.value)}
                  placeholder="Ex: Dental Cremer"
                  required
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStock(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-medium rounded-lg"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Autoclave Cycle */}
      {showAddCycle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-semibold text-sm">Registrar Ciclo de Autoclave</span>
              <button onClick={() => setShowAddCycle(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddAutoclave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Operador / Responsável</label>
                <input
                  type="text"
                  value={autoclaveOperator}
                  onChange={(e) => setAutoclaveOperator(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Temp (°C)</label>
                  <input
                    type="number"
                    value={autoclaveTemp}
                    onChange={(e) => setAutoclaveTemp(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Pressão (bar)</label>
                  <input
                    type="text"
                    value={autoclavePressure}
                    onChange={(e) => setAutoclavePressure(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Tempo (min)</label>
                  <input
                    type="number"
                    value={autoclaveDuration}
                    onChange={(e) => setAutoclaveDuration(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="space-y-2 py-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Indicador Químico do Lote</span>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chemIndicator}
                      onChange={(e) => setChemIndicator(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Indicador Biológico (Esporo)</span>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bioIndicator}
                      onChange={(e) => setBioIndicator(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Instrumentais Esterilizados (separados por vírgula)</label>
                <textarea
                  value={sterilizedInput}
                  onChange={(e) => setSterilizedInput(e.target.value)}
                  placeholder="Ex: Kit clínico x5, Pinça fórceps x2, Curetas periodontal x4..."
                  required
                  className="w-full border border-slate-200 rounded-lg p-2.5 min-h-[70px]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCycle(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-semibold"
                >
                  Registrar Ciclo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
