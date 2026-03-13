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
    Status: 'Open' | 'InProgress' | 'Closed' | string;
    ClosedById: number | null;
    ClosedOn: string | null;
    ClosureRemarks: string | null;
    CreatedOn: string;
}

export interface IncidentTicketsResponse extends ApiResponse<IncidentTicket[]> {
    TotalRecords: number;
    CurrentPage: number;
    PageSize: number;
    TotalPages?: number;
}

export const incidentService = {
    getIncidentTickets: async (page = 1, pageSize = 25): Promise<IncidentTicketsResponse> => {
        try {
            // Updated to use the specific Tatwa URL provided by the user
            const response = await apiClient.get<IncidentTicket[]>(
                `/incident-tickets?page=${page}&pageSize=${pageSize}`
            );
            return response as unknown as IncidentTicketsResponse;
        } catch (error) {
            console.error('Error fetching incident tickets:', error);
            throw error;
        }
    },
};

export default incidentService;
