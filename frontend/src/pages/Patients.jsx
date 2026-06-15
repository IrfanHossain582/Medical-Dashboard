import CrudResource from "../components/CrudResource";

export default function Patients() {
  return (
    <CrudResource
      title="Patients"
      resource="patients"
      filters={[{ name: "location", label: "Locations", optionsResource: "locations" }]}
      columns={[
        { key: "name", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "location_name", label: "Location" },
        {
          key: "patient_type",
          label: "Type",
          render: (r) => (
            <span className={`tag ${r.patient_type}`}>{r.patient_type}</span>
          ),
        },
        { key: "due", label: "Due", render: (r) => `$${r.due}` },
      ]}
      fields={[
        { name: "name", label: "Full name", required: true },
        {
          name: "gender",
          label: "Gender",
          type: "select",
          options: [
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" },
          ],
        },
        { name: "date_of_birth", label: "Date of birth", type: "date" },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email", type: "email" },
        { name: "address", label: "Address" },
        { name: "location", label: "Location", type: "select", optionsResource: "locations" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
