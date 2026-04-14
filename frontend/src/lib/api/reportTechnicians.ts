import type { ReportTechnicianDto } from "@/types/dtos";
import { api } from "./client";

export const listReportTechnicians = async () =>
    (await api.get<ReportTechnicianDto[]>("/report-technicians")).data;
