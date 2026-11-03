import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import Link from "next/link";

export default function Hero() {
  return (
    <section id="inicio" className="relative bg-primary py-20 md:py-32">
      <div className="container flex flex-col items-center text-center">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl md:text-6xl">
            Bem-vindo à Igreja Central
          </h1>
          <p className="text-xl text-white/90 md:text-2xl">
           Uma Vida Com Propósito
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="#cultos">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-primary">
                Nossos Cultos
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#historia">
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent text-white border-white hover:bg-white/10"
              >
                Conheça Nossa História
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 z-[-1] opacity-10">
        <Image src="/placeholder.svg?height=1080&width=1920" alt="Background" fill className="object-cover" priority />
      </div>
    </section>
  )
}
