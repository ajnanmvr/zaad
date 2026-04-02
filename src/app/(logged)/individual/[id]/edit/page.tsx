"use client"
import AddEmployee from '@/components/Forms/AddEmployee'
import { useParams } from 'next/navigation'

function EditIndividualPage() {
  const params = useParams()
  return (
    <AddEmployee edit={params.id} individualMode />
  )
}

export default EditIndividualPage
