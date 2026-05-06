import { redirect } from 'next/navigation'

export default function FrozenProjectsAliasPage() {
  redirect('/dashboard/projects?status=frozen')
}

