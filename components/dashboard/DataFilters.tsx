import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import type { FilterConfig } from "@/lib/dashboard/types";

export default function DataFilters({ config }: { config: FilterConfig }) {
  return (
    <Card className="p-4">
      <div className="grid gap-3 lg:grid-cols-[1.5fr_repeat(4,minmax(140px,1fr))]">
        <Input label="Busca" placeholder={config.searchPlaceholder} suffix={<Search size={16} />} />
        {config.selects.map((select) => (
          <label key={select.label} className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
            {select.label}
            <select className="input-base h-11 py-0">
              {select.options.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        ))}
      </div>
    </Card>
  );
}
