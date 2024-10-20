"use client"
import EditRecord from "@/components/Forms/AddRecord"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import axios from "axios"

function EditTransaction() {
    const { id }: { id: string } = useParams()
    const [isLoading, setIsLoading] = useState(true)
    const [singleData, setSingleData] = useState()
    const { type } = useParams()

    return (
        <div> {isLoading ? <div className="flex justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div> :
            <EditRecord type={type.toString()} edit={true} />}
        </div>
    )
}

export default EditTransaction