import { redirect } from 'next/navigation'

export default function FormsCreateAliasPage() {
  redirect('/dashboard/forms?create=1')
}

