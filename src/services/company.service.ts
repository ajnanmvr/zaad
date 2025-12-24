import { CompanyRepository } from "@/repositories/company.repository";
import { TCompanyData, TCompanyList } from "@/types/types";
import {
  EntityWithDocumentsService,
  processSummaryList,
} from "./entity-with-documents.service";
import connect from "@/db/mongo";

class CompanyServiceClass extends EntityWithDocumentsService {
  constructor() {
    super(CompanyRepository);
  }

  async createCompany(data: any) {
    return this.create(data);
  }

  async listCompanySummaries() {
    await connect();
    const companies = await CompanyRepository.findPublishedWithDocs() as any as TCompanyData[];
    return processSummaryList(companies);
  }

  async getCompanyDetails(id: string) {
    await connect();
    const company = await CompanyRepository.findById(id) as any as TCompanyData | null;
    if (!company) return null;

    return this.formatEntityDetails(company, {
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
    });
  }

  async updateCompany(id: string, data: any) {
    return this.updateEntity(id, data);
  }

  async deleteCompany(id: string) {
    return this.deleteEntity(id);
  }

  async addCompanyDocument(id: string, document: any) {
    return this.addDocument(id, document);
  }

  async updateCompanyDocument(id: string, docId: string, fields: any) {
    const result = await super.updateDocument(id, docId, fields);
    return { company: result.entity, documentIndex: result.documentIndex };
  }

  async deleteCompanyDocument(id: string, docId: string) {
    const result = await super.deleteDocument(id, docId);
    return { company: result.entity, documentIndex: result.documentIndex };
  }
}

export const CompanyService = new CompanyServiceClass();