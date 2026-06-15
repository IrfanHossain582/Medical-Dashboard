import { useState } from "react";
import { useList, useSave, useDelete } from "../api/hooks";

/**
 * Generic list + create/edit/delete page.
 *
 * Props:
 *  - title, resource (API path segment)
 *  - columns: [{ key, label, render?(row) }]
 *  - fields:  [{ name, label, type, options?, optionsResource?, optionLabel?, required?, step? }]
 *  - filters: [{ name, label, optionsResource?, optionLabel?, options? }]
 *  - quickStatus: { field, options } — inline dropdown in each row to PATCH a
 *    single field (e.g. appointment status) without opening the edit form.
 */
export default function CrudResource({
  title,
  resource,
  columns,
  fields = [],
  filters = [],
  quickStatus = null,
}) {
  const [filterValues, setFilterValues] = useState({});
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // null | {} (new) | row (edit)

  const params = { ...filterValues };
  if (search) params.search = search;

  const { data, isLoading, error } = useList(resource, params);
  const save = useSave(resource);
  const del = useDelete(resource);

  const rows = data?.results ?? data ?? [];

  return (
    <div>
      <header className="page-head">
        <h1>{title}</h1>
        <button className="primary" onClick={() => setEditing({})}>
          + Add {title.replace(/s$/, "")}
        </button>
      </header>

      <div className="toolbar">
        <input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {filters.map((f) => (
          <FilterSelect
            key={f.name}
            filter={f}
            value={filterValues[f.name] || ""}
            onChange={(v) => setFilterValues((s) => ({ ...s, [f.name]: v }))}
          />
        ))}
      </div>

      {isLoading && <p>Loading…</p>}
      {error && <p className="error">Failed to load: {error.message}</p>}

      {!isLoading && (
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="muted">
                  No records.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
                ))}
                <td className="row-actions">
                  {quickStatus && (
                    <select
                      className="quick-status"
                      value={row[quickStatus.field] || ""}
                      onChange={(e) =>
                        save.mutate({ id: row.id, [quickStatus.field]: e.target.value })
                      }
                    >
                      {quickStatus.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {fields.length > 0 && (
                    <button className="link-btn" onClick={() => setEditing(row)}>
                      Edit
                    </button>
                  )}
                  <button
                    className="link-btn danger"
                    onClick={() => {
                      if (confirm("Delete this record?")) del.mutate(row.id);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && fields.length > 0 && (
        <RecordForm
          title={title}
          fields={fields}
          initial={editing}
          saving={save.isPending}
          error={save.error}
          onCancel={() => setEditing(null)}
          onSubmit={(values) =>
            save.mutate(
              { id: editing.id, ...values },
              { onSuccess: () => setEditing(null) }
            )
          }
        />
      )}
    </div>
  );
}

function FilterSelect({ filter, value, onChange }) {
  const { data } = useList(filter.optionsResource || "", {}, );
  const options =
    filter.options ||
    (data?.results ?? data ?? []).map((o) => ({
      value: o.id,
      label: o[filter.optionLabel || "name"],
    }));
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">All {filter.label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function RecordForm({ title, fields, initial, onSubmit, onCancel, saving, error }) {
  const [values, setValues] = useState(() => {
    const v = {};
    fields.forEach((f) => (v[f.name] = initial[f.name] ?? ""));
    return v;
  });
  const set = (name, val) => setValues((s) => ({ ...s, [name]: val }));

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          {initial.id ? "Edit" : "Add"} {title.replace(/s$/, "")}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(values);
          }}
        >
          {fields.map((f) => (
            <FormField key={f.name} field={f} value={values[f.name]} onChange={set} />
          ))}
          {error && (
            <p className="error">
              {JSON.stringify(error.response?.data || error.message)}
            </p>
          )}
          <div className="modal-actions">
            <button type="button" className="link-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ field, value, onChange }) {
  const { data } = useList(field.optionsResource || "", {});
  const relOptions =
    field.optionsResource &&
    (data?.results ?? data ?? []).map((o) => ({
      value: o.id,
      label: o[field.optionLabel || "name"],
    }));

  const common = {
    value: value ?? "",
    onChange: (e) => onChange(field.name, e.target.value),
    required: field.required,
  };

  return (
    <label>
      {field.label}
      {field.type === "select" ? (
        <select {...common}>
          <option value="">—</option>
          {(field.options || relOptions || []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea {...common} rows={3} />
      ) : (
        <input type={field.type || "text"} step={field.step} {...common} />
      )}
    </label>
  );
}
