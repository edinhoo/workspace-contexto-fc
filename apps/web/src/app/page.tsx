import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10">
      <div className="space-y-4">
        <Badge>Web App</Badge>
        <div className="space-y-3">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            Primeira camada visual do Contexto FC sobre a data-api
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[color:var(--muted-foreground)] md:text-lg">
            Este ciclo estabelece a estrutura do app, o BFF interno e as primeiras
            telas sobre os dados já validados no banco.
          </p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Próximo passo</CardTitle>
          <CardDescription>
            A busca será a primeira tela funcional do app e servirá como entrada
            para a página de partida.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Link
            href="/search"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[color:var(--accent)] px-5 text-sm font-medium text-[color:var(--accent-foreground)]"
          >
            Ir para busca
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
