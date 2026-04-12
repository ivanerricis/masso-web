import { Router } from "express";
import {
    createCustomer,
    deleteCustomerById,
    getCustomerById,
    listCustomers,
    updateCustomerById,
} from "../db/queries/customer";
import { parseId } from "./utils";

const customersRouter = Router();

customersRouter.get("/", async (_, res) => {
    const customers = await listCustomers();

    res.json(customers);
});

customersRouter.get("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        res.status(400).json({ message: "Invalid customer id" });
        return;
    }

    const customers = await getCustomerById(id);

    if (customers.length === 0) {
        res.status(404).json({ message: "Customer not found" });
        return;
    }

    res.json(customers[0]);
});

customersRouter.post("/", async (req, res) => {
    const createdCustomer = await createCustomer(req.body);

    res.status(201).json(createdCustomer[0]);
});

customersRouter.put("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        res.status(400).json({ message: "Invalid customer id" });
        return;
    }

    const updatedCustomer = await updateCustomerById(id, req.body);

    if (updatedCustomer.length === 0) {
        res.status(404).json({ message: "Customer not found" });
        return;
    }

    res.json(updatedCustomer[0]);
});

customersRouter.delete("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        res.status(400).json({ message: "Invalid customer id" });
        return;
    }

    const deletedCustomer = await deleteCustomerById(id);

    if (deletedCustomer.length === 0) {
        res.status(404).json({ message: "Customer not found" });
        return;
    }

    res.json(deletedCustomer[0]);
});

export default customersRouter;
