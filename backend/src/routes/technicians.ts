import { Router } from "express";
import {
    createTechnician,
    deleteTechnicianById,
    getTechnicianById,
    listTechnicians,
    updateTechnicianById,
} from "../db/queries/technician";
import { parseId } from "./utils";

const techniciansRouter = Router();

techniciansRouter.get("/", async (_, res) => {
    const technicians = await listTechnicians();

    res.json(technicians);
});

techniciansRouter.get("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        res.status(400).json({ message: "Invalid technician id" });
        return;
    }

    const technicians = await getTechnicianById(id);

    if (technicians.length === 0) {
        res.status(404).json({ message: "Technician not found" });
        return;
    }

    res.json(technicians[0]);
});

techniciansRouter.post("/", async (req, res) => {
    const createdTechnician = await createTechnician(req.body);

    res.status(201).json(createdTechnician[0]);
});

techniciansRouter.put("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        res.status(400).json({ message: "Invalid technician id" });
        return;
    }

    const updatedTechnician = await updateTechnicianById(id, req.body);

    if (updatedTechnician.length === 0) {
        res.status(404).json({ message: "Technician not found" });
        return;
    }

    res.json(updatedTechnician[0]);
});

techniciansRouter.delete("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        res.status(400).json({ message: "Invalid technician id" });
        return;
    }

    const deletedTechnician = await deleteTechnicianById(id);

    if (deletedTechnician.length === 0) {
        res.status(404).json({ message: "Technician not found" });
        return;
    }

    res.json(deletedTechnician[0]);
});

export default techniciansRouter;
