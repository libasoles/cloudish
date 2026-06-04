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
  'hierarchical-containers': lazy(() => import('./tutorials/hierarchical-containers')),
  'selection': lazy(() => import('./tutorials/selection')),
}

export const TUTORIALS: TutorialMeta[] = [
  {
    id: 'getting-started',
    title: 'Primeros pasos',
    description: 'Aprende a agregar y conectar servicios en el lienzo.',
    sections: [
      { id: 'agregar-nodos', title: 'Agregar nodos' },
      { id: 'conectar-nodos', title: 'Conectar nodos' },
    ],
  },
  {
    id: 'hierarchical-containers',
    title: 'Contenedores jerárquicos',
    description: 'Organiza servicios en Regiones, VPCs, AZs y Subnets.',
    sections: [
      { id: 'contenedores', title: 'Contenedores jerárquicos' },
      { id: 'az-sync', title: 'Sincronización de AZs' },
    ],
  },
  {
    id: 'selection',
    title: 'Selección',
    description: 'Selecciona, mueve y alinea varios nodos a la vez.',
    sections: [
      { id: 'seleccion-multiple', title: 'Selección múltiple' },
      { id: 'agregar-a-seleccion', title: 'Agregar a la selección' },
      { id: 'alineacion', title: 'Herramientas de alineación' },
    ],
  },
]

export function getTutorial(id: string): TutorialMeta | undefined {
  return TUTORIALS.find((t) => t.id === id)
}
