import Image from "next/image"

export default function Gallery() {
  return (
    <section id="galeria" className="py-16 md:py-24 bg-gray-50">
      <div className="container">
        <div className="flex flex-col items-center text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-primary mb-4">Galeria</h2>
          <p className="max-w-[800px] text-gray-600 md:text-xl">
            Momentos especiais de nossa comunidade em cultos, eventos e atividades.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="relative aspect-square overflow-hidden rounded-lg">
              <Image
                src={`/placeholder.svg?height=600&width=600&text=Foto ${item}`}
                alt={`Foto da igreja ${item}`}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
