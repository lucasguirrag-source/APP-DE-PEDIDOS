import React from 'react';
import { Category, CategoryData } from '../types';

interface CategoryFilterProps {
  activeCategory: Category;
  onSelectCategory: (cat: Category) => void;
  categories?: CategoryData[];
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  activeCategory,
  onSelectCategory,
  categories,
}) => {
  // Use provided categories or default fallback, excluding any sold-out category
  const activeCategoriesList = categories
    ? categories.filter((c) => !c.isSoldOut)
    : [
        { id: 'combos', name: 'Combos' },
        { id: 'smash', name: 'Smashs' },
        { id: 'bebidas', name: 'Bebidas' },
        { id: 'acompanhamentos', name: 'Porções' },
        { id: 'sobremesas', name: 'Sobremesas' },
      ];

  const filterTabs: { id: Category; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    ...activeCategoriesList.map((c) => ({ id: c.id, label: c.name })),
  ];

  return (
    <div className="w-full overflow-x-auto pb-1 pt-1 scrollbar-none">
      <div className="flex items-center gap-2 min-w-max">
        {filterTabs.map((cat) => {
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#FFA000] text-black font-black shadow-md shadow-[#FFA000]/20'
                  : 'bg-[#141414] text-[#A3A3A3] hover:text-white hover:bg-[#1E1E1E] border border-[#262626] hover:border-[#FFA000]/50'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
