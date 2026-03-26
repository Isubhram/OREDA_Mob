import { Platform } from 'react-native';
import { apiClient, ApiResponse } from './apiClient';

export interface Document {
    Id: number;
    FileName: string;
    FilePath: string;
    FileUrl: string;
}

export interface Vendor {
    Id: number;
    VendorId: number;
    VendorName: string | null;
    VendorEmail: string;
    UserName: string | null;
    PhoneNumber: string | null;
    CompanyName: string | null;
    Pan: string | null;
    GstNumber: string | null;
    ContactNumber1: string | null;
    ContactNumber2: string | null;
    CompanyMailId: string | null;
    AlternativeMailId: string | null;
    AuthorisedPerson: string | null;
    ServiceCenterDetails: string | null;
    DropdownDisplay: string;
}

export interface AssetSubType {
    Id: number;
    Name: string;
    Code: string;
    Description: string;
    AssetTypeId: number;
}

export interface AssetType {
    Id: number;
    Name: string;
    Code: string;
    Description: string;
    AssetSubType: AssetSubType[];
}

export interface Asset {
    Id: number;
    AssetId: number;
    AssetName: string;
    AssetCode: string;
    AssetType: AssetType[];
}

export interface WorkOrderAsset {
    Id: number;
    WorkOrderId: number;
    AssetId: number;
    AssetName: string;
    AssetCode: string;
    AssetType: AssetType[];
}

export interface MaterialVerificationDocument {
    Id: number;
    FileName: string;
    FilePath: string;
    FileUrl: string;
    DocumentType: string | null;
}

export interface WorkOrderInstalledAsset {
    Id: number;
    WorkOrderId: number;
    AssetId: number;
    AssetName: string;
    AssetTypeId: number | null;
    AssetTypeName: string | null;
    AssetSubTypeId: number | null;
    AssetSubTypeName: string | null;
    BeneficiaryId: number | null;
    BeneficiaryName: string | null;
    BeneficiaryEmail: string | null;
    BeneficiaryPhone: string | null;
    VendorId: number;
    VendorName: string;
    MaterialVerificationId: number | null;
    MaterialVerificationStatus: string | null;
    WorkOrderInstalledAssetDetailsId: number | null;
    WorkOrderInstalledAssetDraftId: number | null;
    InstallationStatus: string | null;
    VerificationStatus: string | null;
    InstallationLocation: string | null;
    InstallationLocations: string[];
    MaterialVerificationDocuments: MaterialVerificationDocument[];
}

export interface WorkOrder {
    Id: number;
    TenderId: number;
    TenderNumber?: string;
    ProjectId?: number;
    ProjectName?: string;
    LOIId: number | null;
    VendorId: number;
    VendorName?: string;
    WONumber: string;
    WODate: string;
    CompletionDueDate: string;
    WOValue: number;
    BGValuePercentage: number;
    Documents: Document[];
    Assets: WorkOrderAsset[];
    BankGuarantees: any[];
    WorkOrderInstalledAssets: WorkOrderInstalledAsset[];
}

export interface DraftToComplete {
    Id: number;
    ProjectId: number;
    WorkOrderId: number;
    AssetId: number;
    CurrentStep: number;
    CreatedOn: string;
    LastModifiedOn: string;
}

export interface Tender {
    Id: number;
    ProjectId: number;
    ProjectName: string;
    TenderNumber: string;
    TenderStartDate: string;
    TenderEndDate: string;
    TenderValidityDate: string;
    Documents: Document[];
    Vendors: Vendor[];
    Assets: Asset[];
    LOIs: any[];
    WorkOrders: WorkOrder[];
    DraftsToComplete: DraftToComplete[];
    IsActive: boolean;
    CreatedOn: string;
}

export interface TenderListResponse {
    Data: Tender[];
    DeveloperMessage: string;
    DisplayMessage: string;
    StatusCode: number;
    CurrentPage: number;
    PageSize: number;
    TotalPages: number;
    TotalRecords: number;
}



class TenderService {
    async getTenders(page: number = 1, pageSize: number = 25): Promise<TenderListResponse> {
        return apiClient.get<TenderListResponse>(`/tenders?page=${page}&pageSize=${pageSize}`) as unknown as Promise<TenderListResponse>;
    }

    async getTenderById(id: number): Promise<ApiResponse<Tender>> {
        return apiClient.get<Tender>(`/tenders/${id}`);
    }


}

export const tenderService = new TenderService();
