import { useMutation, useQueryClient } from '@tanstack/react-query'

interface CrudApi {
  create: (body: unknown) => Promise<unknown>
  update: (id: number, body: unknown) => Promise<unknown>
  remove: (id: number) => Promise<void>
}

/** Shared create/update/delete mutations that invalidate the list query. */
export function useCrud(queryKey: string, api: CrudApi, onSaved?: () => void) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [queryKey] })

  const save = useMutation({
    mutationFn: ({ id, body }: { id: number | null; body: unknown }) =>
      id == null ? api.create(body) : api.update(id, body),
    onSuccess: () => {
      invalidate()
      onSaved?.()
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.remove(id),
    onSuccess: invalidate,
  })

  return { save, remove }
}
