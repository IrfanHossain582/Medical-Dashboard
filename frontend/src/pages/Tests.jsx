import CrudResource from "../components/CrudResource";

const CATEGORY_OPTIONS = [
  { value: "lab", label: "Lab Test" },
  { value: "diagnostic", label: "Diagnostic Test" },
  { value: "imaging", label: "Imaging" },
  { value: "procedure", label: "Procedure" },
  { value: "other", label: "Other" },
];

export default function Tests() {
  return (
    <CrudResource
      title="Tests"
      resource="tests"
      filters={[{ name: "category", label: "Category", options: CATEGORY_OPTIONS }]}
      columns={[
        { key: "name", label: "Name" },
        { key: "code", label: "Code" },
        {
          key: "category",
          label: "Category",
          render: (r) => <span className={`tag ${r.category}`}>{r.category_display}</span>,
        },
        { key: "price", label: "Price", render: (r) => `$${r.price}` },
        { key: "is_active", label: "Active", render: (r) => (r.is_active ? "Yes" : "No") },
      ]}
      fields={[
        { name: "name", label: "Test name", required: true },
        { name: "code", label: "Code" },
        { name: "category", label: "Category", type: "select", options: CATEGORY_OPTIONS, required: true },
        { name: "price", label: "Price", type: "number", step: "0.01" },
        { name: "description", label: "Description", type: "textarea" },
      ]}
    />
  );
}
