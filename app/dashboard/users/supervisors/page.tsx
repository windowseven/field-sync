import { redirect } from 'next/navigation'

export default function UsersSupervisorsAliasPage() {
  redirect('/dashboard/users?tab=supervisors')
}

