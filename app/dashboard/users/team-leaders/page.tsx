import { redirect } from 'next/navigation'

export default function UsersTeamLeadersAliasPage() {
  redirect('/dashboard/users?tab=leaders')
}

