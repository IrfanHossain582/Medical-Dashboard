import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "./client";

// Build a query string from a params object, skipping empty values.
function qs(params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== "" && v !== null && v !== undefined
  );
  return entries.length ? "?" + new URLSearchParams(entries).toString() : "";
}

export function useList(resource, params = {}) {
  return useQuery({
    queryKey: [resource, params],
    queryFn: async () => (await client.get(`/${resource}/${qs(params)}`)).data,
  });
}

export function useSummary(params = {}) {
  return useQuery({
    queryKey: ["summary", params],
    queryFn: async () => (await client.get(`/dashboard/summary/${qs(params)}`)).data,
  });
}

export function useSave(resource) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }) =>
      id
        ? (await client.patch(`/${resource}/${id}/`, body)).data
        : (await client.post(`/${resource}/`, body)).data,
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useDelete(resource) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => client.delete(`/${resource}/${id}/`),
    onSuccess: () => qc.invalidateQueries(),
  });
}
