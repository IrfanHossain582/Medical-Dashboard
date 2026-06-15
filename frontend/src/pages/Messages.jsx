import CrudResource from "../components/CrudResource";

const fmt = (s) => (s ? new Date(s).toLocaleString() : "");

export default function Messages() {
  return (
    <CrudResource
      title="Messages"
      resource="messages"
      quickStatus={{
        field: "is_read",
        options: [
          { value: false, label: "Unread" },
          { value: true, label: "Read" },
        ],
      }}
      filters={[
        {
          name: "is_read",
          label: "Status",
          options: [
            { value: "false", label: "Unread" },
            { value: "true", label: "Read" },
          ],
        },
      ]}
      columns={[
        {
          key: "name",
          label: "From",
          render: (r) => (
            <span style={{ fontWeight: r.is_read ? 400 : 700 }}>{r.name}</span>
          ),
        },
        { key: "email", label: "Email" },
        { key: "subject", label: "Subject", render: (r) => r.subject || "—" },
        {
          key: "message",
          label: "Message",
          render: (r) => (
            <span title={r.message}>
              {r.message.length > 60 ? r.message.slice(0, 60) + "…" : r.message}
            </span>
          ),
        },
        {
          key: "is_read",
          label: "Status",
          render: (r) => (
            <span className={`tag ${r.is_read ? "completed" : "booked"}`}>
              {r.is_read ? "Read" : "Unread"}
            </span>
          ),
        },
        { key: "created_at", label: "Received", render: (r) => fmt(r.created_at) },
      ]}
    />
  );
}
