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

const AddInvoice = ({ company, edit }: { company?: string | string[], edit?: string | string[] }) => {
    const router = useRouter()
    const { user } = useUserContext();

    const [searchSuggestions, setSearchSuggestions] = useState<TBaseData[]>([]);
    const [searchValue, setSearchValue] = useState<string>("");
    const [isEditMode, setisEditMode] = useState(false);
    const [invoiceData, setInvoiceData] = useState<any>({
        createdBy: user?._id,

        title: "", company: "", items: [{
            title: "",
            desc: "",
            rate: "",
            quantity: ""
        }]
    });
    useEffect(() => {
        if (company) {
            setInvoiceData({ ...invoiceData, company })
        }
    }, [])

    const fetchData = async () => {
        if (edit !== "") {
            try {
                const { data } = await axios.get(`/api/employee/${edit}`, invoiceData);
                setInvoiceData(data.data);
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
                await axios.put(`/api/employee/${edit}`, invoiceData);
                router.push(`/employee/${edit}`);
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
        setInvoiceData({ ...invoiceData, company: selected._id });
        setSearchSuggestions([])
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

    console.log(invoiceData);

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
                                    value={invoiceData.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter invoice title"
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
                                        Invoice Number Suffix
                                    </label>
                                    <input
                                        type="text"
                                        name="suffix"
                                        value={invoiceData?.suffix}
                                        onChange={handleChange}
                                        placeholder="Enter a suffix"
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                    />
                                </div>

                                <div className="w-full xl:w-1/2">
                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                        Invoice Number</label>
                                    <input
                                        type="text"
                                        name="invoiceNo"
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
                                                type="text"
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
                                                type="text"
                                                name="quantity"
                                                value={invoiceData.items[index]?.quantity}
                                                onChange={(e) => handleDocumentChange(index, 'quantity', e.target.value)}
                                                placeholder="Enter Quantity"
                                                required
                                                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                            />
                                        </div>

                                    </div>
                                </div>
                            ))}

                            <button onClick={handleAddDocument} className="flex w-full justify-center rounded bg-green-700 p-3 font-medium text-gray hover:bg-opacity-90">
                                Add Item                </button>
                        </div>
                    </div>
                </div>
            </form>
        </DefaultLayout>
    );
};

export default AddInvoice;
