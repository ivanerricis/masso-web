import { Router } from "express";
import { z } from "zod";
import {
    createDevice,
    deleteDeviceById,
    getDeviceById,
    listDevices,
    updateDeviceById,
} from "../db/queries/device";
import { validate } from "./validation";

const devicesRouter = Router();

const deviceIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const deviceCreateBodySchema = z
    .object({
        name: z.string().trim().min(1).max(255),
    })
    .strict();

const deviceUpdateBodySchema = deviceCreateBodySchema
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field is required",
    });

devicesRouter.get("/", async (_, res) => {
    const devices = await listDevices();

    res.json(devices);
});

devicesRouter.get("/:id", validate({ params: deviceIdParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const devices = await getDeviceById(id);

    if (devices.length === 0) {
        res.status(404).json({ message: "Device not found" });
        return;
    }

    res.json(devices[0]);
});

devicesRouter.post("/", validate({ body: deviceCreateBodySchema }), async (req, res) => {
    const createdDevice = await createDevice(req.body);

    res.status(201).json(createdDevice[0]);
});

devicesRouter.put(
    "/:id",
    validate({ params: deviceIdParamsSchema, body: deviceUpdateBodySchema }),
    async (req, res) => {
        const { id } = req.params as unknown as { id: number };
        const updatedDevice = await updateDeviceById(id, req.body);

        if (updatedDevice.length === 0) {
            res.status(404).json({ message: "Device not found" });
            return;
        }

        res.json(updatedDevice[0]);
    }
);

devicesRouter.delete("/:id", validate({ params: deviceIdParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const deletedDevice = await deleteDeviceById(id);

    if (deletedDevice.length === 0) {
        res.status(404).json({ message: "Device not found" });
        return;
    }

    res.json(deletedDevice[0]);
});

export default devicesRouter;
