import Image from "next/image"

export default function History() {
  return (
    <section id="historia" className="py-16 md:py-24 bg-white">
      <div className="container">
        <div className="flex flex-col items-center text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-primary mb-4">
            Nossa História
          </h2>
          <p className="max-w-[800px] text-gray-600 md:text-xl">
            Conheça a trajetória da Igreja Central e como Deus tem nos guiado ao longo dos anos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <Image
              src="/placeholder.svg?height=720&width=1280"
              alt="História da Igreja"
              fill
              className="object-cover"
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-primary">Fundação</h3>
              <p className="text-gray-600">
                Em Desenvolvimento.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-primary">Crescimento</h3>
              <p className="text-gray-600">
                Em Desenvolvimento.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-primary">Atualidade</h3>
              <p className="text-gray-600">
                Em Desenvolvimento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
