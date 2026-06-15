import CrudResource from "../components/CrudResource";

const fmt = (s) => (s ? new Date(s).toLocaleString() : "");

export default function Payments() {
  return (
    <CrudResource
      title="Payments"
      resource="payments"
      filters={[
        {
          name: "method",
          label: "Method",
          options: [
            { value: "cash", label: "Cash" },
            { value: "card", label: "Card" },
            { value: "bank", label: "Bank transfer" },
            { value: "mobile", label: "Mobile money" },
            { value: "insurance", label: "Insurance" },
            { value: "other", label: "Other" },
          ],
        },
      ]}
      columns={[
        { key: "patient_name", label: "Patient" },
        { key: "amount", label: "Amount", render: (r) => `$${r.amount}` },
        { key: "method_display", label: "Method" },
        { key: "reference", label: "Reference" },
        { key: "created_at", label: "When", render: (r) => fmt(r.created_at) },
      ]}
      fields={[
        { name: "patient", label: "Patient", type: "select", optionsResource: "patients", required: true },
        { name: "amount", label: "Amount", type: "number", step: "0.01", required: true },
        {
          name: "method",
          label: "Method",
          type: "select",
          options: [
            { value: "cash", label: "Cash" },
            { value: "card", label: "Card" },
            { value: "bank", label: "Bank transfer" },
            { value: "mobile", label: "Mobile money" },
            { value: "insurance", label: "Insurance" },
            { value: "other", label: "Other" },
          ],
        },
        { name: "reference", label: "Reference / receipt #" },
        { name: "note", label: "Note" },
      ]}
    />
  );
}
