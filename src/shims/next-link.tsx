import type { ComponentProps, ReactNode } from "react"
import { Link as RouterLink } from "react-router-dom"

type LinkProps = {
  href: string
  children: ReactNode
} & Omit<ComponentProps<typeof RouterLink>, "to">

/** Shim pour `import Link from "next/link"` dans l'app Vite (pas de modification des pages). */
export default function Link({ href, children, ...rest }: LinkProps) {
  return (
    <RouterLink to={href} {...rest}>
      {children}
    </RouterLink>
  )
}
