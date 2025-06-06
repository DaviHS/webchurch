import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, MapPin } from "lucide-react"

export default function Services() {
  return (
    <section id="cultos" className="py-16 md:py-24 bg-gray-50">
      <div className="container">
        <div className="flex flex-col items-center text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-primary mb-4">
            Nossos Cultos
          </h2>
          <p className="max-w-[800px] text-gray-600 md:text-xl">
            Venha participar de nossos cultos e atividades semanais. Temos programações para todas as idades e momentos
            especiais de adoração e comunhão.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 border-primary/10">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold mb-4 text-primary">Culto da Família</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-primary mr-3" />
                  <span>Domingo</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-primary mr-3" />
                  <span>18:00</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-primary mr-3" />
                  <span>Rua Jamil João Zarif, 1408 - Jardim Santa Vicencia</span>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                Momentos de louvor, adoração e pregação da Palavra de Deus para toda a família.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/10">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold mb-4 text-primary">Culto Mulheres de Fé</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-primary mr-3" />
                  <span>Quarta-feira</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-primary mr-3" />
                  <span>19:30</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-primary mr-3" />
                  <span>Rua Jamil João Zarif, 1408 - Jardim Santa Vicencia</span>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                Um tempo dedicado à intercessão e busca da presença de Deus através da oração.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/10">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold mb-4 text-primary">Raízes</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-primary mr-3" />
                  <span>Dias variados</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-primary mr-3" />
                  <span>19:30</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-primary mr-3" />
                  <span>Endereços variados. Entre em contato para saber mais!</span>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                Momento de estudo e dedicação a palavra de Deus em intimidade.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
    </section>
  )
}
