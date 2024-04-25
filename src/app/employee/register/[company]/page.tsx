"use client"
import AddEmployee from "@/components/Forms/AddEmployee"
import { useParams } from "next/navigation"

export default function AddEmployeeInside() {
    const { company } = useParams()

  return (
    <AddEmployee company={company}/>
  )
}

