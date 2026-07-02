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

const deviceListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(1000).optional(),
    search: z.string().trim().max(255).optional(),
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

devicesRouter.get("/", validate({ query: deviceListQuerySchema }), async (req, res) => {
    const { page, pageSize, search } = req.query as unknown as {
        page?: number;
        pageSize?: number;
        search?: string;
    };

    const devices = await listDevices({ page, pageSize, search });

    if (page == null || pageSize == null) {
        res.json(devices);
        return;
    }

    const { items, totalItems } = devices;

    res.json({
        items,
        totalItems,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    });
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
