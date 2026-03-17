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

export interface WorkOrder {
    Id: number;
    TenderId: number;
    LOIId: number | null;
    VendorId: number;
    WONumber: string;
    WODate: string;
    CompletionDueDate: string;
    WOValue: number;
    BGValuePercentage: number;
    Documents: Document[];
    Assets: WorkOrderAsset[];
    BankGuarantees: any[];
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

    async uploadRawMaterial(workOrderId: number, data: {
        AssetId: number;
        AssetTypeId: number;
        AssetSubTypeId: number | null;
        Files: any[];
    }): Promise<ApiResponse<any>> {
        const formData = new FormData();
        formData.append('AssetId', data.AssetId.toString());
        formData.append('AssetTypeId', data.AssetTypeId.toString());

        if (data.AssetSubTypeId !== null && data.AssetSubTypeId !== 0) {
            formData.append('AssetSubTypeId', data.AssetSubTypeId.toString());
        } else {
            // API expects empty value for null/Send empty value
            formData.append('AssetSubTypeId', '');
        }

        for (const file of data.Files) {
            const name = file.name || file.uri.split('/').pop() || 'file';
            const type = file.mimeType || file.type || 'application/octet-stream';

            if (Platform.OS === 'web') {
                try {
                    // On web, we must convert the URI to a Blob/File
                    const response = await fetch(file.uri);
                    const blob = await response.blob();
                    formData.append('Files', blob, name);
                } catch (err) {
                    console.error('Error converting file to blob on web:', err);
                    // Fallback to appending as is if fetch fails (unlikely for local URIs)
                    formData.append('Files', {
                        uri: file.uri,
                        name: name,
                        type: type,
                    } as any);
                }
            } else {
                // On native, use the expected object structure
                formData.append('Files', {
                    uri: file.uri,
                    name: name,
                    type: type,
                } as any);
            }
        }

        return apiClient.post<any>(`/workorders/${workOrderId}/material-verifications`, formData);
    }

    async uploadBankGuarantee(workOrderId: number, data: {
        BankName: string;
        BGNumber: string;
        IssueDate: string;
        ExpiryDate: string;
        Amount: number;
        Document: any;
    }): Promise<ApiResponse<any>> {
        const formData = new FormData();
        formData.append('BankName', data.BankName);
        formData.append('BGNumber', data.BGNumber);
        formData.append('IssueDate', data.IssueDate);
        formData.append('ExpiryDate', data.ExpiryDate);
        formData.append('Amount', data.Amount.toString());

        if (data.Document) {
            const name = data.Document.name || data.Document.uri.split('/').pop() || 'document.pdf';
            const type = data.Document.mimeType || data.Document.type || 'application/pdf';

            if (Platform.OS === 'web') {
                try {
                    const response = await fetch(data.Document.uri);
                    const blob = await response.blob();
                    formData.append('Document', blob, name);
                } catch (err) {
                    console.error('Error converting file to blob on web:', err);
                    formData.append('Document', {
                        uri: data.Document.uri,
                        name: name,
                        type: type,
                    } as any);
                }
            } else {
                formData.append('Document', {
                    uri: data.Document.uri,
                    name: name,
                    type: type,
                } as any);
            }
        } else {
            // API expects empty value if no document
            formData.append('Document', '');
        }

        return apiClient.post<any>(`/workorders/${workOrderId}/bankguarantees`, formData);
    }
}

export const tenderService = new TenderService();
