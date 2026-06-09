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
  'keyboard-shortcuts': lazy(() => import('./tutorials/keyboard-shortcuts')),
  'edge-inspector': lazy(() => import('./tutorials/edge-inspector')),
  'special-nodes': lazy(() => import('./tutorials/special-nodes')),
  'guardar-y-exportar': lazy(() => import('./tutorials/guardar-y-exportar')),
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
      { id: 'multiples-edges', title: 'Crear múltiples edges desde selección' },
    ],
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Atajos de teclado',
    description: 'Domina el lienzo con atajos de teclado rápidos.',
    sections: [
      { id: 'busqueda-navegacion', title: 'Búsqueda y navegación' },
      { id: 'seleccion-movimiento', title: 'Selección y movimiento' },
      { id: 'edicion-eliminacion', title: 'Edición y eliminación' },
    ],
  },
  {
    id: 'edge-inspector',
    title: 'Personalizar conexiones',
    description: 'Ajusta el estilo y la animación de cada conexión desde el inspector.',
    sections: [
      { id: 'abrir-inspector-conexion', title: 'Abrir el inspector de una conexión' },
      { id: 'estilo-de-linea', title: 'Estilo de línea' },
    ],
  },
  {
    id: 'special-nodes',
    title: 'Nodos especiales',
    description: 'Imágenes pegadas, API Gateway con rutas HTTP y VPN Gateway con Customer Gateway.',
    sections: [
      { id: 'imagenes-pegadas', title: 'Imágenes pegadas' },
      { id: 'api-gateway-rutas', title: 'API Gateway: rutas HTTP' },
      { id: 'vpn-gateway-conexion', title: 'VPN Gateway y Customer Gateway' },
    ],
  },
  {
    id: 'guardar-y-exportar',
    title: 'Guardar y exportar',
    description: 'Guarda tus arquitecturas en la nube y expórtalas como imagen, Terraform o CloudFormation.',
    sections: [
      { id: 'guardar', title: 'Guardar arquitectura' },
      { id: 'proyectos-guardados', title: 'Proyectos guardados' },
      { id: 'exportar', title: 'Exportar arquitectura' },
    ],
  },
]

export function getTutorial(id: string): TutorialMeta | undefined {
  return TUTORIALS.find((t) => t.id === id)
}
