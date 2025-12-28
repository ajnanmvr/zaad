import { useUserContext } from '@/contexts/UserContext';
import { swapAccountsAction } from '@/actions/payment';
import axios from 'axios';
import React, { useState } from 'react';

type TData = {
    from: string,
    to: string;
    amount: string,
}

const SelfDepositModal = ({ isOpen, cancel }: {
    isOpen: boolean;
    cancel: () => void;
}) => {
    const { user } = useUserContext();
    const initData = {
        from: "cash",
        to: "bank",
        amount: "",
    }
    const [data, setData] = useState<TData>({
        ...initData,
    });

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        switch (true) {
            case +data.amount < 1:
                alert("The amount should not be 0 or less");
                return;
            case data.from === data.to:
                alert("Please select different from and to methods");
                return;
            default:
                break;
        }
        try {
            await swapAccountsAction(data);
            cancel()
            setData(initData)
        } catch (error) {
            console.log(error);
        }
    };

    return isOpen ? (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white min-w-[50vw] dark:bg-black p-5 rounded-lg shadow-lg">
                <p className='text-center font-bold text-xl my-2 text-meta-5'>Self Deposit</p>
                <input
                    type="number"
                    name="amount"
                    value={data.amount}
                    onWheel={(e: any) => e.target.blur()}
                    onChange={(e) => { setData({ ...data, amount: e.target.value }) }}
                    placeholder="Enter Amount"
                    className="w-full rounded border-[1.5px] text-5xl mb-5 text-center border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />               
                
                 <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">

                    <div className="w-full xl:w-1/2">
                        <label className="mb-3 block text-sm font-medium text-black dark:text-white">From</label>
                        <div className="relative z-20 bg-transparent dark:bg-form-input">
                            <select
                                value={data.from}
                                name="from"
                                onChange={(e) => {
                                    setData({ ...data, from: e.target.value })
                                }}
                                className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"

                            >
                                <option value="bank" className="text-body dark:text-bodydark">
                                    Bank
                                </option>
                                <option value="cash" className="text-body dark:text-bodydark">
                                    Cash
                                </option>
                                <option value="tasdeed" className="text-body dark:text-bodydark">
                                    Tasdeed                      </option>
                                <option value="swiper" className="text-body dark:text-bodydark">
                                    Swiper                      </option>
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
                                        ></path>
                                    </g>
                                </svg>
                            </span>

                        </div>
                    </div>

                    <div className="w-full xl:w-1/2">
                        <label className="mb-3 block text-sm font-medium text-black dark:text-white">To</label>

                        <div className="relative z-20 bg-transparent dark:bg-form-input">
                            <select
                                value={data.to}
                                name="to"
                                onChange={(e) => {
                                    setData({ ...data, to: e.target.value })
                                }}
                                className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"

                            >
                                <option value="" disabled className="text-body dark:text-bodydark">
                                    To
                                </option>
                                <option value="bank" className="text-body dark:text-bodydark">
                                    Bank
                                </option>
                                <option value="cash" className="text-body dark:text-bodydark">
                                    Cash
                                </option>
                                <option value="tasdeed" className="text-body dark:text-bodydark">
                                    Tasdeed                      </option>
                                <option value="swiper" className="text-body dark:text-bodydark">
                                    Swiper                      </option>
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
                                        ></path>
                                    </g>
                                </svg>
                            </span>
                        </div></div>

                </div>

                <button onClick={cancel} className="mr-2 bg-red bg-opacity-5 my-3 border w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg">
                    Cancel
                </button>

                <button onClick={handleSubmit} className="px-4 py-2 w-full border-red bg-red hover:bg-opacity-90 border hover:bg-red-600 text-white rounded-lg">
                    Confirm
                </button>
            </div>
        </div>
    ) : null;
};

export default SelfDepositModal;
