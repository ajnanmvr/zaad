"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TBaseData } from "@/types/types";
import { debounce } from "lodash";
import Link from "next/link";
import { useUserContext } from "@/contexts/UserContext";

const AddInvoice = ({ edit }: { edit?: string | string[] }) => {
    const router = useRouter()
    const { user } = useUserContext();

    const [searchSuggestions, setSearchSuggestions] = useState<TBaseData[]>([]);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedOption, setSelectedOption] = useState<string>("");
    const [isEditMode, setisEditMode] = useState(false);
    const [invoiceData, setInvoiceData] = useState<any>({
        createdBy: user?._id,
        date: new Date().toISOString().split('T')[0],
    });

    const fetchData = async () => {

        try {
            if (edit) {
                const { data } = await axios.get(`/api/invoice/${edit}`);
                setInvoiceData(data);
                setisEditMode(true)
            } else {
                const { data } = await axios.get(`/api/invoice/number`);
                setInvoiceData({ ...invoiceData, invoiceNo: data.invoiceNo, suffix: data?.suffix })
            }
        } catch (error) {
            console.log(error);
        }
    }
    useEffect(() => {
        fetchData()
    }, [])
    const handleSubmit = async (e: any) => {
        e.preventDefault()
        try {
            if (isEditMode) {
                await axios.put(`/api/invoice/${edit}`, invoiceData);
                router.push(`/accounts/invoice/${edit}`);
            }
            else {
                await axios.post("/api/invoice", invoiceData);
                router.push(`/accounts/invoice`);
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
        setInvoiceData({ ...invoiceData, employee: undefined, other: undefined, company: selected._id });
        setSearchSuggestions([])
    };

    const handleEmployeeSelection = (selected: TBaseData) => {
        setSearchValue(selected.name)
        setInvoiceData({ ...invoiceData, company: undefined, other: undefined, employee: selected._id });
        setSearchSuggestions([])
    };


    const handleDeleteDocument = (index: number) => {
        const updatedItems = invoiceData.items.filter((item: any, itemIndex: number) => itemIndex !== index);
        setInvoiceData({ ...invoiceData, items: updatedItems });
    };

    let items = {
        name: "",
        issueDate: "",
        expiryDate: "",
        attachment: ""
    }

    const handleAddDocument = (e: any) => {
        e.preventDefault()
        if (!invoiceData.items) {
            setInvoiceData({ ...invoiceData, items: [items] })
        }
        else {
            const updateditems = [...invoiceData.items, items];
            setInvoiceData({ ...invoiceData, items: updateditems });
        }
    };
    const handleDocumentChange = (index: number, field: string, value: string | Date) => {
        const updateditems = [...invoiceData.items];
        updateditems[index][field] = value;
        setInvoiceData({ ...invoiceData, items: updateditems });
    };
    const handleChange = (e: any) => {
        setInvoiceData({
            ...invoiceData,
            [e.target.name]: e.target.value
        })
    }
    const breadCrumb = isEditMode ? "Edit Invoice" : "Add Invoice"
    const confirmBtn = isEditMode ? "Save Edits" : "Save Invoice"


    return (
        <DefaultLayout>
            <Breadcrumb pageName={`${breadCrumb}`} />
            <form className="grid grid-cols-1 gap-9 sm:grid-cols-2 relative" action="#">
                <div className="flex flex-col gap-9">
                    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                            <h3 className="font-medium text-black dark:text-white">
                                Invoice Details
                            </h3>
                        </div>
                        <div className="p-6.5">
                            <div className="mb-4.5">
                                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                    Title <span className="text-meta-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={invoiceData?.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter invoice title"
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                            </div>


                            {
                                !edit && (
                                    <>
                                        <div className="mb-4.5 flex flex-col">
                                            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                                Client Type
                                                <span className="text-meta-1">*</span>
                                            </label>

                                            <div className="relative z-20 bg-transparent dark:bg-form-input">
                                                <select
                                                    value={selectedOption}
                                                    name="client-type"
                                                    onChange={(e) => {
                                                        setSelectedOption(e.target.value);
                                                        setSearchValue("");
                                                    }}
                                                    className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"

                                                >
                                                    <option value="" disabled className="text-body dark:text-bodydark">
                                                        Select any one
                                                    </option>
                                                    <option value="company" className="text-body dark:text-bodydark">
                                                        Company
                                                    </option>
                                                    <option value="employee" className="text-body dark:text-bodydark">
                                                        Individual
                                                    </option>
                                                    <option value="other" className="text-body dark:text-bodydark">
                                                        Other
                                                    </option>
                                                </select>

                                                <span className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
                                                    <svg
                                                        className="fill-current"
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <g opacity="0.8">
                                                            <path
                                                                fillRule="evenodd"
                                                                clipRule="evenodd"
                                                                d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                                                                fill=""
                                                            ></path>
                                                        </g>
                                                    </svg>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mb-4.5">
                                            {selectedOption === "employee" && (
                                                <>
                                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                                        Individual Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="employee"
                                                        onChange={handleInputChange}
                                                        value={searchValue}
                                                        autoComplete="off"
                                                        placeholder="Enter individual name"
                                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                                    />
                                                    <ul className="flex flex-wrap gap-1 mt-2">
                                                        {searchSuggestions.map((employee, key) => (
                                                            <li
                                                                className="rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary cursor-pointer dark:hover:bg-primary hover:border-primary"
                                                                key={key} onClick={() => handleEmployeeSelection(employee)}>
                                                                {employee.name}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </>
                                            )}

                                            {selectedOption === "company" && (
                                                <>
                                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                                        Company Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="company"
                                                        value={searchValue}
                                                        autoComplete="off"
                                                        onChange={handleInputChange}
                                                        placeholder="Enter company name"
                                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                                    />
                                                    <ul className="flex flex-wrap gap-1 mt-2">
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


                                            {selectedOption === "other" && (
                                                <>
                                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                                        Client Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="other"
                                                        value={invoiceData?.other}
                                                        onChange={(e) => {
                                                            setInvoiceData({ ...invoiceData, company: undefined, employee: undefined, other: e.target.value });
                                                        }}
                                                        placeholder="Enter cient name"
                                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                                    />
                                                </>
                                            )}
                                        </div></>
                                )
                            }
                            <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                                <div className="w-full xl:w-1/2">
                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                        Invoice Number Suffix
                                    </label>
                                    <input
                                        type="text"
                                        name="suffix"
                                        value={invoiceData?.suffix}
                                        onChange={handleChange}
                                        placeholder="Enter a suffix"
                                        className="w-full uppercase rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                    />
                                </div>

                                <div className="w-full xl:w-1/2">
                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                        Invoice Number</label>
                                    <input
                                        type="number"
                                        name="invoiceNo"
                                        onWheel={(e: any) => e.target.blur()}
                                        value={invoiceData?.invoiceNo}
                                        onChange={handleChange}
                                        placeholder="Invoice number"
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                    />
                                </div>
                                <div className="w-full xl:w-1/2">
                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                        Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={invoiceData?.date}
                                        onChange={handleChange}
                                        placeholder="Enter invoice number"
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                    />
                                </div>
                            </div>


                            <div className="mb-6">
                                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                    Remarks
                                </label>
                                <textarea
                                    rows={6}
                                    name="remarks"
                                    placeholder="Remarks Here"
                                    value={invoiceData?.notes}
                                    onChange={handleChange}
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                ></textarea>
                            </div>
                            <button onClick={handleSubmit} className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90">
                                {confirmBtn}
                            </button>
                            <Link href={"/accounts/invoice"} className="mt-2 flex w-full justify-center rounded p-3 font-medium text-gray hover:bg-opacity-90">
                                Cancel
                            </Link>
                        </div>
                    </div>


                </div>

                <div className="flex flex-col gap-9">

                    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                            <h3 className="font-medium text-black dark:text-white">
                                Items
                            </h3>
                        </div>
                        <div className="px-6.5 pb-6.5">
                            {invoiceData?.items?.map((doc: any, index: number) => (
                                <div key={index} className="border-b border-stroke py-6.5 dark:border-strokedark">
                                    <div className="mb-4.5">
                                        <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                            Title <span className="text-meta-1">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            required
                                            value={invoiceData.items[index]?.title}
                                            onChange={(e) => handleDocumentChange(index, 'title', e.target.value)}
                                            placeholder="Enter title of the item"
                                            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                            Description
                                        </label>
                                        <textarea
                                            rows={6}
                                            name="desc"
                                            placeholder="Description Here"
                                            value={invoiceData.items[index]?.desc}
                                            onChange={(e) => handleDocumentChange(index, 'desc', e.target.value)}
                                            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                        ></textarea>
                                    </div>
                                    <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">

                                        <div className="w-full xl:w-1/2">
                                            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                                Rate
                                            </label>
                                            <input
                                                type="number"
                                                onWheel={(e: any) => e.target.blur()}
                                                name="rate"
                                                value={invoiceData.items[index]?.rate}
                                                onChange={(e) => handleDocumentChange(index, 'rate', e.target.value)}
                                                placeholder="Enter Rate"
                                                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                            />
                                        </div>
                                        <div className="w-full xl:w-1/2">
                                            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                                Quantity
                                                <span className="text-meta-1">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="quantity"
                                                onWheel={(e: any) => e.target.blur()}
                                                value={invoiceData.items[index]?.quantity}
                                                onChange={(e) => handleDocumentChange(index, 'quantity', e.target.value)}
                                                placeholder="Enter Quantity"
                                                required
                                                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                            />
                                        </div>

                                    </div>
                                    <button className="flex w-full justify-center rounded items-center  text-red  border border-red hover:bg-red p-3 font-medium  hover:bg-opacity-10 transition-colors duration-300"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleDeleteDocument(index)
                                        }}>
                                        <svg className="hover:text-primary" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9.5 14.5L9.5 11.5" stroke="#FB5454" strokeLinecap="round" />
                                            <path d="M14.5 14.5L14.5 11.5" stroke="#FB5454" strokeLinecap="round" />
                                            <path d="M3 6.5H21V6.5C19.5955 6.5 18.8933 6.5 18.3889 6.83706C18.1705 6.98298 17.983 7.17048 17.8371 7.38886C17.5 7.89331 17.5 8.59554 17.5 10V15.5C17.5 17.3856 17.5 18.3284 16.9142 18.9142C16.3284 19.5 15.3856 19.5 13.5 19.5H10.5C8.61438 19.5 7.67157 19.5 7.08579 18.9142C6.5 18.3284 6.5 17.3856 6.5 15.5V10C6.5 8.59554 6.5 7.89331 6.16294 7.38886C6.01702 7.17048 5.82952 6.98298 5.61114 6.83706C5.10669 6.5 4.40446 6.5 3 6.5V6.5Z" stroke="#FB5454" strokeLinecap="round" />
                                            <path d="M9.5 3.50024C9.5 3.50024 10 2.5 12 2.5C14 2.5 14.5 3.5 14.5 3.5" stroke="#FB5454" strokeLinecap="round" />
                                        </svg>
                                        Delete</button>
                                </div>

                            ))}

                            <button onClick={handleAddDocument} className="flex w-full justify-center rounded border border-green-700 text-meta-3 hover:bg-green-700 p-3 font-medium hover:bg-opacity-10 transition-colors duration-300">
                                Add Item                </button>
                        </div>
                    </div>
                </div>
            </form>
        </DefaultLayout>
    );
};

export default AddInvoice;
