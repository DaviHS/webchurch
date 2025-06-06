import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookIcon as Bible, Heart, Users } from "lucide-react"

export default function About() {
  return (
    <section id="sobre" className="py-16 md:py-24 bg-white">
      <div className="container">
        <div className="flex flex-col items-center text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-primary mb-4">
            Sobre Nossa Igreja
          </h2>
          <p className="max-w-[800px] text-gray-600 md:text-xl">
            A Igreja Central é um lugar onde todos são bem-vindos para adorar a Deus, crescer na fé e servir à
            comunidade. Nossa missão é levar a mensagem de esperança e amor de Jesus Cristo a todos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="border-2 border-primary/10">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Bible className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Nossa Missão</h3>
              <p className="text-gray-600">
                Proclamar o evangelho de Jesus Cristo, fazendo discípulos e transformando vidas através da Palavra de
                Deus.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/10">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Nossos Valores</h3>
              <p className="text-gray-600">
                Fé, amor, comunhão, serviço e compromisso com a verdade bíblica são os pilares que sustentam nossa
                comunidade.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/10">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Nossa Comunidade</h3>
              <p className="text-gray-600">
                Somos uma família diversa e acolhedora, unida pelo amor de Cristo e pelo desejo de servir a Deus e ao
                próximo.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button className="bg-primary hover:bg-primary/90">Saiba Mais Sobre Nós</Button>
        </div>
      </div>
    </section>
  )
}
