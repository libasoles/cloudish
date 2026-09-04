/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import App from './App'

const DocsPage = lazy(() => import('./pages/DocsPage'))
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/changelog',
    element: (
      <Suspense fallback={<div className="h-screen bg-background" />}>
        <ChangelogPage />
      </Suspense>
    ),
  },
  {
    path: '/docs',
    element: <Navigate to="/docs/getting-started" replace />,
  },
  {
    path: '/docs/:tutorialId',
    element: (
      <Suspense fallback={<div className="h-screen bg-background" />}>
        <DocsPage />
      </Suspense>
    ),
  },
])
