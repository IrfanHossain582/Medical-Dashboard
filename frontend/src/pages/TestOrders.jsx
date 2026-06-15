import CrudResource from "../components/CrudResource";

const fmt = (s) => (s ? new Date(s).toLocaleDateString() : "");

const STATUS_OPTIONS = [
  { value: "ordered", label: "Ordered" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function TestOrders() {
  return (
    <CrudResource
      title="Test Orders"
      resource="test-orders"
      quickStatus={{ field: "status", options: STATUS_OPTIONS }}
      filters={[
        { name: "patient", label: "Patients", optionsResource: "patients" },
        { name: "test", label: "Tests", optionsResource: "tests" },
        { name: "status", label: "Status", options: STATUS_OPTIONS },
      ]}
      columns={[
        { key: "patient_name", label: "Patient" },
        { key: "test_name", label: "Test" },
        { key: "test_category", label: "Category" },
        {
          key: "status",
          label: "Status",
          render: (r) => <span className={`tag ${r.status}`}>{r.status_display}</span>,
        },
        { key: "price", label: "Price", render: (r) => `$${r.price}` },
        { key: "ordered_at", label: "Ordered", render: (r) => fmt(r.ordered_at) },
      ]}
      fields={[
        { name: "patient", label: "Patient", type: "select", optionsResource: "patients", required: true },
        { name: "test", label: "Test", type: "select", optionsResource: "tests", optionLabel: "name", required: true },
        { name: "appointment", label: "Appointment (optional)", type: "select", optionsResource: "appointments", optionLabel: "patient_name" },
        { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
        { name: "price", label: "Price (auto from test if blank)", type: "number", step: "0.01" },
        { name: "result", label: "Result / notes", type: "textarea" },
      ]}
    />
  );
}
