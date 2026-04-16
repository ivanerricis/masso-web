export type PaymentMethod = "non_paid" | "cash" | "card";

export type ReportDto = {
    id: number;
    customer: string;
    customerPhone: string | null;
    device: string;
    issue: string;
    password: string | null;
    paymentMethod: PaymentMethod;
    charger: boolean;
    technician: string;
    internalPrice: number;
    technicianPrice: number;
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
    phoneNumberSecondary: string | null;
    email: string | null;
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
