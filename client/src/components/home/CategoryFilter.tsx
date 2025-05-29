import { useState } from "react";
import { Button } from "@/components/ui/button";

const categories = [
  { id: "all", label: "All Games" },
  { id: "mobile_legends", label: "Mobile Legends" },
  { id: "pubg_mobile", label: "PUBG Mobile" },
  { id: "free_fire", label: "Free Fire" },
  { id: "valorant", label: "Valorant" },
  { id: "genshin_impact", label: "Genshin Impact" },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <section className="px-4 py-4">
      <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
        {categories.map((category) => (
          <Button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            variant={selectedCategory === category.id ? "default" : "secondary"}
            className={`flex-shrink-0 px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? "bg-nxe-primary text-white hover:bg-nxe-primary/80"
                : "bg-nxe-surface text-gray-300 hover:bg-nxe-card"
            }`}
          >
            {category.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
