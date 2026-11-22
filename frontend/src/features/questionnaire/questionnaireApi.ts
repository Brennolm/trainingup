import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { api } from '../../lib/api'
import type { Section } from './options'
import type { Questionnaire, QuestionnaireState } from './types'

type Response = { data: Questionnaire }

export const questionnaireApi = {
  get: () => api.get<QuestionnaireState>('/api/questionnaire'),

  /** LGPD art. 11: specific consent for health data. */
  consent: () => api.post<{ health_consent: true }>('/api/questionnaire/consent', { accept: true }),

  /** Resumes the open draft, or starts the next version (pre-filled) after a completed one. */
  start: async () => (await api.post<Response>('/api/questionnaire')).data,

  saveSection: async (section: Section, body: Record<string, unknown>) =>
    (await api.put<Response>(`/api/questionnaire/sections/${section}`, body)).data,

  complete: async (acceptDisclaimer: boolean) =>
    (await api.post<Response>('/api/questionnaire/complete', { accept_disclaimer: acceptDisclaimer })).data,
}

export const QUESTIONNAIRE_QUERY_KEY = ['questionnaire'] as const

export function useQuestionnaire() {
  return useQuery({ queryKey: QUESTIONNAIRE_QUERY_KEY, queryFn: questionnaireApi.get })
}

/** Updates the cached questionnaire after a save, so every screen sees the new answers. */
export function useSetQuestionnaire() {
  const queryClient = useQueryClient()
  return useCallback(
    (patch: Partial<QuestionnaireState>) =>
      queryClient.setQueryData<QuestionnaireState>(QUESTIONNAIRE_QUERY_KEY, (old) => ({
        data: null,
        health_consent: false,
        ...old,
        ...patch,
      })),
    [queryClient],
  )
}
