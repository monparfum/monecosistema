import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/product-form";

export const Route = createFileRoute("/_admin/admin/produtos/novo")({ component: NewProduct });

function NewProduct() {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <div className="eyebrow mb-2">Catálogo</div>
        <h1 className="font-display text-4xl">Novo produto</h1>
      </div>
      <ProductForm />
    </div>
  );
}
