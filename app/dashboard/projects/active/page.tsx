import { redirect } from 'next/navigation'

export default function ActiveProjectsAliasPage() {
  redirect('/dashboard/projects?status=active')
}

