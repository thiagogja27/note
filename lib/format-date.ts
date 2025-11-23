/**
 * Formata uma data para mostrar quanto tempo se passou desde então
 * Substitui date-fns para evitar problemas de importação
 */
export function formatDistanceToNow(date: Date | string | number): string {
  const now = new Date().getTime()
  const then = new Date(date).getTime()
  const diffInSeconds = Math.floor((now - then) / 1000)

  if (diffInSeconds < 60) {
    return "agora mesmo"
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} ${diffInMinutes === 1 ? "minuto" : "minutos"}`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `há ${diffInHours} ${diffInHours === 1 ? "hora" : "horas"}`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `há ${diffInDays} ${diffInDays === 1 ? "dia" : "dias"}`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `há ${diffInMonths} ${diffInMonths === 1 ? "mês" : "meses"}`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `há ${diffInYears} ${diffInYears === 1 ? "ano" : "anos"}`
}
