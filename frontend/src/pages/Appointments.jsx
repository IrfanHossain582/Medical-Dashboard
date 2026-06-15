import CrudResource from "../components/CrudResource";

const fmt = (s) => (s ? new Date(s).toLocaleString() : "");

const STATUS_OPTIONS = [
  { value: "booked", label: "Booked" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No show" },
];

export default function Appointments() {
  return (
    <CrudResource
      title="Appointments"
      resource="appointments"
      quickStatus={{ field: "status", options: STATUS_OPTIONS }}
      filters={[
        { name: "location", label: "Locations", optionsResource: "locations" },
        { name: "doctor", label: "Doctors", optionsResource: "doctors" },
        { name: "status", label: "Status", options: STATUS_OPTIONS },
      ]}
      columns={[
        { key: "patient_name", label: "Patient" },
        { key: "doctor_name", label: "Doctor" },
        { key: "location_name", label: "Location" },
        { key: "scheduled_for", label: "When", render: (r) => fmt(r.scheduled_for) },
        {
          key: "status",
          label: "Status",
          render: (r) => <span className={`tag ${r.status}`}>{r.status_display}</span>,
        },
        { key: "source", label: "Source" },
      ]}
      fields={[
        { name: "patient", label: "Patient", type: "select", optionsResource: "patients", required: true },
        { name: "doctor", label: "Doctor", type: "select", optionsResource: "doctors", required: true },
        { name: "location", label: "Location", type: "select", optionsResource: "locations" },
        { name: "scheduled_for", label: "Date & time", type: "datetime-local", required: true },
        { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
        { name: "reason", label: "Reason" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
