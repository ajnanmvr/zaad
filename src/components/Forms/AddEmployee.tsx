"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TBaseData } from "@/types/types";
import { debounce } from "lodash";
import Link from "next/link";

const AddEmployee = ({ company, edit }: { company?: string | string[], edit?: string | string[] }) => {
    const router = useRouter()
    const [searchSuggestions, setSearchSuggestions] = useState<TBaseData[]>([]);
    const [searchValue, setSearchValue] = useState<string>("");
    const [isEditMode, setisEditMode] = useState(false);
    const [employeeData, setEmployeeData] = useState<any>({
        name: "", company: "", documents: []
    });
    useEffect(() => {
        if (company) {
            setEmployeeData({ ...employeeData, company })
        }
    }, [])

    const fetchData = async () => {
        if (edit !== "") {
            try {
                const { data } = await axios.get(`/api/employee/${edit}`, employeeData);
                setEmployeeData(data.data);
                setisEditMode(true)

            } catch (error) {
                console.log(error);
            }
        } else {
            setisEditMode(false)
        }
    }
    useEffect(() => {
        fetchData()
    }, [])
    const handleSubmit = async (e: any) => {
        e.preventDefault()
        try {
            if (isEditMode) {
                await axios.put(`/api/employee/${edit}`, employeeData);
                router.push(`/employee/${edit}`);
            }
            else {
                await axios.post("/api/employee", employeeData);
                router.push(`/employee/view/${employeeData.company}`);
            }
        } catch (error) {
            console.log(error);
        }
    };
    const fetchsearchSuggestions = async (inputValue: string, inputName: string) => {
        try {
            const response = await axios.get<TBaseData[]>(`/api/${inputName}/search/${inputValue}`);
            setSearchSuggestions(response.data);
        } catch (error) {
            console.error("Error fetching company suggestions:", error);
        }
    };

    const debounceSearch = debounce((input: string, name: string) => {
        fetchsearchSuggestions(input, name);
    }, 300);

    const handleInputChange = (e: any) => {
        setSearchValue(e.target.value)
        const inputName = e.target.name;
        debounceSearch(searchValue, inputName);
    };


    const handleCompanySelection = (selected: TBaseData) => {
        setSearchValue(selected.name)
        setEmployeeData({ ...employeeData, company: selected._id });
        setSearchSuggestions([])
    };
    const handleDeleteDocument = (index: number) => {
        const updatedItems = employeeData.documents.filter((doc: any, docIndex: number) => docIndex !== index);
        setEmployeeData({ ...employeeData, documents: updatedItems });
    };
    let documents = {
        name: "",
        issueDate: "",
        expiryDate: "",
        attachment: ""
    }

    const handleAddDocument = (e: any) => {
        e.preventDefault()
        if (!employeeData.documents) {
            setEmployeeData({ ...employeeData, documents: [documents] })
        }
        else {
            const updatedDocuments = [...employeeData.documents, documents];
            setEmployeeData({ ...employeeData, documents: updatedDocuments });
        }
    };
    const handleDocumentChange = (index: number, field: string, value: string | Date) => {
        const updatedDocuments = [...employeeData.documents];
        updatedDocuments[index][field] = value;
        setEmployeeData({ ...employeeData, documents: updatedDocuments });
    };
    const handleChange = (e: any) => {
        setEmployeeData({
            ...employeeData,
            [e.target.name]: e.target.value
        })
    }
    const breadCrumb = isEditMode ? "Edit Employee" : "Add Employee"
    const confirmBtn = isEditMode ? "Save Edits" : "Save Employee"
    console.log(employeeData);

    return (
        <DefaultLayout>
            <Breadcrumb pageName={`${breadCrumb}`} />
            <form className="grid grid-cols-1 gap-9 sm:grid-cols-2 relative" action="#">
                <div className="flex flex-col gap-9">
                    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                            <h3 className="font-medium text-black dark:text-white">
                                Individual Details
                            </h3>
                        </div>
                        <div className="p-6.5">
                            <div className="mb-4.5">
                                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                    Name <span className="text-meta-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={employeeData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter employee name"
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                            </div>
                            {!company && (
                                <>
                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                        Company Name
                                    </label>
                                    <input
                                        type="text"
                                        name="company"
                                        autoComplete="off"

                                        value={searchValue}
                                        onChange={handleInputChange}
                                        placeholder="Enter company name"
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                    />
                                    <ul className="flex flex-wrap gap-1 my-2">
                                        {searchSuggestions.map((company, key) => (
                                            <li

                                                className="rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary cursor-pointer dark:hover:bg-primary hover:border-primary"

                                                key={key} onClick={() => handleCompanySelection(company)}>
                                                {company.name}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                            <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                                <div className="w-full xl:w-1/2">
                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                        Emirates ID
                                    </label>
                                    <input
                                        type="text"
                                        name="emiratesId"
                                        value={employeeData?.emiratesId}
                                        onChange={handleChange}
                                        placeholder="Enter emirates id number"
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                    />
                                </div>

                                <div className="w-full xl:w-1/2">
                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                        Nationality</label>
                                    <input
                                        type="text"
                                        name="nationality"
                                        value={employeeData?.nationality}
                                        onChange={handleChange}
                                        placeholder="Enter nationality"
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="mb-4.5">
                                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={employeeData?.email}
                                    onChange={handleChange}
                                    placeholder="Enter email"
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                            </div>
                            <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">

                                <div className="w-full xl:w-1/2">
                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        name="phone1"
                                        value={employeeData?.phone1}
                                        onChange={handleChange}
                                        placeholder="Enter phone number"
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                    />
                                </div>
                                <div className="w-full xl:w-1/2">
                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                        Phone Number 2
                                    </label>
                                    <input
                                        type="text"
                                        name="phone2"
                                        value={employeeData?.phone2}
                                        onChange={handleChange}
                                        placeholder="Other phone number"
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                    />
                                </div>

                            </div>
                            <div className="mb-4.5">
                                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                    Designation
                                </label>
                                <input
                                    type="text"
                                    name="designation"
                                    value={employeeData?.designation}
                                    onChange={handleChange}
                                    placeholder="Enter designation"
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                    Remarks
                                </label>
                                <textarea
                                    rows={6}
                                    name="remarks"
                                    placeholder="Remarks Here"
                                    value={employeeData?.remarks}
                                    onChange={handleChange}
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                ></textarea>
                            </div>
                            <button onClick={handleSubmit} className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90">
                                {confirmBtn}
                            </button>
                            <Link href={"/employee"} className="mt-2 flex w-full justify-center rounded p-3 font-medium text-gray hover:bg-opacity-90">
                                Cancel
                            </Link>
                        </div>
                    </div>


                </div>

                <div className="flex flex-col gap-9">

                    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                            <h3 className="font-medium text-black dark:text-white">
                                Documents
                            </h3>
                        </div>
                        <div className="px-6.5 pb-6.5">
                            {employeeData?.documents?.map((doc: any, index: number) => (
                                <div key={index} className="border-b border-stroke py-6.5 dark:border-strokedark">
                                    <div className="mb-4.5">
                                        <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                            Document Name <span className="text-meta-1">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={employeeData.documents[index]?.name}
                                            onChange={(e) => handleDocumentChange(index, 'name', e.target.value)}
                                            placeholder="Enter document name"
                                            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                        />
                                    </div>
                                    <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">

                                        <div className="w-full xl:w-1/2">
                                            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                                Issue Date
                                            </label>
                                            <input
                                                type="date"
                                                name="issueDate"
                                                value={employeeData.documents[index]?.issueDate}
                                                onChange={(e) => handleDocumentChange(index, 'issueDate', e.target.value)}
                                                placeholder="Enter phone number"
                                                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                            />
                                        </div>
                                        <div className="w-full xl:w-1/2">
                                            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                                Expiry Date <span className="text-meta-1">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="expiryDate"
                                                value={employeeData.documents[index]?.expiryDate}
                                                onChange={(e) => handleDocumentChange(index, 'expiryDate', e.target.value)}
                                                required
                                                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                            />
                                        </div>

                                    </div>
                                    <button
                                        className="flex w-full justify-center rounded items-center text-red border border-red hover:bg-red p-3 font-medium hover:bg-opacity-10 transition-colors duration-300"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDeleteDocument(index);
                                        }}
                                    >
                                        <svg className="hover:text-primary" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9.5 14.5L9.5 11.5" stroke="#FB5454" strokeLinecap="round" />
                                            <path d="M14.5 14.5L14.5 11.5" stroke="#FB5454" strokeLinecap="round" />
                                            <path d="M3 6.5H21V6.5C19.5955 6.5 18.8933 6.5 18.3889 6.83706C18.1705 6.98298 17.983 7.17048 17.8371 7.38886C17.5 7.89331 17.5 8.59554 17.5 10V15.5C17.5 17.3856 17.5 18.3284 16.9142 18.9142C16.3284 19.5 15.3856 19.5 13.5 19.5H10.5C8.61438 19.5 7.67157 19.5 7.08579 18.9142C6.5 18.3284 6.5 17.3856 6.5 15.5V10C6.5 8.59554 6.5 7.89331 6.16294 7.38886C6.01702 7.17048 5.82952 6.98298 5.61114 6.83706C5.10669 6.5 4.40446 6.5 3 6.5V6.5Z" stroke="#FB5454" strokeLinecap="round" />
                                            <path d="M9.5 3.50024C9.5 3.50024 10 2.5 12 2.5C14 2.5 14.5 3.5 14.5 3.5" stroke="#FB5454" strokeLinecap="round" />
                                        </svg>
                                        Delete</button>
                                    {/* <div className="mb-4.5">
                                        <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                            Attach file
                                        </label>
                                        <input
                                            type="file"
                                            name="attachment"
                                            value={employeeData.documents[index]?.attachment}
                                            onChange={(e) => handleDocumentChange(index, 'attachment', e.target.value)}
                                            className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:px-5 file:py-3 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary"
                                        />
                                    </div> */}
                                </div>
                            ))}

                            <button onClick={handleAddDocument} className="flex w-full justify-center rounded border border-green-700 text-meta-3 hover:bg-green-700 p-3 font-medium hover:bg-opacity-10 transition-colors duration-300">
                                Add Document                </button>
                        </div>
                    </div>
                </div>
            </form>
        </DefaultLayout>
    );
};

export default AddEmployee;
