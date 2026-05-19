// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import Home from './pages/Home.tsx'
import Movies from './pages/Movies.tsx'
import MyList from './pages/MyList.tsx'

// Crie a instância do QueryClient fora do componente para não recriar a cada renderização
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Opcional, mas recomendado: evita que o app faça novas requisições toda vez que você clica em outra aba do navegador e volta
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/filmes" element={<Movies />} />
          <Route path="/minha-lista" element={<MyList />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}