import { CompanyRepository } from "@/repositories/company.repository";
import calculateStatus from "@/utils/calculateStatus";
import processDocuments from "@/helpers/processDocuments";
import { TCompanyData, TCompanyList, TDocuments } from "@/types/types";

export const CompanyService = {
  async createCompany(data: any) {
    return CompanyRepository.create(data);
  },

  async listCompanySummaries() {
    const companies: TCompanyData[] = await CompanyRepository.findPublishedWithDocs();
    const data: TCompanyList[] = [];

    companies.forEach((company) => {
      const { expiryDate, docsCount } = processDocuments(company.documents);
      const status = calculateStatus(expiryDate);
      data.push({
        id: (company as any)._id,
        name: company.name,
        expiryDate,
        docs: docsCount,
        status,
      });
    });

    data.sort((a, b) =>
      a.expiryDate === "---"
        ? 1
        : b.expiryDate === "---"
        ? -1
        : new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime()
    );

    return { count: companies.length, data };
  },

  async getCompanyDetails(id: string) {
    const company: TCompanyData | null = await CompanyRepository.findById(id);
    if (!company) return null;

    const modifiedDocuments = company.documents.map(({ _id, name, issueDate, expiryDate }: TDocuments) => ({
      _id,
      name,
      issueDate,
      expiryDate,
      status: calculateStatus(expiryDate!),
    }));

    modifiedDocuments.sort(
      (a, b) => new Date(a.expiryDate as string).getTime() - new Date(b.expiryDate as string).getTime()
    );

    return {
      id: (company as any)._id,
      name: company.name,
      licenseNo: company.licenseNo,
      companyType: company.companyType,
      emirates: company.emirates,
      phone1: company.phone1,
      phone2: company.phone2,
      email: company.email,
      transactionNo: company.transactionNo,
      isMainland: company.isMainland,
      remarks: company.remarks,
      password: company.password,
      documents: modifiedDocuments,
    };
  },

  async updateCompany(id: string, data: any) {
    return CompanyRepository.updateById(id, data);
  },

  async deleteCompany(id: string) {
    return CompanyRepository.softDelete(id);
  },

  async addCompanyDocument(id: string, document: any) {
    const company = await CompanyRepository.findById(id);
    if (!company) return null;
    (company as any).documents.push(document);
    await (company as any).save();
    return company;
  },

  async updateCompanyDocument(id: string, docId: string, fields: any) {
    const company = await CompanyRepository.findById(id);
    if (!company) return { company: null, documentIndex: null };

    const documentIndex = (company as any).documents.findIndex(
      (d: any) => d._id.toString() === docId
    );

    if (documentIndex === -1) return { company, documentIndex: null };

    const doc = (company as any).documents[documentIndex];
    const { name, issueDate, expiryDate, attachment } = fields;
    if (name !== undefined) doc.name = name;
    if (issueDate !== undefined) doc.issueDate = issueDate;
    if (expiryDate !== undefined) doc.expiryDate = expiryDate;
    if (attachment !== undefined) doc.attachment = attachment;

    await (company as any).save();
    return { company, documentIndex };
  },

  async deleteCompanyDocument(id: string, docId: string) {
    const company = await CompanyRepository.findById(id);
    if (!company) return { company: null, documentIndex: null };

    const documentIndex = (company as any).documents.findIndex(
      (d: any) => d._id.toString() === docId
    );

    if (documentIndex === -1) return { company, documentIndex: null };

    (company as any).documents.splice(documentIndex, 1);
    await (company as any).save();

    return { company, documentIndex };
  },
};