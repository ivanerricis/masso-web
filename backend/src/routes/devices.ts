import { Router } from "express";
import {
    createDevice,
    deleteDeviceById,
    getDeviceById,
    listDevices,
    updateDeviceById,
} from "../db/queries/device";
import { parseId } from "./utils";

const devicesRouter = Router();

devicesRouter.get("/", async (_, res) => {
    const devices = await listDevices();

    res.json(devices);
});

devicesRouter.get("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        res.status(400).json({ message: "Invalid device id" });
        return;
    }

    const devices = await getDeviceById(id);

    if (devices.length === 0) {
        res.status(404).json({ message: "Device not found" });
        return;
    }

    res.json(devices[0]);
});

devicesRouter.post("/", async (req, res) => {
    const createdDevice = await createDevice(req.body);

    res.status(201).json(createdDevice[0]);
});

devicesRouter.put("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        res.status(400).json({ message: "Invalid device id" });
        return;
    }

    const updatedDevice = await updateDeviceById(id, req.body);

    if (updatedDevice.length === 0) {
        res.status(404).json({ message: "Device not found" });
        return;
    }

    res.json(updatedDevice[0]);
});

devicesRouter.delete("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        res.status(400).json({ message: "Invalid device id" });
        return;
    }

    const deletedDevice = await deleteDeviceById(id);

    if (deletedDevice.length === 0) {
        res.status(404).json({ message: "Device not found" });
        return;
    }

    res.json(deletedDevice[0]);
});

export default devicesRouter;
