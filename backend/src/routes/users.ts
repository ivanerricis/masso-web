import { Router } from "express";
import { z } from "zod";
import { createUser, deleteUser, listUsers, regeneratePassword, setUserActive } from "../services/authManager";
import { idParamsSchema } from "./crudRouter";
import { validate } from "./validation";

const usersRouter = Router();

const createUserBodySchema = z
    .object({
        username: z.string().trim().min(1).max(50),
    })
    .strict();

usersRouter.get("/", async (_req, res) => {
    res.json(await listUsers());
});

usersRouter.post("/", validate({ body: createUserBodySchema }), async (req, res) => {
    const { username } = req.body as { username: string };

    res.status(201).json(await createUser(username));
});

usersRouter.post("/:id/regenerate-password", validate({ params: idParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };

    res.json(await regeneratePassword(id));
});

usersRouter.post("/:id/disable", validate({ params: idParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };

    if (id === req.user!.id) {
        res.status(400).json({ message: "Non puoi disabilitare il tuo stesso account" });
        return;
    }

    res.json(await setUserActive(id, false));
});

usersRouter.post("/:id/enable", validate({ params: idParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };

    res.json(await setUserActive(id, true));
});

usersRouter.delete("/:id", validate({ params: idParamsSchema }), async (req, res) => {
    const { id } = req.params as unknown as { id: number };

    if (id === req.user!.id) {
        res.status(400).json({ message: "Non puoi eliminare il tuo stesso account" });
        return;
    }

    await deleteUser(id);
    res.status(204).end();
});

export default usersRouter;
