import { Eta } from "https://deno.land/x/eta@v3.1.0/src/index.ts"

const eta = new Eta({
  views: Deno.cwd() + "/views",
})

export function renderTemplate(path: string, data: object) {
  const res = eta.render(path, data)
  return res
}
