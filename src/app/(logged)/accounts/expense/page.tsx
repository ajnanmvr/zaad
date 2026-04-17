import AddRecord from '@/components/Forms/AddRecord'
import React from 'react'
import { Suspense } from 'react'

function expensePage() {
  return (
    <Suspense fallback={null}>
      <AddRecord type="expense" suggestionCategory="office_records" hideBreadcrumb />
    </Suspense>
  )
}

export default expensePage
