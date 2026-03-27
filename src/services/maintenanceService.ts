import { apiClient, ApiResponse } from './apiClient';

export interface IncidentTicket {
    Id: number;
    TicketNumber: string;
    ProjectAssetDetailsId: number;
    ProjectId: number;
    ProjectName: string;
    AssetId: number;
    AssetName: string;
    AssetTypeId: number | null;
    AssetTypeName: string | null;
    AssetSubTypeId: number | null;
    AssetSubTypeName: string | null;
    AssignedVendorId: number;
    AssignedVendorName: string;
    AssignedTechnicianId: number | null;
    AssignedTechnicianName: string | null;
    Subject: string;
    Description: string;
    ReasonCategory: string;
    IsComplainerBeneficiary?: boolean;
    ComplainerName?: string;
    ComplainerMobileNumber?: string | null;
    Status: 'Open' | 'InProgress' | 'Closed' | string;
    ClosedById: number | null;
    ClosedByName?: string | null;
    ClosedByMobileNumber?: string | null;
    ClosedByEmail?: string | null;
    ClosedOn: string | null;
    ClosureRemarks: string | null;
    CreatedOn: string;
}

export interface ScheduleTicket {
    Id: number;
    TicketNumber: string;
    Status: string;
    ScheduledMaintenanceDate: string;
    CycleMonths: number;
    MaintenanceScheduleId: number;
    MaintenanceId: number;
    WorkOrderInstalledAssetId: number;
    WorkOrderId: number;
    AssetId: number;
    AssetName: string;
    AssetTypeName: string;
    AssetSubTypeName: string | null;
    AssignedVendorId: number;
    VendorCompanyName: string;
    VendorPhoneNumber: string;
    VendorEmail: string;
    VendorUserName: string;
    BeneficiaryId: number;
    BeneficiaryName: string;
    BeneficiaryMobileNumber: string;
    InstallationLocation: string;
}

export interface MaintenanceTicketsResponse extends ApiResponse<any[]> {
    TotalRecords: number;
    CurrentPage: number;
    PageSize: number;
    TotalPages?: number;
}

export interface MaintenanceDetailResponse extends ApiResponse<{
    Ticket: {
        Id: number;
        MaintenanceScheduleId: number;
        MaintenanceId: number;
        TicketNumber: string;
        WorkOrderInstalledAssetDetailsId: number;
        AssignedVendorId: number;
        Status: string;
        RejectedById: number | null;
        RejectedOn: string | null;
        RejectionReason: string | null;
        ResolvedById: number | null;
        ResolvedByName: string | null;
        ResolvedByMobileNumber: string | null;
        ResolvedByEmail: string | null;
        ResolvedOn: string | null;
        ResolutionRemarks: string | null;
        CompletionPhotoUrls: string[] | null;
        CompletionDocumentUrls: string[] | null;
        ScheduledMaintenanceDate: string;
    };
    Schedule: {
        Id: number;
        MaintenanceId: number;
        WorkOrderInstalledAssetDetailsId: number;
        AssetTypeId: number | null;
        AssetSubTypeId: number | null;
        MaintenanceStartDate: string;
        MaintenanceEndDate: string;
        NextDueDate: string;
        DueDateWindowFromDays: number;
        DueDateWindowToDays: number;
        CurrentStatus: string;
    };
    Maintenance: {
        Id: number;
        AssetId: number;
        Title: string;
        Period: number;
        MaintenanceStartDate: string | null;
        MaintenanceEndDate: string | null;
        NextDueDate: string | null;
        DueDateWindowFromDays: number;
        DueDateWindowToDays: number;
        IsActive: boolean;
        Protocols: any[];
    };
    ApplicableProtocols: Array<{
        Id: number;
        SlNo: number;
        TaskName: string;
        Quarterly: boolean;
        HalfYearly: boolean;
        Annually: boolean;
        BiAnnually: boolean;
        ComponentCategoryId: number;
        ComponentCategoryName: string;
        IsActive: boolean;
    }>;
    TaskResults: any[];
}> {}

export const maintenanceService = {
    getIncidentTickets: async (page = 1, pageSize = 25): Promise<MaintenanceTicketsResponse> => {
        try {
            const response = await apiClient.get<IncidentTicket[]>(
                `/incident-tickets?page=${page}&pageSize=${pageSize}`
            );
            return response as unknown as MaintenanceTicketsResponse;
        } catch (error) {
            console.error('Error fetching incident tickets:', error);
            throw error;
        }
    },

    getScheduleTickets: async (page = 1, pageSize = 25): Promise<MaintenanceTicketsResponse> => {
        try {
            const response = await apiClient.get<ScheduleTicket[]>(
                `/maintenances/tickets?page=${page}&pageSize=${pageSize}`
            );
            return response as unknown as MaintenanceTicketsResponse;
        } catch (error) {
            console.error('Error fetching schedule tickets:', error);
            throw error;
        }
    },

    getTicketDetails: async (id: number): Promise<MaintenanceDetailResponse> => {
        try {
            const response = await apiClient.get<any>(`/maintenances/tickets/${id}/detail`);
            return response as unknown as MaintenanceDetailResponse;
        } catch (error) {
            console.error('Error fetching ticket details:', error);
            throw error;
        }
    },

    getIncidentTicketDetails: async (id: number): Promise<ApiResponse<IncidentTicket>> => {
        try {
            const response = await apiClient.get<IncidentTicket>(`/incident-tickets/${id}`);
            return response;
        } catch (error) {
            console.error('Error fetching incident ticket details:', error);
            throw error;
        }
    },

    resolveTicket: async (id: number, data: { remarks: string; photos?: string[]; documents?: string[] }): Promise<ApiResponse<any>> => {
        try {
            // Using placeholder endpoint pattern, will update if actual endpoint revealed
            const response = await apiClient.post<any>(`/maintenances/tickets/${id}/detail`, {
                ...data,
                Status: 'Resolved'
            });
            return response;
        } catch (error) {
            console.error('Error resolving ticket:', error);
            throw error;
        }
    },

    resolveIncidentTicket: async (id: number, remarks: string): Promise<ApiResponse<any>> => {
        try {
            const response = await apiClient.post<any>(`/incident-tickets/${id}`, {
                ClosureRemarks: remarks,
                Status: 'Closed'
            });
            return response;
        } catch (error) {
            console.error('Error resolving incident ticket:', error);
            throw error;
        }
    },

    rejectTicket: async (id: number, remarks: string): Promise<ApiResponse<any>> => {
        try {
            // Using placeholder endpoint pattern, will update if actual endpoint revealed
            const response = await apiClient.post<any>(`/maintenances/tickets/${id}/detail`, {
                remarks,
                Status: 'Rejected'
            });
            return response;
        } catch (error) {
            console.error('Error rejecting ticket:', error);
            throw error;
        }
    },
};

export default maintenanceService;
