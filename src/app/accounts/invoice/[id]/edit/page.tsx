"use client"
import EditInvoice from '@/components/Forms/AddInvoice'
import { useParams } from 'next/navigation'
function EditInvoicePage() {
  const params = useParams()
  return (
    <EditInvoice edit={params.id} />
  )
}

export default EditInvoicePage