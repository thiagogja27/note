'use client'

import { Button } from '@/components/ui/button'
import { ArrowUpRight } from 'lucide-react'

const links = [
  {
    href: 'https://conversorpdfrumo.vercel.app/',
    label: 'Conversor Resumo RUMO',
  },
  {
    href: 'https://vli-psi.vercel.app/',
    label: 'Conversor e Conferente VLI',
  },
  {
    href: 'https://conferente-fiscal-balanca.vercel.app/',
    label: 'Conferente de Notas',
  },
  {
    href: 'https://v0-cameras-ocr.vercel.app/',
    label: 'Cameras OCR',
  },
]

export function ExternalLinks() {
  return (
    <div className="mt-8 w-full">
      <h3 className="text-base font-semibold mb-3 text-center text-muted-foreground">Acessos Rápidos</h3>
      <div className="grid grid-cols-1 gap-3">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="w-full justify-between items-center p-6 text-base">
              {link.label}
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </a>
        ))}
      </div>
    </div>
  )
}
