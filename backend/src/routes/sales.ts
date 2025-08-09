import { Router, Request, Response } from "express";
import { db } from "../db";
import { authenticateJWT } from "../middleware/authMiddleware";
import Joi from "joi";

const router = Router();

// Validation schema
const saleSchema = Joi.object({
  date: Joi.date().required(),
  total_amount: Joi.number().required(),
  notes: Joi.string().allow("")
});

// Get all sales
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM sales ORDER BY date DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching sales" });
  }
});

// Get single sale by ID
router.get("/:id", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM sales WHERE id = ?",
      [req.params.id]
    );
    if ((rows as any).length === 0) {
      return res.status(404).json({ message: "Sale not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching sale" });
  }
});

// Create sale
router.post("/", authenticateJWT, async (req: Request, res: Response) => {
  const { error } = saleSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { date, total_amount, notes } = req.body;

  try {
    await db.query(
      "INSERT INTO sales (date, total_amount, notes) VALUES (?, ?, ?)",
      [date, total_amount, notes || ""]
    );
    res.status(201).json({ message: "Sale created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating sale" });
  }
});

// Update sale
router.put("/:id", authenticateJWT, async (req: Request, res: Response) => {
  const { error } = saleSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { date, total_amount, notes } = req.body;

  try {
    const [result]: any = await db.query(
      "UPDATE sales SET date=?, total_amount=?, notes=? WHERE id=?",
      [date, total_amount, notes || "", req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.json({ message: "Sale updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating sale" });
  }
});

// Delete sale
router.delete("/:id", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [result]: any = await db.query(
      "DELETE FROM sales WHERE id = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Sale not found" });
    }
    res.json({ message: "Sale deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting sale" });
  }
});

export default router;

