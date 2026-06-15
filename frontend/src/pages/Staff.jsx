import CrudResource from "../components/CrudResource";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "receptionist", label: "Receptionist" },
  { value: "doctor", label: "Doctor" },
  { value: "lab", label: "Lab Technician" },
  { value: "accountant", label: "Accountant" },
];

export default function Staff() {
  return (
    <CrudResource
      title="Staff"
      resource="users"
      columns={[
        { key: "username", label: "Username" },
        { key: "email", label: "Email" },
        { key: "role", label: "Role", render: (r) => <span className="badge">{r.role}</span> },
        { key: "is_active", label: "Active", render: (r) => (r.is_active ? "Yes" : "No") },
      ]}
      fields={[
        { name: "username", label: "Username", required: true },
        { name: "email", label: "Email", type: "email" },
        { name: "first_name", label: "First name" },
        { name: "last_name", label: "Last name" },
        { name: "role", label: "Role", type: "select", options: ROLES, required: true },
        { name: "phone", label: "Phone" },
        { name: "location", label: "Location", type: "select", optionsResource: "locations" },
        { name: "password", label: "Password (set/reset)", type: "password" },
      ]}
    />
  );
}
