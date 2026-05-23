import React from 'react'
import { hydrateRoot } from 'react-dom/client'
import { InfiniteGrid } from './components/InfiniteGrid'
import { AnalyzerModal } from './components/AnalyzerModal'
import { OptimizationApp } from './components/OptimizationApp'

const components: Record<string, React.ComponentType<any>> = {
  InfiniteGrid,
  AnalyzerModal,
  OptimizationApp,
}

const hydrateAll = () => {
  const elements = document.querySelectorAll('[data-hydrate]')
  elements.forEach(el => {
    const componentName = el.getAttribute('data-hydrate')
    if (componentName && components[componentName]) {
      const Component = components[componentName]
      const props = JSON.parse(el.getAttribute('data-props') || '{}')
      hydrateRoot(el, <Component {...props} />)
    }
  })
}

if (typeof window !== 'undefined') {
  hydrateAll()
}
