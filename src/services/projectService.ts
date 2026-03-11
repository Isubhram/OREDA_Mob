import { apiClient, ApiResponse } from './apiClient';

// Project interfaces
export interface SanctionOrder {
    Id: number;
    SanctionOrderNumber: string;
    SanctionAmount: number;
    Description: string;
    DocumentPath: string;
    DocumentUrl: string;
    FileName: string;
}

export interface Tender {
    [key: string]: any;
}

export interface Project {
    Id: number;
    Name: string;
    TypeOfFunding: number;
    TypeOfFundingText: string;
    StartYear: string;
    FinancialYearId: number;
    FinancialYearName: string;
    AuthorisedDepartmentId: number;
    AuthorisedDepartmentName: string;
    TotalBudget: number;
    SanctionOrders: SanctionOrder[];
    Tenders: Tender[];
    DraftsToComplete: any[];
    IsActive: boolean;
    CreatedOn: string;
}

export interface ProjectsResponse extends ApiResponse<Project[]> {
    DeveloperMessage?: string;
    CurrentPage: number;
    PageSize: number;
    TotalPages: number;
    TotalRecords: number;
}

// Fetch projects
export const fetchProjects = async (
  page: number = 1,
  pageSize: number = 25
): Promise<ProjectsResponse> => {
  try {
    const response = await apiClient.get<Project[]>(
      `/projects?page=${page}&pageSize=${pageSize}`
    );

    return response as ProjectsResponse;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

// Delete project
export const deleteProject = async (
    projectId: number
): Promise<ApiResponse<any>> => {
    try {
        return await apiClient.delete(`/projects/${projectId}`);
    } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
};

// Update project
export const updateProject = async (
    projectId: number,
    data: Partial<Project>
): Promise<ApiResponse<Project>> => {
    try {
        return await apiClient.put(`/projects/${projectId}`, data);
    } catch (error) {
        console.error('Error updating project:', error);
        throw error;
    }
};