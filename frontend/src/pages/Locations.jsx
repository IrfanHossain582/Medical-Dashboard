import CrudResource from "../components/CrudResource";

export default function Locations() {
  return (
    <CrudResource
      title="Locations"
      resource="locations"
      columns={[
        { key: "name", label: "Name" },
        { key: "city", label: "City" },
        { key: "phone", label: "Phone" },
        { key: "is_active", label: "Active", render: (r) => (r.is_active ? "Yes" : "No") },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "address", label: "Address" },
        { name: "city", label: "City" },
        { name: "phone", label: "Phone" },
      ]}
    />
  );
}
