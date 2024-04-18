
"use client"
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TCompanyData } from "@/libs/types";
import { useParams } from "next/navigation";

const SingleCompany = () => {
  const [company, setCompany] = useState<TCompanyData>({ name: "" })
  const { id } = useParams()
  const fetchData = async () => {
    try {
      const data = await axios.get(`/api/company/${id}`)
      console.log(data.data.data)
      setCompany(data.data.data)
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    fetchData()
  }, [])

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-242.5">
        <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="px-4 pb-6 text-center lg:pb-8 xl:pb-11.5">
            <div className="mt-10">
              <h3 className="mb-1.5 text-3xl font-semibold text-black dark:text-white">
                {company.name}
              </h3>
              <p className="font-medium">{company?.companyType}</p>
              <div className="mx-auto mb-5.5 mt-4.5 grid max-w-94 grid-cols-3 rounded-md border border-stroke py-2.5 shadow-1 dark:border-strokedark dark:bg-[#37404F]">
                <div className="flex flex-col items-center justify-center gap-1 border-r border-stroke px-4 dark:border-strokedark xsm:flex-row">
                  <span className="font-semibold text-black dark:text-white">
                  {company?.documents?.length}
                  </span>
                  <span className="text-sm">Documents</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 border-r border-stroke px-4 dark:border-strokedark xsm:flex-row">
                  <span className="font-semibold text-black dark:text-white">
                  {company?.documents?.length}
                  </span>
                  <span className="text-sm">Followers</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 px-4 xsm:flex-row">
                  <span className="font-semibold text-black dark:text-white">
                  {company?.password?.length}
                  </span>
                  <span className="text-sm">Usernames</span>
                </div>
              </div>

              {/* <div className="mx-auto max-w-180">
                <h4 className="font-semibold text-black dark:text-white">
                  About Me
                </h4>
                <p className="mt-4.5">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Pellentesque posuere fermentum urna, eu condimentum mauris
                  tempus ut. Donec fermentum blandit aliquet. Etiam dictum
                  dapibus ultricies. Sed vel aliquet libero. Nunc a augue
                  fermentum, pharetra ligula sed, aliquam lacus.
                </p>
              </div> */}


            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default SingleCompany;
