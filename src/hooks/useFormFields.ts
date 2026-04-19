import { useQuery } from '@tanstack/react-query'
import { fetchFormFields } from '../api/tickets'

export function useFormFields(formId: number | null) {
  return useQuery({
    queryKey: ['form-fields', formId],
    queryFn: () => fetchFormFields(formId!),
    enabled: formId !== null,
    staleTime: 24 * 60 * 60_000, // forms rarely change
  })
}
