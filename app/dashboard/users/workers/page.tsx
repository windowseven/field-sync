import { redirect } from 'next/navigation'

export default function UsersWorkersAliasPage() {
  redirect('/dashboard/users?tab=workers')
}

