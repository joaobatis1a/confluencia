function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-grafite-50">
      <div className="h-16 w-16 rounded-full bg-amarelo-500 flex items-center justify-center mb-6">
        <span className="font-heading text-2xl font-bold text-grafite-900">C</span>
      </div>
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-grafite-900">
        Confluência
      </h1>
      <p className="font-heading text-amarelo-700 font-semibold mt-1">
        Sua cidade, sua voz.
      </p>
      <p className="mt-6 max-w-md text-grafite-700">
        Scaffold inicial do projeto. Stack pronta: React + TypeScript + Tailwind v4
        (tokens do design system aplicados), Supabase, React Leaflet.
      </p>
      <p className="mt-4 text-sm text-grafite-500">
        Veja <code className="bg-grafite-200 px-1.5 py-0.5 rounded">docs/cronograma-atualizado.md</code>{' '}
        e seu guia individual para começar sua primeira tarefa.
      </p>
    </div>
  )
}

export default App
