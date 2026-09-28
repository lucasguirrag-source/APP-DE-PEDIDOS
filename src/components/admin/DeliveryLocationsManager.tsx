import React, { useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  RotateCcw, 
  Clock, 
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Sparkles
} from 'lucide-react';
import { 
  DeliveryLocation, 
  getDeliveryLocations, 
  saveDeliveryLocations, 
  DEFAULT_DELIVERY_LOCATIONS 
} from '../../data/deliveryLocations';

interface DeliveryLocationsManagerProps {
  showToast: (msg: string) => void;
}

export const DeliveryLocationsManager: React.FC<DeliveryLocationsManagerProps> = ({ showToast }) => {
  const [locations, setLocations] = useState<DeliveryLocation[]>(() => getDeliveryLocations());
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newFee, setNewFee] = useState('');
  const [newEstimatedTime, setNewEstimatedTime] = useState('35-45 min');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNeighborhood, setEditNeighborhood] = useState('');
  const [editFee, setEditFee] = useState('');
  const [editEstimatedTime, setEditEstimatedTime] = useState('');

  const handleToggleActive = (id: string) => {
    const updated = locations.map((loc) => 
      loc.id === id ? { ...loc, active: !loc.active } : loc
    );
    setLocations(updated);
    saveDeliveryLocations(updated);
    showToast('Status do local de entrega atualizado!');
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNeighborhood.trim()) {
      showToast('Digite o nome do bairro.');
      return;
    }

    const feeNum = parseFloat(newFee.replace(',', '.')) || 0;
    const newLoc: DeliveryLocation = {
      id: `loc-${Date.now()}`,
      neighborhood: newNeighborhood.trim(),
      fee: feeNum,
      estimatedTime: newEstimatedTime.trim() || '35-45 min',
      active: true,
    };

    const updated = [...locations, newLoc];
    setLocations(updated);
    saveDeliveryLocations(updated);
    setNewNeighborhood('');
    setNewFee('');
    setNewEstimatedTime('35-45 min');
    setIsAddingNew(false);
    showToast(`Bairro "${newLoc.neighborhood}" adicionado com sucesso!`);
  };

  const handleStartEdit = (loc: DeliveryLocation) => {
    setEditingId(loc.id);
    setEditNeighborhood(loc.neighborhood);
    setEditFee(loc.fee.toString());
    setEditEstimatedTime(loc.estimatedTime || '35-45 min');
  };

  const handleSaveEdit = (id: string) => {
    if (!editNeighborhood.trim()) {
      showToast('O nome do bairro não pode ficar vazio.');
      return;
    }

    const feeNum = parseFloat(editFee.replace(',', '.')) || 0;
    const updated = locations.map((loc) => 
      loc.id === id 
        ? { 
            ...loc, 
            neighborhood: editNeighborhood.trim(), 
            fee: feeNum, 
            estimatedTime: editEstimatedTime.trim() || '35-45 min' 
          }
        : loc
    );

    setLocations(updated);
    saveDeliveryLocations(updated);
    setEditingId(null);
    showToast('Bairro e taxa atualizados com sucesso!');
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Deseja realmente remover o bairro "${name}"?`)) return;
    const updated = locations.filter((loc) => loc.id !== id);
    setLocations(updated);
    saveDeliveryLocations(updated);
    showToast(`Bairro "${name}" removido.`);
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Restaurar os bairros e taxas de entrega padrão?')) return;
    setLocations(DEFAULT_DELIVERY_LOCATIONS);
    saveDeliveryLocations(DEFAULT_DELIVERY_LOCATIONS);
    showToast('Locais restaurados para o padrão.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white text-zinc-900 rounded-3xl border-2 border-black p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-[#FF7A00] text-black rounded-xl font-black">
              <MapPin className="w-5 h-5" />
            </span>
            <h2 className="font-brand font-black text-xl text-zinc-900">
              Locais & Taxas de Entrega
            </h2>
          </div>
          <p className="text-xs text-zinc-600">
            Configure os bairros atendidos e o valor da taxa de entrega para cada região.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border-2 border-zinc-300 hover:border-black text-xs font-bold text-zinc-700 hover:text-black transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            title="Restaurar padrão"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#FF7A00] hover:bg-[#FF8F00] text-black border-2 border-black font-brand font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md hover:scale-105"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Novo Bairro</span>
          </button>
        </div>
      </div>

      {/* Form para Adicionar Novo Bairro */}
      {isAddingNew && (
        <form 
          onSubmit={handleAddNew}
          className="bg-white border-2 border-black rounded-3xl p-5 sm:p-6 shadow-lg space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b-2 border-zinc-100 pb-3">
            <h3 className="font-brand font-black text-base text-zinc-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#FF7A00] stroke-[3]" />
              Cadastrar Novo Local de Entrega
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-zinc-400 hover:text-black p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">
                Nome do Bairro / Região *
              </label>
              <input
                type="text"
                required
                value={newNeighborhood}
                onChange={(e) => setNewNeighborhood(e.target.value)}
                placeholder="Ex: Jardim dos Ipês"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black bg-white text-xs font-bold text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-[#FF7A00]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">
                Taxa de Entrega (R$) *
              </label>
              <input
                type="text"
                required
                value={newFee}
                onChange={(e) => setNewFee(e.target.value)}
                placeholder="Ex: 7,00"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black bg-white text-xs font-bold text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-[#FF7A00]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">
                Tempo Estimado
              </label>
              <input
                type="text"
                value={newEstimatedTime}
                onChange={(e) => setNewEstimatedTime(e.target.value)}
                placeholder="Ex: 35-45 min"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black bg-white text-xs font-bold text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-[#FF7A00]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 rounded-xl border-2 border-zinc-300 text-xs font-bold text-zinc-700 hover:text-black cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#FF7A00] hover:bg-[#FF8F00] text-black border-2 border-black font-brand font-black text-xs uppercase tracking-wider cursor-pointer shadow-md"
            >
              Salvar Bairro
            </button>
          </div>
        </form>
      )}

      {/* Grid de Bairros Cadastrados com Fundo Branco */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {locations.map((loc) => {
          const isEditing = editingId === loc.id;

          if (isEditing) {
            return (
              <div 
                key={loc.id}
                className="bg-white border-2 border-[#FF7A00] rounded-2xl p-4 shadow-lg space-y-3"
              >
                <div>
                  <label className="text-[11px] font-bold text-zinc-600 block mb-1">
                    Bairro:
                  </label>
                  <input
                    type="text"
                    value={editNeighborhood}
                    onChange={(e) => setEditNeighborhood(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border-2 border-black text-xs font-bold text-zinc-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 block mb-1">
                      Taxa (R$):
                    </label>
                    <input
                      type="text"
                      value={editFee}
                      onChange={(e) => setEditFee(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border-2 border-black text-xs font-bold text-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 block mb-1">
                      Previsão:
                    </label>
                    <input
                      type="text"
                      value={editEstimatedTime}
                      onChange={(e) => setEditEstimatedTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border-2 border-black text-xs font-bold text-zinc-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-2.5 py-1 rounded-lg border border-zinc-300 text-xs font-bold text-zinc-600 hover:text-black"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(loc.id)}
                    className="px-3 py-1 rounded-lg bg-[#FF7A00] text-black border border-black font-brand font-black text-xs"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={loc.id}
              className={`bg-white border-2 rounded-2xl p-4 shadow-sm transition-all flex flex-col justify-between gap-3 ${
                loc.active ? 'border-black' : 'border-zinc-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <MapPin className={`w-3.5 h-3.5 ${loc.active ? 'text-[#FF7A00]' : 'text-zinc-400'}`} />
                    <h3 className="font-brand font-black text-sm text-zinc-900 truncate">
                      {loc.neighborhood}
                    </h3>
                  </div>
                  {loc.estimatedTime && (
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {loc.estimatedTime}
                    </span>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="font-brand font-black text-base text-[#FF7A00] block">
                    R$ {loc.fee.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-semibold">
                    Taxa de Entrega
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5">
                <button
                  type="button"
                  onClick={() => handleToggleActive(loc.id)}
                  className={`text-xs font-bold flex items-center gap-1 cursor-pointer ${
                    loc.active ? 'text-emerald-700' : 'text-zinc-400'
                  }`}
                  title={loc.active ? 'Desativar bairro' : 'Ativar bairro'}
                >
                  {loc.active ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-600" />
                      <span>Ativo</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-zinc-400" />
                      <span>Desativado</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(loc)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer"
                    title="Editar bairro ou taxa"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(loc.id, loc.neighborhood)}
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Excluir bairro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
