import { TEmployeeList } from "@/libs/types"
import Link from "next/link"
import ConfirmationModal from "../Modals/ConfirmationModal";
import { useState } from "react";
import axios from "axios";
function EmployeeList({ employees }: { employees: TEmployeeList }) {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

    const handleDelete = (id: string) => {
        setSelectedEmployeeId(id);
        setIsConfirmationOpen(true);
    }

    const confirmDelete = async () => {
        console.log("Deleting employee with ID:", selectedEmployeeId);
        const data = await axios.delete(`/api/employee/${selectedEmployeeId}`)
        console.log(data);
        window.location.reload();
        setIsConfirmationOpen(false);
    }

    const cancelDelete = () => {
        setSelectedEmployeeId(null);
        setIsConfirmationOpen(false);
    }

    return (
        <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <ConfirmationModal
                isOpen={isConfirmationOpen}
                message="Are you sure you want to delete this employee?"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
            <div className="max-w-full overflow-x-auto">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-gray-2 text-left dark:bg-meta-4">
                            <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                                Name
                            </th>
                            <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                                Expiry Date
                            </th>
                            <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                                Status
                            </th>
                            <th className="px-4 py-4 font-medium text-black dark:text-white">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>

                        {employees.map(({ id, name, expiryDate, docs, status, company }, key) => (
                            <tr key={key}>
                                <td className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11">
                                    <h5 className="font-medium capitalize text-black dark:text-white">
                                        {name}
                                    </h5>
                                    <Link href={`/company/${company?.id}`} className="hover:underline text-sm">{company?.name}</Link>
                                </td>
                                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                    <p className="text-black dark:text-white">
                                        {expiryDate}
                                    </p>
                                </td>
                                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                    <p
                                        className={`inline-flex capitalize rounded-full bg-opacity-10 px-3 py-1 text-sm font-medium ${status === "valid"
                                            ? "bg-success text-success"
                                            : status === "expired"
                                                ? "bg-danger text-danger"
                                                : status === "renewal" ? "bg-warning text-warning" : "bg-slate-500"
                                            }`}
                                    >
                                        {status}
                                    </p>
                                </td>
                                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                    <div className="flex items-center space-x-3.5">
                                        <Link href={`/employee/${id}`} className="hover:text-primary">
                                            <svg
                                                className="fill-current"
                                                width="18"
                                                height="18"
                                                viewBox="0 0 18 18"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M8.99981 14.8219C3.43106 14.8219 0.674805 9.50624 0.562305 9.28124C0.47793 9.11249 0.47793 8.88749 0.562305 8.71874C0.674805 8.49374 3.43106 3.20624 8.99981 3.20624C14.5686 3.20624 17.3248 8.49374 17.4373 8.71874C17.5217 8.88749 17.5217 9.11249 17.4373 9.28124C17.3248 9.50624 14.5686 14.8219 8.99981 14.8219ZM1.85605 8.99999C2.4748 10.0406 4.89356 13.5562 8.99981 13.5562C13.1061 13.5562 15.5248 10.0406 16.1436 8.99999C15.5248 7.95936 13.1061 4.44374 8.99981 4.44374C4.89356 4.44374 2.4748 7.95936 1.85605 8.99999Z"
                                                    fill=""
                                                />
                                                <path
                                                    d="M9 11.3906C7.67812 11.3906 6.60938 10.3219 6.60938 9C6.60938 7.67813 7.67812 6.60938 9 6.60938C10.3219 6.60938 11.3906 7.67813 11.3906 9C11.3906 10.3219 10.3219 11.3906 9 11.3906ZM9 7.875C8.38125 7.875 7.875 8.38125 7.875 9C7.875 9.61875 8.38125 10.125 9 10.125C9.61875 10.125 10.125 9.61875 10.125 9C10.125 8.38125 9.61875 7.875 9 7.875Z"
                                                    fill=""
                                                />
                                            </svg>
                                        </Link>
                                        <button onClick={() => handleDelete(id)} className="hover:bg-red rounded hover:bg-opacity-10 p-1">
                                            <svg className="hover:text-primary" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9.5 14.5L9.5 11.5" stroke="#FB5454" strokeLinecap="round" />
                                                <path d="M14.5 14.5L14.5 11.5" stroke="#FB5454" strokeLinecap="round" />
                                                <path d="M3 6.5H21V6.5C19.5955 6.5 18.8933 6.5 18.3889 6.83706C18.1705 6.98298 17.983 7.17048 17.8371 7.38886C17.5 7.89331 17.5 8.59554 17.5 10V15.5C17.5 17.3856 17.5 18.3284 16.9142 18.9142C16.3284 19.5 15.3856 19.5 13.5 19.5H10.5C8.61438 19.5 7.67157 19.5 7.08579 18.9142C6.5 18.3284 6.5 17.3856 6.5 15.5V10C6.5 8.59554 6.5 7.89331 6.16294 7.38886C6.01702 7.17048 5.82952 6.98298 5.61114 6.83706C5.10669 6.5 4.40446 6.5 3 6.5V6.5Z" stroke="#FB5454" strokeLinecap="round" />
                                                <path d="M9.5 3.50024C9.5 3.50024 10 2.5 12 2.5C14 2.5 14.5 3.5 14.5 3.5" stroke="#FB5454" strokeLinecap="round" />
                                            </svg>

                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default EmployeeList