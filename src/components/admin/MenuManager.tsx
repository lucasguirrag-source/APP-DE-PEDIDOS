import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Sliders, 
  X, 
  Upload, 
  Link as LinkIcon, 
  Loader2,
  GripVertical,
  MoreVertical,
  Copy,
  Calendar,
  UtensilsCrossed,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Ban,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Video,
  Play
} from 'lucide-react';
import { MenuItem, Category, ExtraOption, CategoryData } from '../../types';
import { DEFAULT_CATEGORIES } from '../../data/menuData';
import { compressAndConvertImage, uploadImageToServer } from '../../utils/imageUpload';

interface MenuManagerProps {
  menuItems: MenuItem[];
  onSaveMenuItems: (items: MenuItem[]) => void;
  categories?: CategoryData[];
  onSaveCategories?: (categories: CategoryData[]) => void;
  complements: ExtraOption[];
  onSaveComplements: (complements: ExtraOption[]) => void;
  onNavigateToStore?: () => void;
  showToast: (msg: string) => void;
}

const DEFAULT_CATEGORY_DATA: CategoryData[] = DEFAULT_CATEGORIES;

export const MenuManager: React.FC<MenuManagerProps> = ({
  menuItems,
  onSaveMenuItems,
  categories = DEFAULT_CATEGORY_DATA,
  onSaveCategories,
  complements,
  onSaveComplements,
  onNavigateToStore,
  showToast,
}) => {
  // Navigation / Quick filter: 'todas' shows all, or select a specific category to smooth-scroll
  const [selectedCategoryNav, setSelectedCategoryNav] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Expand/collapse quality stats card
  const [isQualityExpanded, setIsQualityExpanded] = useState(false);

  // 3 dots dropdown state for items and categories
  const [activeItemMenuId, setActiveItemMenuId] = useState<string | null>(null);
  const [activeCategoryMenuId, setActiveCategoryMenuId] = useState<string | null>(null);

  // Modal: Reorganizar itens da categoria
  const [reorganizingCategory, setReorganizingCategory] = useState<CategoryData | null>(null);

  // Modals state
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [isEsgotadosModalOpen, setIsEsgotadosModalOpen] = useState(false);

  // Item Add/Edit modal state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video State inside Item Modal (Item 1)
  const [videoUploadMode, setVideoUploadMode] = useState<'upload' | 'url'>('upload');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Complements inside Item Modal (Item 6)
  const [itemComplements, setItemComplements] = useState<ExtraOption[]>([]);
  const [isAddingComplementModalOpen, setIsAddingComplementModalOpen] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompPrice, setNewCompPrice] = useState('5.00');
  const [newCompImage, setNewCompImage] = useState('');
  const [newCompIsRequired, setNewCompIsRequired] = useState(false);
  const [newCompMinQty, setNewCompMinQty] = useState('0');
  const [newCompMaxQty, setNewCompMaxQty] = useState('5');
  const [isUploadingCompImg, setIsUploadingCompImg] = useState(false);
  const compImgFileInputRef = useRef<HTMLInputElement>(null);

  // Custom Item Deletion Confirmation Modal (Item 5)
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<{ id: string; name: string } | null>(null);

  // Item Extras (Adicionais do Item) modal
  const [managingExtrasItem, setManagingExtrasItem] = useState<MenuItem | null>(null);

  // Item Disponibilidade modal
  const [managingAvailabilityItem, setManagingAvailabilityItem] = useState<MenuItem | null>(null);

  // ==========================================
  // TOUCH DRAG & DROP STATE (DEDOS NO CELULAR)
  // ==========================================
  const [touchDragState, setTouchDragState] = useState<{
    categoryId: string;
    itemId: string;
    fromIndex: number;
    toIndex: number;
  } | null>(null);

  // Desktop Drag and drop state for items
  const [draggedDesktop, setDraggedDesktop] = useState<{
    categoryId: string;
    index: number;
  } | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState<{
    name: string;
    tagline: string;
    description: string;
    price: string;
    originalPrice: string;
    category: Category;
    image: string;
    videoUrl?: string;
    preparationTime: string;
    isPopular: boolean;
    isNew: boolean;
    isPosterHighlight: boolean;
    isAvailable: boolean;
  }>({
    name: '',
    tagline: '',
    description: '',
    price: '32.90',
    originalPrice: '',
    category: categories[0]?.id || 'combos',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    videoUrl: '',
    preparationTime: '15-20 min',
    isPopular: false,
    isNew: false,
    isPosterHighlight: false,
    isAvailable: true,
  });

  // Close menus on outside click
  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveItemMenuId(null);
      setActiveCategoryMenuId(null);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  // Save categories helper
  const updateCategories = (updated: CategoryData[]) => {
    if (onSaveCategories) {
      onSaveCategories(updated);
    }
  };

  // =========================================================================
  // 1. CÁLCULO EXATO DA QUALIDADE DO CARDÁPIO (FOTO + DESCRIÇÃO)
  // =========================================================================
  const qualityStats = useMemo(() => {
    const total = menuItems.length;
    if (total === 0) {
      return {
        total: 0,
        withPhoto: 0,
        withDescription: 0,
        fullyOptimized: 0,
        percentage: 100,
        missingPhoto: [],
        missingDesc: []
      };
    }

    let withPhoto = 0;
    let withDescription = 0;
    let fullyOptimized = 0;
    const missingPhoto: MenuItem[] = [];
    const missingDesc: MenuItem[] = [];

    menuItems.forEach((item) => {
      const hasPhoto = Boolean(
        item.image && 
        item.image.trim().length > 0 && 
        !item.image.includes('placeholder')
      );

      const hasDesc = Boolean(
        (item.description && item.description.trim().length >= 5) ||
        (item.tagline && item.tagline.trim().length >= 5)
      );

      if (hasPhoto) withPhoto++;
      else missingPhoto.push(item);

      if (hasDesc) withDescription++;
      else missingDesc.push(item);

      if (hasPhoto && hasDesc) {
        fullyOptimized++;
      }
    });

    const percentage = Math.round((fullyOptimized / total) * 100);

    return {
      total,
      withPhoto,
      withDescription,
      fullyOptimized,
      percentage,
      missingPhoto,
      missingDesc
    };
  }, [menuItems]);

  // Esgotados counters
  const soldOutItemsCount = menuItems.filter((i) => i.isAvailable === false).length;
  const soldOutCategoriesCount = categories.filter((c) => c.isSoldOut).length;

  // ==========================================
  // CATEGORY ACTIONS
  // ==========================================
  const handleToggleCategorySoldOut = (categoryId: string) => {
    const updated = categories.map((c) => {
      if (c.id === categoryId) {
        const next = !c.isSoldOut;
        if (next) {
          showToast(`Categoria "${c.name}" esgotada. Ela e seus produtos NÃO aparecerão para o cliente.`);
        } else {
          showToast(`Categoria "${c.name}" reativada no cardápio!`);
        }
        return { ...c, isSoldOut: next };
      }
      return c;
    });
    updateCategories(updated);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const slug = newCategoryName
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-');

    const newCat: CategoryData = {
      id: slug || `cat-${Date.now()}`,
      name: newCategoryName.trim(),
      isSoldOut: false,
      order: categories.length,
    };

    const updated = [...categories, newCat];
    updateCategories(updated);
    setNewCategoryName('');
    setIsNewCategoryModalOpen(false);
    showToast(`Categoria "${newCat.name}" criada com sucesso!`);
    
    // Scroll to the new category
    setTimeout(() => {
      const el = document.getElementById(`cat-section-${newCat.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  };

  const handleDeleteCategory = (cat: CategoryData) => {
    if (categories.length <= 1) {
      alert('Você precisa manter ao menos uma categoria no cardápio.');
      return;
    }
    if (window.confirm(`Tem certeza que deseja remover a categoria "${cat.name}" e desvincular seus produtos?`)) {
      const updated = categories.filter((c) => c.id !== cat.id);
      updateCategories(updated);
      setActiveCategoryMenuId(null);
      showToast(`Categoria "${cat.name}" excluída.`);
    }
  };

  // ==========================================
  // ITEM ACTIONS & MANAGEMENT
  // ==========================================
  const handleOpenNewItem = (defaultCatId?: string) => {
    setEditingItem(null);
    setItemComplements(complements.map((c) => ({ ...c })));
    setFormData({
      name: '',
      tagline: '',
      description: '',
      price: '32.90',
      originalPrice: '',
      category: defaultCatId || categories[0]?.id || 'combos',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
      videoUrl: '',
      preparationTime: '15-20 min',
      isPopular: false,
      isNew: true,
      isPosterHighlight: false,
      isAvailable: true,
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemComplements(
      item.availableExtras && item.availableExtras.length > 0
        ? item.availableExtras.map((c) => ({ ...c }))
        : complements.map((c) => ({ ...c }))
    );
    setFormData({
      name: item.name,
      tagline: item.tagline || '',
      description: item.description || '',
      price: item.price.toString(),
      originalPrice: item.originalPrice ? item.originalPrice.toString() : '',
      category: item.category,
      image: item.image,
      videoUrl: item.videoUrl || '',
      preparationTime: item.preparationTime || '15-20 min',
      isPopular: !!item.isPopular,
      isNew: !!item.isNew,
      isPosterHighlight: !!item.isPosterHighlight,
      isAvailable: item.isAvailable !== false,
    });
    setActiveItemMenuId(null);
    setIsItemModalOpen(true);
  };

  const handleToggleItemSoldOut = (id: string) => {
    const updated = menuItems.map((item) => {
      if (item.id === id) {
        const nextState = item.isAvailable === false ? true : false;
        if (!nextState) {
          showToast(`Item "${item.name}" esgotado. Ele NÃO aparecerá para o cliente.`);
        } else {
          showToast(`Item "${item.name}" reativado no cardápio!`);
        }
        return { ...item, isAvailable: nextState };
      }
      return item;
    });
    onSaveMenuItems(updated);
  };

  const handleDuplicateItem = (item: MenuItem) => {
    const newItem: MenuItem = {
      ...item,
      id: `${item.id}-copia-${Date.now().toString().slice(-4)}`,
      name: `${item.name} (Cópia)`,
    };
    onSaveMenuItems([newItem, ...menuItems]);
    setActiveItemMenuId(null);
    showToast(`"${newItem.name}" duplicado com sucesso!`);
  };

  const handleCopyItemLink = (item: MenuItem) => {
    const url = `${window.location.origin}/#produto-${item.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setActiveItemMenuId(null);
    showToast('Link do produto copiado!');
  };

  // Custom Item Deletion (Item 5)
  const handleDeleteItem = (id: string, name: string) => {
    setConfirmDeleteItem({ id, name });
    setActiveItemMenuId(null);
  };

  const executeDeleteItem = (id: string, name: string) => {
    const updated = menuItems.filter((i) => i.id !== id);
    onSaveMenuItems(updated);
    setActiveItemMenuId(null);
    setIsItemModalOpen(false);
    setConfirmDeleteItem(null);
    showToast(`Item "${name}" excluído com sucesso do cardápio!`);
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploadingImage(true);
      const permanentUrl = await uploadImageToServer(file, 'item', 800, 800, 0.85);
      setFormData((prev) => ({ ...prev, image: permanentUrl }));
      showToast('Imagem carregada e salva com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao processar imagem.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Upload de Vídeo do Produto (Item 1)
  const handleVideoFileUpload = (file: File) => {
    if (file.size > 60 * 1024 * 1024) {
      showToast('Arquivo muito grande! Escolha um vídeo de até 60MB.');
      return;
    }
    setIsUploadingVideo(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormData((prev) => ({ ...prev, videoUrl: result }));
      setIsUploadingVideo(false);
      showToast('Vídeo do produto carregado com sucesso!');
    };
    reader.onerror = () => {
      setIsUploadingVideo(false);
      showToast('Erro ao ler arquivo de vídeo.');
    };
    reader.readAsDataURL(file);
  };

  // Complements Management inside Product Edit (Item 6)
  const handleAddCustomComplement = () => {
    if (!newCompName.trim()) {
      showToast('Informe o nome do complemento.');
      return;
    }
    const priceVal = parseFloat(newCompPrice.replace(',', '.')) || 0;
    const minVal = parseInt(newCompMinQty, 10) || 0;
    const maxVal = parseInt(newCompMaxQty, 10) || 5;

    const newComp: ExtraOption = {
      id: `comp-${Date.now()}`,
      name: newCompName.trim(),
      price: priceVal,
      image: newCompImage.trim() || undefined,
      enabled: true,
      isRequired: newCompIsRequired,
      minQuantity: minVal,
      maxQuantity: maxVal,
      order: itemComplements.length,
    };

    setItemComplements((prev) => [...prev, newComp]);
    setIsAddingComplementModalOpen(false);
    setNewCompName('');
    setNewCompPrice('5.00');
    setNewCompImage('');
    setNewCompIsRequired(false);
    setNewCompMinQty('0');
    setNewCompMaxQty('5');
    showToast(`Complemento "${newComp.name}" adicionado a este produto!`);
  };

  const handleDeleteItemComplement = (compId: string) => {
    setItemComplements((prev) => prev.filter((c) => c.id !== compId));
    showToast('Complemento removido deste produto.');
  };

  const handleMoveComplementOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= itemComplements.length) return;
    const reordered = [...itemComplements];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    setItemComplements(reordered);
  };

  const handleComplementImageUpload = async (file: File) => {
    try {
      setIsUploadingCompImg(true);
      const permanentUrl = await uploadImageToServer(file, 'comp', 400, 400, 0.85);
      setNewCompImage(permanentUrl);
      showToast('Foto do complemento salva com sucesso!');
    } catch {
      showToast('Erro ao carregar foto do complemento.');
    } finally {
      setIsUploadingCompImg(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const parsedPrice = parseFloat(formData.price.replace(',', '.')) || 0;
    const parsedOriginalPrice = formData.originalPrice 
      ? parseFloat(formData.originalPrice.replace(',', '.')) 
      : undefined;

    if (editingItem) {
      const updated = menuItems.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: formData.name.trim(),
              tagline: formData.tagline.trim(),
              description: formData.description.trim(),
              price: parsedPrice,
              originalPrice: parsedOriginalPrice,
              category: formData.category,
              image: formData.image,
              videoUrl: formData.videoUrl?.trim() || undefined,
              preparationTime: formData.preparationTime,
              isPopular: formData.isPopular,
              isNew: formData.isNew,
              isPosterHighlight: formData.isPosterHighlight,
              isAvailable: formData.isAvailable,
              availableExtras: itemComplements,
            }
          : item
      );
      onSaveMenuItems(updated);
      showToast(`Item "${formData.name}" atualizado!`);
    } else {
      const newItem: MenuItem = {
        id: `item-${Date.now()}`,
        name: formData.name.trim(),
        tagline: formData.tagline.trim(),
        description: formData.description.trim(),
        price: parsedPrice,
        originalPrice: parsedOriginalPrice,
        category: formData.category,
        image: formData.image,
        videoUrl: formData.videoUrl?.trim() || undefined,
        preparationTime: formData.preparationTime,
        isPopular: formData.isPopular,
        isNew: formData.isNew,
        isPosterHighlight: formData.isPosterHighlight,
        isAvailable: formData.isAvailable,
        availableExtras: itemComplements,
      };
      onSaveMenuItems([newItem, ...menuItems]);
      showToast(`Item "${formData.name}" adicionado ao cardápio!`);
    }

    setIsItemModalOpen(false);
  };

  // =========================================================================
  // REORDENAÇÃO (SUBIR / DESCER ITEM DENTRO DA CATEGORIA)
  // =========================================================================
  const handleMoveCategoryItem = (categoryId: string, itemIndex: number, direction: 'up' | 'down') => {
    const catItems = menuItems.filter((i) => i.category === categoryId);
    const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    if (targetIndex < 0 || targetIndex >= catItems.length) return;

    // Swap inside the category list
    const reordered = [...catItems];
    const temp = reordered[itemIndex];
    reordered[itemIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Reassemble full menuItems preserving order of other categories
    const otherItems = menuItems.filter((i) => i.category !== categoryId);
    const updatedFull = [...reordered, ...otherItems];
    onSaveMenuItems(updatedFull);
    showToast(`Posição de "${temp.name}" alterada!`);
  };

  // =========================================================================
  // DESKTOP DRAG & DROP
  // =========================================================================
  const handleDesktopDragStart = (e: React.DragEvent, categoryId: string, index: number) => {
    setDraggedDesktop({ categoryId, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDesktopDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDesktopDrop = (e: React.DragEvent, categoryId: string, dropIndex: number) => {
    e.preventDefault();
    if (!draggedDesktop || draggedDesktop.categoryId !== categoryId || draggedDesktop.index === dropIndex) {
      setDraggedDesktop(null);
      return;
    }

    const catItems = menuItems.filter((i) => i.category === categoryId);
    const reordered = [...catItems];
    const [moved] = reordered.splice(draggedDesktop.index, 1);
    reordered.splice(dropIndex, 0, moved);

    const otherItems = menuItems.filter((i) => i.category !== categoryId);
    const updatedFull = [...reordered, ...otherItems];
    onSaveMenuItems(updatedFull);
    setDraggedDesktop(null);
    showToast('Ordem atualizada com sucesso!');
  };

  // =========================================================================
  // TOUCH DRAG & DROP COM OS DEDOS (TOUCH EVENTS PARA CELULAR)
  // =========================================================================
  const handleTouchStart = (
    e: React.TouchEvent,
    categoryId: string,
    itemId: string,
    itemIndex: number
  ) => {
    // Prevent default scroll on touch hold over the grip handle
    setTouchDragState({
      categoryId,
      itemId,
      fromIndex: itemIndex,
      toIndex: itemIndex,
    });

    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleTouchMove = (e: React.TouchEvent, categoryId: string) => {
    if (!touchDragState || touchDragState.categoryId !== categoryId) return;

    const touch = e.touches[0];
    if (!touch) return;

    // Find the item under current touch position
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!targetElement) return;

    const itemContainer = targetElement.closest(`[data-cat-item-index][data-cat-id="${categoryId}"]`);
    if (itemContainer) {
      const newIndexAttr = itemContainer.getAttribute('data-cat-item-index');
      if (newIndexAttr !== null) {
        const newIndex = parseInt(newIndexAttr, 10);
        if (!isNaN(newIndex) && newIndex !== touchDragState.toIndex) {
          setTouchDragState((prev) => (prev ? { ...prev, toIndex: newIndex } : null));
          if (navigator.vibrate) {
            navigator.vibrate(15);
          }
        }
      }
    }
  };

  const handleTouchEnd = (categoryId: string) => {
    if (!touchDragState || touchDragState.categoryId !== categoryId) {
      setTouchDragState(null);
      return;
    }

    const { fromIndex, toIndex, itemId } = touchDragState;
    if (fromIndex !== toIndex) {
      const catItems = menuItems.filter((i) => i.category === categoryId);
      if (fromIndex >= 0 && fromIndex < catItems.length && toIndex >= 0 && toIndex < catItems.length) {
        const reordered = [...catItems];
        const [movedItem] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, movedItem);

        const otherItems = menuItems.filter((i) => i.category !== categoryId);
        const updatedFull = [...reordered, ...otherItems];
        onSaveMenuItems(updatedFull);
        showToast(`Item "${movedItem.name}" reordenado!`);
        if (navigator.vibrate) {
          navigator.vibrate(40);
        }
      }
    }

    setTouchDragState(null);
  };

  // Scroll to category section helper
  const handleScrollToCategory = (catId: string) => {
    setSelectedCategoryNav(catId);
    if (catId === 'todas') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(`cat-section-${catId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-16">
      
      {/* ========================================================================= */}
      {/* 1. TOPO: GESTOR DE CARDÁPIO & QUALIDADE CALCULADA DINAMICAMENTE           */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-brand font-black text-white">
            Gestor de cardápio
          </h2>

          {onNavigateToStore && (
            <button
              type="button"
              onClick={onNavigateToStore}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#E65100] hover:from-[#FFA000] hover:to-[#FF7A00] text-black font-brand font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#FF7A00]/25 transition-all cursor-pointer self-start sm:self-auto"
              title="Abrir o cardápio exatamente como os clientes visualizam no celular e computador"
            >
              <span className="text-sm">👁️</span>
              <span>Conferir Cardápio (Visão Cliente)</span>
            </button>
          )}
        </div>

        {/* Card: Qualidade do Cardápio: X% otimizado (Cálculo real de foto + descrição) */}
        <div 
          onClick={() => setIsQualityExpanded(!isQualityExpanded)}
          className="bg-white text-zinc-900 rounded-2xl p-4 shadow-sm border border-gray-200 space-y-2.5 cursor-pointer hover:border-gray-300 transition-all select-none"
        >
          <div className="flex items-center justify-between font-bold text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FFA000]" />
              <span>
                Qualidade do Cardápio:{' '}
                <strong className="text-zinc-900 font-black">{qualityStats.percentage}%</strong>{' '}
                <span className="font-normal text-zinc-500 text-xs">otimizado</span>
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700">
              <span className="text-[11px] font-medium hidden sm:inline">
                {qualityStats.fullyOptimized} de {qualityStats.total} completos
              </span>
              {isQualityExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {/* Barra de Progresso com Cor Dinâmica */}
          <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                qualityStats.percentage >= 80 
                  ? 'bg-emerald-500' 
                  : qualityStats.percentage >= 50 
                  ? 'bg-amber-500' 
                  : 'bg-red-500'
              }`}
              style={{ width: `${qualityStats.percentage}%` }}
            />
          </div>

          {/* Detalhamento Expandível da Qualidade do Cardápio */}
          {isQualityExpanded && (
            <div className="pt-2 border-t border-gray-100 text-xs space-y-2 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Com Fotos</span>
                  <span className="font-black text-sm text-zinc-800">
                    {qualityStats.withPhoto} / {qualityStats.total}
                  </span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Com Descrição</span>
                  <span className="font-black text-sm text-zinc-800">
                    {qualityStats.withDescription} / {qualityStats.total}
                  </span>
                </div>

                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 col-span-2 sm:col-span-1">
                  <span className="text-emerald-700 block text-[10px] uppercase font-bold">100% Otimizados</span>
                  <span className="font-black text-sm text-emerald-800">
                    {qualityStats.fullyOptimized} / {qualityStats.total}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-1.5 text-[11px] text-zinc-600 bg-orange-50/70 p-2 rounded-xl border border-orange-100">
                <Info className="w-4 h-4 text-[#FF7A00] shrink-0 mt-0.5" />
                <span>
                  {qualityStats.percentage === 100 
                    ? 'Excelente! Todos os seus produtos possuem foto e descrição completas.'
                    : `Para chegar a 100%, garanta que todos os itens tenham foto apetitosa e descrição com ingredientes.`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Banner: Esgotados */}
        <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 text-zinc-900">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <span className="font-black text-sm sm:text-base text-zinc-900 block leading-tight">
                Esgotados
              </span>
              <span className="text-[11px] text-zinc-600">
                {soldOutItemsCount} item(ns) e {soldOutCategoriesCount} categoria(s) pausados
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEsgotadosModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#FFA000] hover:bg-[#FFB300] text-black font-brand font-black text-xs transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          >
            Ver esgotados
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE NAVEGAÇÃO ENTRE CATEGORIAS & "+ NOVA CATEGORIA"                */}
      {/* ========================================================================= */}
      <div className="space-y-2.5 pt-1 sticky top-16 z-20 bg-zinc-950/90 backdrop-blur-md pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
        
        {/* Seletor Rápido de Categorias (Ir para Categoria) */}
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <select
              value={selectedCategoryNav}
              onChange={(e) => handleScrollToCategory(e.target.value)}
              className="w-full appearance-none bg-white text-zinc-900 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl border border-gray-300 shadow-xs focus:outline-hidden focus:border-[#FF7A00] cursor-pointer pr-10"
            >
              <option value="todas">📋 Todas as Categorias (Ver Cardápio Inteiro)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  🍴 {cat.name} {cat.isSoldOut ? '(Esgotada)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Botão "+ Nova categoria" Laranja */}
          <button
            type="button"
            onClick={() => setIsNewCategoryModalOpen(true)}
            className="py-2.5 px-4 rounded-2xl bg-[#FF7A00] hover:bg-[#FF8F00] text-black font-brand font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#FF7A00]/20 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Nova categoria</span>
            <span className="sm:hidden">Categoria</span>
          </button>
        </div>

        {/* Barra de Pesquisa Geral */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar produtos em todas as categorias..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 shadow-2xs focus:outline-hidden focus:border-[#FF7A00]"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TODAS AS CATEGORIAS EM UMA ABA SÓ (UMA APÓS A OUTRA)                    */}
      {/* ========================================================================= */}
      <div className="space-y-6 pt-1">
        {categories.map((cat) => {
          // Filter items belonging to this category
          const categoryItems = menuItems.filter((item) => {
            const matchesCategory = item.category === cat.id;
            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase().trim();
              const matchesSearch = 
                item.name.toLowerCase().includes(q) || 
                (item.description && item.description.toLowerCase().includes(q)) ||
                (item.tagline && item.tagline.toLowerCase().includes(q));
              return matchesCategory && matchesSearch;
            }
            return matchesCategory;
          });

          // If searching and this category has no matches, don't show empty block during search
          if (searchQuery.trim() && categoryItems.length === 0) {
            return null;
          }

          const isCategoryDropdownOpen = activeCategoryMenuId === cat.id;

          return (
            <div
              key={cat.id}
              id={`cat-section-${cat.id}`}
              className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-gray-200 text-zinc-900 space-y-4 scroll-mt-36"
            >
              
              {/* CABEÇALHO DA CATEGORIA */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 gap-2">
                
                {/* Nome da Categoria com Ícone de Garfo */}
                <div className="flex items-center gap-2 min-w-0">
                  <UtensilsCrossed className="w-5 h-5 text-zinc-800 shrink-0" />
                  <h3 className="text-lg sm:text-xl font-brand font-black text-zinc-900 tracking-tight truncate">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] font-bold text-zinc-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                    {categoryItems.length}
                  </span>
                  {cat.isSoldOut && (
                    <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0">
                      Esgotada (Oculta)
                    </span>
                  )}
                </div>

                {/* Direita: Switch "Esgotar" + 3 Pontinhos da Categoria */}
                <div className="flex items-center gap-3 shrink-0">
                  
                  {/* Switch Esgotar Categoria */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-zinc-500 hidden sm:inline">Esgotar</span>
                    <label className="relative inline-flex items-center cursor-pointer" title="Esgotar categoria inteira (oculta para clientes)">
                      <input
                        type="checkbox"
                        checked={!!cat.isSoldOut}
                        onChange={() => handleToggleCategorySoldOut(cat.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>

                  {/* Botão de 3 Pontos da Categoria (com Reorganizar itens da categoria) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCategoryMenuId(isCategoryDropdownOpen ? null : cat.id);
                        setActiveItemMenuId(null);
                      }}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-zinc-700 transition-colors cursor-pointer"
                      title="Opções da categoria"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* MENU DOS 3 PONTINHOS DA CATEGORIA */}
                    {isCategoryDropdownOpen && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-10 z-30 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 py-1.5 text-zinc-800 text-xs animate-in fade-in select-none"
                      >
                        {/* 1. Renomear categoria */}
                        <button
                          type="button"
                          onClick={() => {
                            const newName = prompt('Digite o novo nome para esta categoria:', cat.name);
                            if (newName && newName.trim()) {
                              const updated = categories.map((c) =>
                                c.id === cat.id ? { ...c, name: newName.trim() } : c
                              );
                              updateCategories(updated);
                              showToast('Categoria renomeada!');
                            }
                            setActiveCategoryMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-2.5 font-semibold text-zinc-800"
                        >
                          <Edit3 className="w-4 h-4 text-zinc-500" />
                          <span>Renomear categoria</span>
                        </button>

                        {/* 2. REORGANIZAR ITENS DA CATEGORIA (SOLICITADO) */}
                        <button
                          type="button"
                          onClick={() => {
                            setReorganizingCategory(cat);
                            setActiveCategoryMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-orange-50 flex items-center gap-2.5 font-semibold text-[#FF7A00]"
                        >
                          <ArrowUpDown className="w-4 h-4 text-[#FF7A00]" />
                          <span>Reorganizar itens da categoria</span>
                        </button>

                        {/* 3. Esgotar categoria */}
                        <button
                          type="button"
                          onClick={() => {
                            handleToggleCategorySoldOut(cat.id);
                            setActiveCategoryMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-2.5 font-semibold text-amber-700"
                        >
                          <Ban className="w-4 h-4 text-amber-600" />
                          <span>{cat.isSoldOut ? 'Reativar categoria' : 'Esgotar categoria'}</span>
                        </button>

                        <div className="border-t border-gray-100 my-1" />

                        {/* 4. Excluir categoria */}
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteCategory(cat);
                            setActiveCategoryMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-2.5 font-semibold text-red-600"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                          <span>Excluir categoria</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Linha com Botão "+ Adicionar Item" para esta categoria */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenNewItem(cat.id)}
                  className="py-2 px-3.5 rounded-xl border-2 border-[#FF7A00] text-[#FF7A00] hover:bg-[#FF7A00] hover:text-black font-brand font-black text-xs uppercase tracking-wide flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Adicionar Item em {cat.name}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReorganizingCategory(cat)}
                  className="text-xs font-bold text-zinc-500 hover:text-[#FF7A00] flex items-center gap-1 cursor-pointer transition-colors"
                  title="Ordenar itens desta categoria"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ordenar itens</span>
                </button>
              </div>

              {/* LISTA DE PRODUTOS DA CATEGORIA (CARD RETANGULAR COM 6 PONTINHOS TOUCH & DESKTOP) */}
              <div 
                className="space-y-2.5 pt-1"
                onTouchMove={(e) => handleTouchMove(e, cat.id)}
                onTouchEnd={() => handleTouchEnd(cat.id)}
                onTouchCancel={() => setTouchDragState(null)}
              >
                {categoryItems.length === 0 ? (
                  <div className="py-8 px-4 text-center border-2 border-dashed border-gray-200 rounded-2xl text-zinc-400 space-y-1.5">
                    <p className="text-xs font-semibold">Nenhum produto cadastrado em {cat.name}.</p>
                    <button
                      type="button"
                      onClick={() => handleOpenNewItem(cat.id)}
                      className="text-xs font-bold text-[#FF7A00] underline cursor-pointer"
                    >
                      Cadastrar primeiro produto
                    </button>
                  </div>
                ) : (
                  categoryItems.map((item, index) => {
                    const isItemSoldOut = item.isAvailable === false;
                    const isItemMenuOpen = activeItemMenuId === item.id;
                    const isBeingDraggedTouch = touchDragState?.itemId === item.id;
                    const isTouchTarget = 
                      touchDragState?.categoryId === cat.id && 
                      touchDragState?.toIndex === index && 
                      touchDragState?.fromIndex !== index;

                    return (
                      <div
                        key={item.id}
                        data-cat-item-index={index}
                        data-cat-id={cat.id}
                        draggable={true}
                        onDragStart={(e) => handleDesktopDragStart(e, cat.id, index)}
                        onDragOver={handleDesktopDragOver}
                        onDrop={(e) => handleDesktopDrop(e, cat.id, index)}
                        className={`relative flex items-center justify-between gap-2.5 sm:gap-3 p-3 rounded-2xl border transition-all ${
                          isBeingDraggedTouch
                            ? 'bg-orange-50/90 border-[#FF7A00] shadow-lg scale-[1.01] z-20 ring-2 ring-[#FF7A00]/30'
                            : isTouchTarget
                            ? 'border-dashed border-2 border-[#FF7A00] bg-orange-50/40'
                            : draggedDesktop?.categoryId === cat.id && draggedDesktop?.index === index
                            ? 'opacity-40 border-dashed border-[#FF7A00] bg-orange-50/50'
                            : isItemSoldOut
                            ? 'bg-gray-50 border-gray-200 opacity-60'
                            : 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs'
                        }`}
                      >
                        {/* Esquerda: 6 Pontinhos (Touch Drag Handle) + Foto + Título */}
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-grow">
                          
                          {/* OS 6 PONTINHOS DE ARRASTAR COM TOUCH PARA CELULAR E MOUSE PARA DESKTOP */}
                          <div 
                            onTouchStart={(e) => handleTouchStart(e, cat.id, item.id, index)}
                            style={{ touchAction: 'none' }}
                            className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-800 p-1 sm:p-1.5 rounded-xl hover:bg-gray-100 shrink-0 flex flex-col items-center select-none"
                            title="Segure e arraste com os dedos para subir ou descer"
                          >
                            <GripVertical className="w-5 h-5" />
                            
                            {/* Setinhas sutis Up / Down para toque rápido alternativo */}
                            <div className="flex flex-col gap-0.5 mt-0.5" onClick={(e) => e.stopPropagation()}>
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveCategoryItem(cat.id, index, 'up')}
                                  className="p-0.5 text-zinc-400 hover:text-zinc-900 cursor-pointer"
                                  title="Subir"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                              )}
                              {index < categoryItems.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveCategoryItem(cat.id, index, 'down')}
                                  className="p-0.5 text-zinc-400 hover:text-zinc-900 cursor-pointer"
                                  title="Descer"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Foto Retangular do Produto */}
                          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200 relative select-none">
                            <img
                              src={item.image}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover pointer-events-none"
                            />
                            {isItemSoldOut && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1">
                                <span className="text-[8px] font-black uppercase text-white bg-red-600 px-1 py-0.2 rounded-xs text-center leading-tight">
                                  Oculto
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Nome, Descrição e Preço */}
                          <div className="min-w-0 flex-grow">
                            <h4 className="font-brand font-black text-xs sm:text-sm text-zinc-900 truncate">
                              {item.name}
                            </h4>
                            <p className="text-[11px] text-zinc-500 truncate">
                              {item.tagline || item.description || 'Sem descrição cadastrada'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-black text-xs sm:text-sm text-emerald-700">
                                R$ {item.price.toFixed(2).replace('.', ',')}
                              </span>
                              {item.originalPrice && (
                                <span className="text-[10px] text-zinc-400 line-through">
                                  R$ {item.originalPrice.toFixed(2).replace('.', ',')}
                                </span>
                              )}
                              {/* Indicador de otimização */}
                              {(!item.description || !item.image) && (
                                <span className="text-[9px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-xs font-semibold">
                                  Incompleto
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Direita: Switch "Esgotar" + Botão de 3 Pontos com Menu */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          
                          {/* Switch Esgotar Item */}
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-zinc-500 mb-0.5">
                              Esgotar
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer" title="Esgotar item (não aparece para o cliente)">
                              <input
                                type="checkbox"
                                checked={isItemSoldOut}
                                onChange={() => handleToggleItemSoldOut(item.id)}
                                className="sr-only peer"
                              />
                              <div className="w-9 sm:w-10 h-5 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                            </label>
                          </div>

                          {/* Botão de 3 Pontos do Item */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveItemMenuId(isItemMenuOpen ? null : item.id);
                                setActiveCategoryMenuId(null);
                              }}
                              className="p-2 sm:p-2.5 rounded-xl border border-gray-300 text-zinc-600 hover:border-[#FF7A00] hover:text-[#FF7A00] hover:bg-orange-50 transition-colors cursor-pointer"
                              title="Opções do produto"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu com as Opções do Produto */}
                            {isItemMenuOpen && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-11 z-40 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 py-1.5 text-zinc-800 text-xs animate-in fade-in select-none"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditItem(item)}
                                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-2.5 font-semibold"
                                >
                                  <Edit3 className="w-4 h-4 text-zinc-600" />
                                  <span>Editar item</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDuplicateItem(item)}
                                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-2.5 font-semibold"
                                >
                                  <Copy className="w-4 h-4 text-zinc-600" />
                                  <span>Duplicar item</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleCopyItemLink(item)}
                                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-2.5 font-semibold"
                                >
                                  <LinkIcon className="w-4 h-4 text-zinc-600" />
                                  <span>Copiar link</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setManagingExtrasItem(item);
                                    setActiveItemMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-2.5 font-semibold"
                                >
                                  <Sliders className="w-4 h-4 text-zinc-600" />
                                  <span>Adicionais do item</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setManagingAvailabilityItem(item);
                                    setActiveItemMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-2.5 font-semibold"
                                >
                                  <Calendar className="w-4 h-4 text-zinc-600" />
                                  <span>Disponibilidade do item</span>
                                </button>

                                <div className="border-t border-gray-100 my-1" />

                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item.id, item.name)}
                                  className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-2.5 font-semibold text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                  <span>Excluir item</span>
                                </button>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: REORGANIZAR ITENS DA CATEGORIA                                    */}
      {/* ========================================================================= */}
      {reorganizingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[88vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl text-zinc-900">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-[#FF7A00]" />
                <div>
                  <h3 className="font-brand font-black text-lg">Reorganizar Itens</h3>
                  <p className="text-xs text-zinc-500">Categoria: {reorganizingCategory.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReorganizingCategory(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-600">
              Use os botões <strong>Subir ⬆️</strong> e <strong>Descer ⬇️</strong> para definir a ordem em que os produtos aparecem no cardápio do cliente:
            </p>

            <div className="space-y-2">
              {menuItems.filter((i) => i.category === reorganizingCategory.id).length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-6">Nenhum item nesta categoria.</p>
              ) : (
                menuItems
                  .filter((i) => i.category === reorganizingCategory.id)
                  .map((item, idx, arr) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-gray-50 border border-gray-200"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-700 font-black text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}º
                        </span>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-zinc-900 truncate">{item.name}</p>
                          <p className="text-[10px] text-emerald-700 font-bold">
                            R$ {item.price.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveCategoryItem(reorganizingCategory.id, idx, 'up')}
                          className="p-2 rounded-xl bg-white border border-gray-200 text-zinc-700 hover:bg-orange-50 hover:text-[#FF7A00] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === arr.length - 1}
                          onClick={() => handleMoveCategoryItem(reorganizingCategory.id, idx, 'down')}
                          className="p-2 rounded-xl bg-white border border-gray-200 text-zinc-700 hover:bg-orange-50 hover:text-[#FF7A00] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setReorganizingCategory(null)}
                className="px-6 py-2.5 rounded-xl bg-[#FF7A00] hover:bg-[#FF8F00] text-black font-brand font-black text-xs cursor-pointer shadow-md"
              >
                Concluir Reorganização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVA CATEGORIA                                                    */}
      {/* ========================================================================= */}
      {isNewCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-zinc-900">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-brand font-black text-lg">Criar Nova Categoria</h3>
              <button
                type="button"
                onClick={() => setIsNewCategoryModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Entradas, Burgers Especiais, Sobremesas..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-zinc-900 focus:outline-hidden focus:border-[#FF7A00]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-zinc-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF7A00] hover:bg-[#FF8F00] text-black font-brand font-black text-xs cursor-pointer shadow-md"
                >
                  Criar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VER ESGOTADOS                                                     */}
      {/* ========================================================================= */}
      {isEsgotadosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl text-zinc-900">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-amber-600" />
                <h3 className="font-brand font-black text-lg">Itens & Categorias Esgotados</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEsgotadosModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Produtos e categorias marcados como esgotados <strong>NÃO aparecem para o cliente</strong>.
            </p>

            {/* Categorias Esgotadas */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700">Categorias Pausadas:</h4>
              {categories.filter((c) => c.isSoldOut).length === 0 ? (
                <p className="text-xs text-zinc-400 italic">Nenhuma categoria esgotada.</p>
              ) : (
                categories.filter((c) => c.isSoldOut).map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs">
                    <span className="font-bold">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleCategorySoldOut(c.id)}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                    >
                      Reativar
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Itens Esgotados */}
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700">Produtos Pausados:</h4>
              {menuItems.filter((i) => i.isAvailable === false).length === 0 ? (
                <p className="text-xs text-zinc-400 italic">Nenhum produto esgotado.</p>
              ) : (
                menuItems.filter((i) => i.isAvailable === false).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold text-zinc-900">{item.name}</p>
                        <p className="text-[10px] text-zinc-500">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleItemSoldOut(item.id)}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                    >
                      Reativar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADICIONAIS DO ITEM                                                */}
      {/* ========================================================================= */}
      {managingExtrasItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-zinc-900">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-brand font-black text-lg">Adicionais do Produto</h3>
                <p className="text-xs text-zinc-500">{managingExtrasItem.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setManagingExtrasItem(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-600">
              Selecione quais adicionais o cliente pode incluir ao pedir este produto:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {complements.map((comp) => {
                const currentExtras = managingExtrasItem.availableExtras || complements;
                const isSelected = currentExtras.some((e) => e.id === comp.id);

                return (
                  <label
                    key={comp.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          const nextExtras = isSelected
                            ? currentExtras.filter((e) => e.id !== comp.id)
                            : [...currentExtras, comp];

                          const updated = menuItems.map((m) =>
                            m.id === managingExtrasItem.id ? { ...m, availableExtras: nextExtras } : m
                          );
                          onSaveMenuItems(updated);
                          setManagingExtrasItem({ ...managingExtrasItem, availableExtras: nextExtras });
                          showToast('Adicionais atualizados!');
                        }}
                        className="rounded-sm text-[#FF7A00] focus:ring-[#FF7A00]"
                      />
                      <span className="font-bold text-zinc-800">{comp.name}</span>
                    </div>
                    <span className="font-black text-emerald-700">
                      + R$ {comp.price.toFixed(2).replace('.', ',')}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setManagingExtrasItem(null)}
                className="px-5 py-2 rounded-xl bg-[#FF7A00] hover:bg-[#FF8F00] text-black font-brand font-black text-xs cursor-pointer shadow-md"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DISPONIBILIDADE DO ITEM                                           */}
      {/* ========================================================================= */}
      {managingAvailabilityItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-zinc-900">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-brand font-black text-lg">Disponibilidade do Produto</h3>
                <p className="text-xs text-zinc-500">{managingAvailabilityItem.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setManagingAvailabilityItem(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 border rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-bold block text-sm">Disponível no Cardápio</span>
                  <span className="text-[11px] text-zinc-500">
                    Se desativado, o produto é esgotado e oculto do cliente.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={managingAvailabilityItem.isAvailable !== false}
                    onChange={() => {
                      handleToggleItemSoldOut(managingAvailabilityItem.id);
                      setManagingAvailabilityItem({
                        ...managingAvailabilityItem,
                        isAvailable: managingAvailabilityItem.isAvailable === false ? true : false,
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="p-3 bg-gray-50 border rounded-2xl space-y-1">
                <span className="font-bold block text-sm">Canais de Atendimento</span>
                <p className="text-[11px] text-zinc-500">
                  Disponível para <strong>Delivery</strong> e <strong>Retirada no Balcão</strong> durante todo o horário de funcionamento.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setManagingAvailabilityItem(null)}
                className="px-5 py-2 rounded-xl bg-[#FF7A00] hover:bg-[#FF8F00] text-black font-brand font-black text-xs cursor-pointer shadow-md"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR PRODUTO                                            */}
      {/* ========================================================================= */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#141414] border border-[#2D2D2D] rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-7 space-y-5 shadow-2xl relative text-white">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
              <div>
                <h3 className="font-brand font-black text-lg text-white">
                  {editingItem ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                </h3>
                <p className="text-xs text-[#888]">
                  {editingItem ? `Atualizando informações de: ${editingItem.name}` : 'Preencha os campos para adicionar ao cardápio'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="p-2 rounded-xl text-[#777] hover:text-white bg-[#1F1F1F] hover:bg-[#282828] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Nome */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-[#A3A3A3]">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Smash Salad Duplo, Batata Rústica..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#181818] border border-[#2B2B2B] text-xs text-white placeholder-[#555] focus:outline-hidden focus:border-[#FFA000]"
                  />
                </div>

                {/* Slogan */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-[#A3A3A3]">Slogan Curto / Destaque</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="Ex: O mais pedido da casa! Crocante e suculento."
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#181818] border border-[#2B2B2B] text-xs text-white placeholder-[#555] focus:outline-hidden focus:border-[#FFA000]"
                  />
                </div>

                {/* Categoria */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#A3A3A3]">Categoria *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#181818] border border-[#2B2B2B] text-xs text-white focus:outline-hidden focus:border-[#FFA000] cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preço de Venda */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#A3A3A3]">Preço de Venda (R$) *</label>
                  <input
                    type="text"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Ex: 34,90"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#181818] border border-[#2B2B2B] text-xs text-white placeholder-[#555] focus:outline-hidden focus:border-[#FFA000]"
                  />
                </div>

                {/* Preço Original (De / Por) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#A3A3A3]">Preço Original De R$ (Riscado)</label>
                  <input
                    type="text"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    placeholder="Ex: 42,90 (Opcional)"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#181818] border border-[#2B2B2B] text-xs text-white placeholder-[#555] focus:outline-hidden focus:border-[#FFA000]"
                  />
                </div>

                {/* Upload de Foto */}
                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#A3A3A3]">Foto do Produto *</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setImageUploadMode('upload')}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                          imageUploadMode === 'upload' ? 'bg-[#FFA000] text-black' : 'text-[#888]'
                        }`}
                      >
                        Upload do celular/PC
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUploadMode('url')}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                          imageUploadMode === 'url' ? 'bg-[#FFA000] text-black' : 'text-[#888]'
                        }`}
                      >
                        Link URL
                      </button>
                    </div>
                  </div>

                  {imageUploadMode === 'upload' ? (
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-[#1F1F1F] border border-[#333] overflow-hidden shrink-0">
                        {formData.image ? (
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#555] text-xs">Foto</div>
                        )}
                      </div>

                      <div className="flex-grow">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingImage}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#222] hover:bg-[#2A2A2A] border border-[#3A3A3A] text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          {isUploadingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-[#FFA000]" />
                              <span>Otimizando imagem...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-[#FFA000]" />
                              <span>Escolher Foto da Galeria</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-[#1F1F1F] border border-[#333] overflow-hidden shrink-0">
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <input
                        type="url"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="https://exemplo.com/foto.jpg"
                        className="w-full px-4 py-2.5 rounded-2xl bg-[#181818] border border-[#2B2B2B] text-xs text-white placeholder-[#555] focus:outline-hidden focus:border-[#FFA000]"
                      />
                    </div>
                  )}
                </div>

                {/* Descrição */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-[#A3A3A3]">Ingredientes & Descrição *</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o hambúrguer, blend de carnes, queijo, molhos especiais..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#181818] border border-[#2B2B2B] text-xs text-white placeholder-[#555] focus:outline-hidden focus:border-[#FFA000]"
                  />
                </div>

                {/* Tempo de Preparo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#A3A3A3]">Tempo Médio de Preparo</label>
                  <input
                    type="text"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                    placeholder="Ex: 15-20 min"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#181818] border border-[#2B2B2B] text-xs text-white placeholder-[#555] focus:outline-hidden focus:border-[#FFA000]"
                  />
                </div>

                {/* Badges */}
                <div className="flex items-center gap-4 pt-4 sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#BBB]">
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                      className="rounded-sm text-[#FFA000] focus:ring-[#FFA000]"
                    />
                    <span>Destaque &quot;Mais Pedido&quot;</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#BBB]">
                    <input
                      type="checkbox"
                      checked={formData.isNew}
                      onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                      className="rounded-sm text-[#FFA000] focus:ring-[#FFA000]"
                    />
                    <span>Selo &quot;Novo&quot;</span>
                  </label>
                </div>

                {/* 📹 ADICIONAR VÍDEO DO PRODUTO (Item 1) */}
                <div className="space-y-2.5 sm:col-span-2 bg-[#181818] p-4 rounded-2xl border border-[#2A2A2A]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#FFA000]/15 text-[#FFA000] flex items-center justify-center">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white block">📹 Adicionar Vídeo do Produto</label>
                        <p className="text-[11px] text-[#888]">
                          O botão &quot;Ver vídeo&quot; só aparecerá para o cliente caso um vídeo seja enviado aqui.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setVideoUploadMode('upload')}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                          videoUploadMode === 'upload' ? 'bg-[#FFA000] text-black' : 'text-[#888]'
                        }`}
                      >
                        Upload de vídeo
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoUploadMode('url')}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                          videoUploadMode === 'url' ? 'bg-[#FFA000] text-black' : 'text-[#888]'
                        }`}
                      >
                        Link URL
                      </button>
                    </div>
                  </div>

                  {videoUploadMode === 'upload' ? (
                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={videoFileInputRef}
                        accept="video/mp4,video/webm"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleVideoFileUpload(file);
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => videoFileInputRef.current?.click()}
                        disabled={isUploadingVideo}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#222] hover:bg-[#2A2A2A] border border-[#3A3A3A] text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        {isUploadingVideo ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#FFA000]" />
                            <span>Processando arquivo de vídeo...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-[#FFA000]" />
                            <span>Escolher Arquivo de Vídeo (MP4 / WebM)</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        value={formData.videoUrl || ''}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        placeholder="https://exemplo.com/meu-video.mp4"
                        className="w-full px-4 py-2.5 rounded-2xl bg-[#222] border border-[#333] text-xs text-white placeholder-[#666] focus:outline-hidden focus:border-[#FFA000]"
                      />
                    </div>
                  )}

                  {formData.videoUrl && (
                    <div className="pt-2 flex items-center gap-3 bg-[#111] p-3 rounded-xl border border-[#2B2B2B]">
                      <div className="w-24 h-16 rounded-xl bg-black overflow-hidden border border-[#333] shrink-0">
                        <video
                          src={formData.videoUrl}
                          className="w-full h-full object-cover"
                          controls
                        />
                      </div>
                      <div className="flex-grow flex items-center justify-between">
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Vídeo anexado com sucesso!
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, videoUrl: '' })}
                          className="text-xs text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                        >
                          Remover vídeo
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 🧀 COMPLEMENTOS / ADICIONAIS DESTE PRODUTO (Item 6) */}
                <div className="space-y-3 sm:col-span-2 bg-[#181818] p-4 rounded-2xl border border-[#2A2A2A]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold text-white block">
                        Complementos &amp; Adicionais deste Produto
                      </label>
                      <p className="text-[11px] text-[#888]">
                        Controle total: fotos manuais, preços, obrigatório/opcional e limites de quantidade.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingComplementModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Novo Adicional</span>
                    </button>
                  </div>

                  {itemComplements.length === 0 ? (
                    <p className="text-xs text-[#777] italic py-2">
                      Nenhum adicional específico cadastrado para este produto.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {itemComplements.map((comp, idx) => (
                        <div
                          key={comp.id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#202020] border border-[#2D2D2D] text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Ordenação Up/Down */}
                            <div className="flex flex-col gap-0.5">
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveComplementOrder(idx, 'up')}
                                  className="text-[#777] hover:text-white"
                                  title="Subir na ordem"
                                >
                                  ▲
                                </button>
                              )}
                              {idx < itemComplements.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveComplementOrder(idx, 'down')}
                                  className="text-[#777] hover:text-white"
                                  title="Descer na ordem"
                                >
                                  ▼
                                </button>
                              )}
                            </div>

                            {/* Foto do complemento */}
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#2D2D2D] shrink-0 border border-[#3A3A3A]">
                              {comp.image ? (
                                <img src={comp.image} alt={comp.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] text-[#666]">Sem foto</div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <span className="font-bold text-white block truncate">{comp.name}</span>
                              <div className="flex items-center gap-2 text-[10px] text-[#AAA]">
                                <span className="text-emerald-400 font-bold">
                                  + R$ {comp.price.toFixed(2).replace('.', ',')}
                                </span>
                                <span>•</span>
                                <span className={comp.isRequired ? 'text-amber-400 font-bold' : 'text-[#888]'}>
                                  {comp.isRequired ? 'Obrigatório' : 'Opcional'}
                                </span>
                                <span>•</span>
                                <span>Qtd: {comp.minQuantity || 0} a {comp.maxQuantity || 5}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteItemComplement(comp.id)}
                            className="p-1.5 rounded-lg text-[#777] hover:text-red-400 shrink-0 cursor-pointer"
                            title="Remover complemento deste produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer with Delete button (Item 5) */}
              <div className="pt-4 border-t border-[#222] flex items-center justify-between gap-3">
                {editingItem ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteItem({ id: editingItem.id, name: editingItem.name })}
                    className="px-4 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>Excluir Produto</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsItemModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-[#333] text-xs font-bold text-[#888] hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#FFA000] hover:bg-[#FFB300] text-black font-brand font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-[#FFA000]/20"
                  >
                    {editingItem ? 'Salvar Alterações' : 'Adicionar ao Cardápio'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EXCLUSÃO DE ITEM COM CONFIRMAÇÃO REAL (Item 5)                     */}
      {/* ========================================================================= */}
      {confirmDeleteItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2B2B2B] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center text-white">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-brand font-black text-lg">Excluir Produto?</h3>
              <p className="text-xs text-[#AAA] mt-1 leading-relaxed">
                Tem certeza que deseja remover <strong>&quot;{confirmDeleteItem.name}&quot;</strong>? O produto será excluído imediatamente do cardápio e não aparecerá para os clientes.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteItem(null)}
                className="py-2.5 rounded-xl bg-[#222] hover:bg-[#2A2A2A] text-[#AAA] hover:text-white font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => executeDeleteItem(confirmDeleteItem.id, confirmDeleteItem.name)}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-red-600/30"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADICIONAR NOVO COMPLEMENTO MANUALMENTE AO PRODUTO (Item 6)         */}
      {/* ========================================================================= */}
      {isAddingComplementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2B2B2B] rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="font-brand font-black text-base">Novo Complemento para o Produto</h3>
              <button
                type="button"
                onClick={() => setIsAddingComplementModalOpen(false)}
                className="text-[#777] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#AAA] font-bold block mb-1">Nome do Complemento *</label>
                <input
                  type="text"
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  placeholder="Ex: Bacon Crocante, Picles Artesanal, Molho..."
                  className="w-full px-3 py-2 rounded-xl bg-[#202020] border border-[#333] text-white"
                />
              </div>

              <div>
                <label className="text-[#AAA] font-bold block mb-1">Preço Adicional (R$) *</label>
                <input
                  type="text"
                  value={newCompPrice}
                  onChange={(e) => setNewCompPrice(e.target.value)}
                  placeholder="Ex: 5,00"
                  className="w-full px-3 py-2 rounded-xl bg-[#202020] border border-[#333] text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[#AAA] font-bold block mb-1">Foto do Complemento</label>
                <input
                  type="file"
                  ref={compImgFileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleComplementImageUpload(f);
                  }}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => compImgFileInputRef.current?.click()}
                    disabled={isUploadingCompImg}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#222] border border-[#333] text-[#AAA] hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingCompImg ? 'Carregando foto...' : 'Upload Foto Manual'}</span>
                  </button>
                  {newCompImage && (
                    <button
                      type="button"
                      onClick={() => setNewCompImage('')}
                      className="text-red-400 text-[11px] underline"
                    >
                      Remover foto
                    </button>
                  )}
                </div>
                {newCompImage && (
                  <div className="mt-2 w-12 h-12 rounded-xl overflow-hidden border border-[#333]">
                    <img src={newCompImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[#AAA] font-bold block mb-1">Qtd Mínima</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={newCompMinQty}
                    onChange={(e) => setNewCompMinQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#202020] border border-[#333] text-white"
                  />
                </div>
                <div>
                  <label className="text-[#AAA] font-bold block mb-1">Qtd Máxima</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newCompMaxQty}
                    onChange={(e) => setNewCompMaxQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#202020] border border-[#333] text-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newCompIsRequired}
                  onChange={(e) => setNewCompIsRequired(e.target.checked)}
                  className="rounded-sm text-[#FFA000] focus:ring-[#FFA000]"
                />
                <span className="font-bold text-[#DDD]">Adicional Obrigatório (cliente precisa escolher)</span>
              </label>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setIsAddingComplementModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#222] text-[#888] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomComplement}
                  className="px-5 py-2 rounded-xl bg-[#FFA000] text-black font-brand font-black cursor-pointer hover:bg-[#FFB300]"
                >
                  Adicionar ao Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
