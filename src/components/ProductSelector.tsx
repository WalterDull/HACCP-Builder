"use client";

interface ProductLike {
  id: string;
  name: string;
}

export default function ProductSelector({
  products,
  activeProductId,
  onSelect,
}: {
  products: ProductLike[];
  activeProductId: string | null;
  onSelect: (productId: string) => void;
}) {
  if (products.length === 0) {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Add a product on the Products step first — process flow, formulation, and hazard analysis
        are all tracked per product.
      </p>
    );
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {products.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            activeProductId === p.id ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}
