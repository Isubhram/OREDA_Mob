import { Platform } from 'react-native';
import { apiClient, ApiResponse } from './apiClient';
import { WorkOrder } from './tenderService';

export interface WorkOrderListResponse {
    Data: WorkOrder[];
    DeveloperMessage: string;
    DisplayMessage: string;
    StatusCode: number;
    CurrentPage: number;
    PageSize: number;
    TotalPages: number;
    TotalRecords: number;
}

class WorkOrderService {
    async getWorkOrders(page: number = 1, pageSize: number = 25, districtId?: number): Promise<WorkOrderListResponse> {
        let url = `/workorders?pageNumber=${page}&pageSize=${pageSize}`;
        if (districtId) {
            url += `&DistrictId=${districtId}`;
        }
        return apiClient.get<WorkOrderListResponse>(url) as unknown as Promise<WorkOrderListResponse>;
    }

    async getWorkOrderById(id: number): Promise<ApiResponse<WorkOrder>> {
        return apiClient.get<WorkOrder>(`/workorders/${id}`);
    }

    async uploadRawMaterial(workOrderId: number, data: {
        AssetId: number;
        AssetTypeId: number;
        AssetSubTypeId: number | null;
        WorkOrderInstalledAssetId?: number | null;
        Files: any[];
    }): Promise<ApiResponse<any>> {
        const formData = new FormData();
        formData.append('AssetId', data.AssetId.toString());
        formData.append('AssetTypeId', data.AssetTypeId.toString());

        if (data.WorkOrderInstalledAssetId) {
            formData.append('WorkOrderInstalledAssetId', data.WorkOrderInstalledAssetId.toString());
        }

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

    async addWorkOrderInstallation(workOrderId: number, assetId: number): Promise<ApiResponse<number>> {
        return apiClient.post<number>('/workorders/installed-assets', {
            WorkOrderId: workOrderId,
            AssetId: assetId
        });
    }
}

export const workOrderService = new WorkOrderService();
