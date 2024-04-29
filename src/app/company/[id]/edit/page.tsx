"use client"
import AddCompany from '@/components/Forms/AddCompany'
import { useParams } from 'next/navigation'
function EditCompany() {
  const params = useParams()
  return (
    <AddCompany edit={params.id} />
  )
}

export default EditCompany