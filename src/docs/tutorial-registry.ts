import { lazy } from 'react'
import type { ComponentType } from 'react'

export type TutorialSection = {
  id: string
  title: string
}

export type TutorialMeta = {
  id: string
  title: string
  description: string
  sections: TutorialSection[]
}

export type LazyComponent = React.LazyExoticComponent<ComponentType>

export const TUTORIAL_LAZY_MAP: Record<string, LazyComponent> = {
  'getting-started': lazy(() => import('./tutorials/getting-started')),
}

export const TUTORIALS: TutorialMeta[] = [
  {
    id: 'getting-started',
    title: 'Primeros pasos',
    description: 'Aprende a usar todas las funciones principales de Cloudish.',
    sections: [
      { id: 'agregar-nodos', title: 'Agregar nodos' },
      { id: 'conectar-nodos', title: 'Conectar nodos' },
      { id: 'contenedores', title: 'Contenedores jerárquicos' },
      { id: 'az-sync', title: 'Sincronización de AZs' },
      { id: 'seleccion-multiple', title: 'Selección múltiple' },
      { id: 'agregar-a-seleccion', title: 'Agregar a la selección' },
      { id: 'alineacion', title: 'Herramientas de alineación' },
    ],
  },
]

export function getTutorial(id: string): TutorialMeta | undefined {
  return TUTORIALS.find((t) => t.id === id)
}
