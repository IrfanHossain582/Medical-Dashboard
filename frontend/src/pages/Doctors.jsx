import CrudResource from "../components/CrudResource";

export default function Doctors() {
  return (
    <CrudResource
      title="Doctors"
      resource="doctors"
      filters={[{ name: "location", label: "Locations", optionsResource: "locations" }]}
      columns={[
        {
          key: "photo_url",
          label: "",
          render: (r) => (
            <img
              className="avatar-sm"
              src={r.photo_url || `https://i.pravatar.cc/80?u=${r.id}`}
              alt={r.name}
            />
          ),
        },
        { key: "name", label: "Name" },
        { key: "specialization", label: "Specialization" },
        { key: "location_name", label: "Location" },
        { key: "consultation_fee", label: "Fee", render: (r) => `$${r.consultation_fee}` },
        { key: "is_active", label: "Active", render: (r) => (r.is_active ? "Yes" : "No") },
      ]}
      fields={[
        { name: "name", label: "Full name", required: true },
        { name: "specialization", label: "Specialization" },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone" },
        { name: "location", label: "Location", type: "select", optionsResource: "locations" },
        { name: "consultation_fee", label: "Consultation fee", type: "number", step: "0.01" },
        { name: "photo_url", label: "Photo URL", type: "url" },
        { name: "bio", label: "Bio", type: "textarea" },
      ]}
    />
  );
}
