export type ReportDto = {
    id: number;
    customer: string;
    device: string;
    issue: string;
    technicians: number;
    totalPrice: number;
    closed: boolean;
    toInvoice: boolean;
    dataBackup: boolean;
    createdAt: string;
};

export type CustomerDto = {
    id: number;
    firstName: string;
    lastName: string | null;
    phoneNumber: string | null;
    email: string | null;
    vatNumber: string | null;
    createdAt: string;
    updatedAt: string | null;
};

export type CollaboratorDto = {
    id: number;
    firstName: string;
    lastName: string | null;
    phoneNumber: string | null;
    createdAt: string;
    updatedAt: string | null;
};

export type TechnicianDto = {
    id: number;
    firstName: string;
    lastName: string | null;
    phoneNumber: string | null;
    vatNumber: string | null;
    createdAt: string;
    updatedAt: string | null;
};

export type DeviceDto = {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string | null;
};

export type IssueDto = {
    id: number;
    description: string;
    createdAt: string;
    updatedAt: string | null;
};

export type ReportTechnicianDto = {
    reportId: number;
    technicianId: number;
    price: number;
};
