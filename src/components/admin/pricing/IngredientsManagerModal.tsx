import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  AlertTriangle, 
  Layers, 
  Scale, 
  DollarSign,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  Ingredient, 
  ProductCostSheet, 
  IngredientCategory, 
  IngredientUnit 
} from '../../../types/pricing';
import { 
  calculateCostPerBaseUnit, 
  getImpactedProducts, 
  updateAllImpactedProducts 
} from '../../../utils/pricingEngine';
import { INITIAL_INGREDIENTS } from '../../../data/initialPricingData';

interface IngredientsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  sheets: Record<string, ProductCostSheet>;
  onSaveIngredients: (updated: Ingredient[]) => void;
  onUpdateSheets: (updated: Record<string, ProductCostSheet>) => void;
  showToast: (msg: string) => void;
}

export const IngredientsManagerModal: React.FC<IngredientsManagerModalProps> = ({
  isOpen,
  onClose,
  ingredients,
  sheets,
  onSaveIngredients,
  onUpdateSheets,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editCategory, setEditCategory] = useState<IngredientCategory>('carne');
  const [editPrice, setEditPrice] = useState<string>('');
  const [editSize, setEditSize] = useState<string>('');
  const [editUnit, setEditUnit] = useState<IngredientUnit>('kg');

  // Modal para adicionar novo insumo
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<IngredientCategory>('carne');
  const [newPrice, setNewPrice] = useState('32.00');
  const [newSize, setNewSize] = useState('1000');
  const [newUnit, setNewUnit] = useState<IngredientUnit>('kg');

  // Estado do aviso de impacto em lote
  const [pendingImpact, setPendingImpact] = useState<{
    ingredientId: string;
    ingredientName: string;
    newName: string;
    newCategory: IngredientCategory;
    newPrice: number;
    newUnit: IngredientUnit;
    newSize: number;
    impactedCount: number;
    products: Array<{
      sheet: ProductCostSheet;
      oldCost: number;
      newCost: number;
      diff: number;
    }>;
  } | null>(null);

  if (!isOpen) return null;

  const filtered = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ing.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEdit = (ing: Ingredient) => {
    setEditingId(ing.id);
    setEditName(ing.name);
    setEditCategory(ing.category);
    setEditPrice(String(ing.packagePrice));
    setEditSize(String(ing.packageSize));
    setEditUnit(ing.packageUnit);
    setPendingImpact(null);
  };

  const handleSaveEdit = (id: string) => {
    const ing = ingredients.find((i) => i.id === id);
    if (!ing) return;

    const parsedPrice = parseFloat(editPrice.replace(',', '.')) || 0;
    const parsedSize = parseFloat(editSize.replace(',', '.')) || 1;
    const cleanName = editName.trim() || ing.name;

    // Checa impacto nos produtos
    const impact = getImpactedProducts(id, parsedPrice, editUnit, parsedSize, sheets, ingredients);

    if (impact.impactedCount > 0 && parsedPrice !== ing.packagePrice) {
      setPendingImpact({
        ingredientId: id,
        ingredientName: ing.name,
        newName: cleanName,
        newCategory: editCategory,
        newPrice: parsedPrice,
        newUnit: editUnit,
        newSize: parsedSize,
        impactedCount: impact.impactedCount,
        products: impact.products,
      });
      return;
    }

    // Salva direto se não há impacto no preço
    commitIngredientUpdate(id, cleanName, editCategory, parsedPrice, parsedSize, editUnit);
  };

  const commitIngredientUpdate = (
    id: string,
    name: string,
    category: IngredientCategory,
    pkgPrice: number,
    pkgSize: number,
    unit: IngredientUnit
  ) => {
    const { cost, baseUnit } = calculateCostPerBaseUnit(pkgPrice, pkgSize, unit);
    const updated = ingredients.map((i) => {
      if (i.id === id) {
        return {
          ...i,
          name,
          category,
          packagePrice: pkgPrice,
          packageSize: pkgSize,
          packageUnit: unit,
          costPerBaseUnit: cost,
          baseUnit,
          updatedAt: new Date().toISOString(),
        };
      }
      return i;
    });

    onSaveIngredients(updated);
    setEditingId(null);
    setPendingImpact(null);
    showToast(`Insumo "${name}" atualizado com sucesso!`);
  };

  const handleDeleteIngredient = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente excluir o insumo "${name}"? Fichas técnicas existentes que o utilizam não serão apagadas.`)) {
      const updated = ingredients.filter((i) => i.id !== id);
      onSaveIngredients(updated);
      showToast(`Insumo "${name}" excluído.`);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Deseja restaurar todos os insumos para os valores padrão de fábrica? Suas edições manuais serão substituídas.')) {
      onSaveIngredients(INITIAL_INGREDIENTS);
      showToast('Lista de insumos restaurada com sucesso!');
    }
  };

  const handleApplyImpactBatch = () => {
    if (!pendingImpact) return;
    const { ingredientId, newName, newCategory, newPrice, newSize, newUnit, impactedCount } = pendingImpact;
    const { cost } = calculateCostPerBaseUnit(newPrice, newSize, newUnit);

    // 1. Atualiza ingrediente
    commitIngredientUpdate(ingredientId, newName, newCategory, newPrice, newSize, newUnit);

    // 2. Atualiza todos os produtos que usam esse ingrediente
    const updatedSheets = updateAllImpactedProducts(ingredientId, cost, sheets);
    onUpdateSheets(updatedSheets);

    showToast(`Custos de ${impactedCount} produtos recalculados com sucesso!`);
    setPendingImpact(null);
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('Digite o nome do insumo.');
      return;
    }

    const pkgPrice = parseFloat(newPrice.replace(',', '.')) || 0;
    const pkgSize = parseFloat(newSize.replace(',', '.')) || 1;
    const { cost, baseUnit } = calculateCostPerBaseUnit(pkgPrice, pkgSize, newUnit);

    const created: Ingredient = {
      id: `ing-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      packagePrice: pkgPrice,
      packageSize: pkgSize,
      packageUnit: newUnit,
      costPerBaseUnit: cost,
      baseUnit,
      updatedAt: new Date().toISOString(),
    };

    onSaveIngredients([...ingredients, created]);
    setNewName('');
    setIsAddingNew(false);
    showToast(`Ingrediente "${created.name}" cadastrado com sucesso!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-[#2B2B2B] rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        
        {/* CABEÇALHO */}
        <div className="p-4 sm:p-6 bg-gradient-to-b from-[#1C1C1C] to-[#141414] border-b border-[#262626] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-[#FFA000]/15 text-[#FFA000]">
              <Scale className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-brand font-black text-white leading-tight">
                Base de Ingredientes & Insumos
              </h2>
              <p className="text-xs text-zinc-400">
                Cadastre ou altere os preços de compra para manter as fichas técnicas atualizadas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#202020] hover:bg-[#2A2A2A] text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ALERTA DE IMPACTO EM LOTE SE HOUVER */}
        {pendingImpact && (
          <div className="m-4 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 space-y-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#FFA000] shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  ⚠️ Atenção: Preço Alterado
                </h4>
                <p className="text-xs text-amber-200/90 mt-0.5">
                  Você alterou o preço de <strong className="text-white">{pendingImpact.ingredientName}</strong>. 
                  Isso afeta <strong className="text-[#FFA000]">{pendingImpact.impactedCount} produto(s)</strong> no cardápio.
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-[#333] max-h-28 overflow-y-auto space-y-1 text-xs">
              {pendingImpact.products.map((item, idx) => (
                <div key={idx} className="flex justify-between text-zinc-300">
                  <span>{item.sheet.productName}</span>
                  <span className="font-mono">
                    R$ {item.oldCost.toFixed(2)} → <strong className="text-[#FFA000]">R$ {item.newCost.toFixed(2)}</strong>
                    <span className={item.diff >= 0 ? 'text-red-400 ml-1.5' : 'text-emerald-400 ml-1.5'}>
                      ({item.diff >= 0 ? `+R$ ${item.diff.toFixed(2)}` : `-R$ ${Math.abs(item.diff).toFixed(2)}`})
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingImpact(null)}
                className="px-3 py-1.5 rounded-xl border border-zinc-700 text-xs font-bold text-zinc-300 hover:bg-zinc-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyImpactBatch}
                className="px-4 py-1.5 rounded-xl bg-[#FFA000] hover:bg-[#FFB300] text-black font-brand font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Atualizar {pendingImpact.impactedCount} Produtos Agora</span>
              </button>
            </div>
          </div>
        )}

        {/* BARRA DE BUSCA E BOTÃO NOVO */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#242424]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar ingrediente..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#1A1A1A] border border-[#2D2D2D] text-white text-xs font-bold focus:border-[#FFA000] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-2 rounded-xl bg-[#1E1E22] hover:bg-[#2A2A30] border border-[#2E2E34] text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer shrink-0"
              title="Restaurar lista padrão"
            >
              <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
              <span>Restaurar Padrões</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="px-4 py-2 rounded-xl bg-[#FFA000] hover:bg-[#FFB300] text-black font-brand font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Novo Ingrediente</span>
            </button>
          </div>
        </div>

        {/* FORMULÁRIO DE NOVO INGREDIENTE */}
        {isAddingNew && (
          <form onSubmit={handleAddNew} className="p-4 sm:p-5 bg-[#181818] border-b border-[#2B2B2B] space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#FFA000] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Cadastrar Novo Insumo
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Nome do Insumo</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Queijo Muçarela Ralado"
                  className="w-full px-3 py-2 rounded-xl bg-[#222] border border-[#333] text-white text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Categoria</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as IngredientCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-[#222] border border-[#333] text-white text-xs font-bold"
                >
                  <option value="pao">Pães</option>
                  <option value="carne">Carnes & Blends</option>
                  <option value="queijo">Queijos & Laticínios</option>
                  <option value="bacon">Bacon & Recheios</option>
                  <option value="molho">Molhos & Temperos</option>
                  <option value="vegetal">Vegetais & Saladas</option>
                  <option value="embalagem">Embalagens</option>
                  <option value="descartaveis">Descartáveis</option>
                  <option value="outros">Outros Insumos</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Preço do Pacote (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#222] border border-[#333] text-white text-xs font-bold font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Tamanho da Embalagem</label>
                <input
                  type="number"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#222] border border-[#333] text-white text-xs font-bold font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Unidade</label>
                <select
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value as IngredientUnit)}
                  className="w-full px-3 py-2 rounded-xl bg-[#222] border border-[#333] text-white text-xs font-bold"
                >
                  <option value="kg">kg (Quilo)</option>
                  <option value="g">g (Gramas)</option>
                  <option value="un">un (Unidades)</option>
                  <option value="l">l (Litros)</option>
                  <option value="ml">ml (Mililitros)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#FFA000] hover:bg-[#FFB300] text-black font-brand font-black text-xs uppercase"
              >
                Salvar Insumo
              </button>
            </div>
          </form>
        )}

        {/* LISTAGEM DE INGREDIENTES */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-grow space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              Nenhum ingrediente encontrado com esse filtro.
            </div>
          ) : (
            <div className="bg-[#161616] border border-[#242424] rounded-2xl divide-y divide-[#222] overflow-hidden text-xs">
              {filtered.map((ing) => {
                const isEditing = editingId === ing.id;

                return (
                  <div key={ing.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-[#FFA000]" />
                      <div>
                        <h4 className="font-bold text-white text-sm">{ing.name}</h4>
                        <span className="text-[11px] text-zinc-400 capitalize">
                          Categoria: {ing.category} · Custo base: <strong className="text-[#FFA000] font-mono">R$ {ing.costPerBaseUnit.toFixed(4).replace('.', ',')} / {ing.baseUnit}</strong>
                        </span>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="w-full bg-[#1C1C1F] p-3 rounded-xl border border-[#FF7A00]/40 space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between pb-1.5 border-b border-[#2B2B30]">
                          <span className="text-xs font-black text-[#FFA000] flex items-center gap-1.5">
                            <Edit2 className="w-3.5 h-3.5" />
                            Editar Insumo Salvo
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteIngredient(ing.id, ing.name)}
                            className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir Insumo</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 block mb-1">Nome do Insumo</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#141416] border border-[#2D2D32] text-white text-xs font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 block mb-1">Categoria</label>
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value as IngredientCategory)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#141416] border border-[#2D2D32] text-white text-xs font-bold"
                            >
                              <option value="pao">Pães</option>
                              <option value="carne">Carnes & Blends</option>
                              <option value="queijo">Queijos & Laticínios</option>
                              <option value="bacon">Bacon & Recheios</option>
                              <option value="molho">Molhos & Temperos</option>
                              <option value="vegetal">Vegetais & Saladas</option>
                              <option value="embalagem">Embalagens</option>
                              <option value="descartaveis">Descartáveis</option>
                              <option value="outros">Outros Insumos</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 block mb-1">Preço Pago (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#141416] border border-[#2D2D32] text-white text-xs font-bold font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 block mb-1">Tamanho Embalagem</label>
                            <input
                              type="number"
                              value={editSize}
                              onChange={(e) => setEditSize(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#141416] border border-[#2D2D32] text-white text-xs font-bold font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 block mb-1">Unidade</label>
                            <select
                              value={editUnit}
                              onChange={(e) => setEditUnit(e.target.value as IngredientUnit)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#141416] border border-[#2D2D32] text-white text-xs font-bold"
                            >
                              <option value="kg">kg (Quilo)</option>
                              <option value="g">g (Gramas)</option>
                              <option value="un">un (Unidades)</option>
                              <option value="l">l (Litros)</option>
                              <option value="ml">ml (Mililitros)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#26262B]">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 rounded-lg bg-[#25252A] hover:bg-[#303036] text-zinc-300 text-xs font-bold cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(ing.id)}
                            className="px-4 py-1.5 rounded-lg bg-[#FFA000] hover:bg-[#FFB300] text-black font-brand font-black text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Salvar Modificações</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-brand font-black text-sm text-white block">
                            R$ {ing.packagePrice.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            Pacote de {ing.packageSize}{ing.packageUnit}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(ing)}
                            className="p-2 rounded-xl bg-[#222] hover:bg-[#2C2C2C] text-zinc-300 hover:text-[#FFA000] transition-colors cursor-pointer"
                            title="Modificar / Editar este insumo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteIngredient(ing.id, ing.name)}
                            className="p-2 rounded-xl bg-[#222] hover:bg-red-950/40 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Excluir este insumo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
