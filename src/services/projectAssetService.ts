import { apiClient, ApiResponse } from './apiClient';

export interface DropdownItem {
    Id: number;
    Name: string;
}

export interface ProjectAssetDraftResponse {
    Data: any;
    DeveloperMessage: string;
    DisplayMessage: string;
}

class ProjectAssetService {
    async getDistricts(stateId: number = 1): Promise<ApiResponse<DropdownItem[]>> {
        return apiClient.get<DropdownItem[]>(`/dropdowns/districts/${stateId}`);
    }

    async getBlocks(districtId: number): Promise<ApiResponse<DropdownItem[]>> {
        return apiClient.get<DropdownItem[]>(`/dropdowns/blocks/${districtId}`);
    }

    async getGramPanchayats(blockId: number): Promise<ApiResponse<DropdownItem[]>> {
        return apiClient.get<DropdownItem[]>(`/dropdowns/grampanchayat/${blockId}`);
    }

    async getVillages(gpId: number): Promise<ApiResponse<DropdownItem[]>> {
        return apiClient.get<DropdownItem[]>(`/dropdowns/village/${gpId}`);
    }

    async saveDraft(data: any): Promise<ApiResponse<ProjectAssetDraftResponse>> {
        return apiClient.post<ProjectAssetDraftResponse>('/project-assets/drafts', data);
    }

    async getDraftById(id: number): Promise<ApiResponse<any>> {
        return apiClient.get<any>(`/project-assets/drafts/${id}`);
    }

    async getFullProjectAsset(id: number): Promise<ApiResponse<any>> {
        return apiClient.get<any>(`/project-assets/full/${id}`);
    }

    async uploadMaterialVerification(formData: FormData): Promise<ApiResponse<any>> {
        return apiClient.post<any>('/project-assets/material-verification', formData);
    }
}

export const projectAssetService = new ProjectAssetService();
