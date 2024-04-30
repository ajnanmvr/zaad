"use client"
import EditEmployee from '@/components/Forms/AddEmployee'
import { useParams } from 'next/navigation'
function EditEmployeePage() {
  const params = useParams()
  return (
    <EditEmployee edit={params.id} />
  )
}

export default EditEmployeePage