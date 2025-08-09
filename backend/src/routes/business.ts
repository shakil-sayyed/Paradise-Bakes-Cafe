import { Router, Request, Response } from "express";
import { db } from "../db";
import { authenticateJWT } from "../middleware/authMiddleware";
import Joi from "joi";

const router = Router();

// Validation schema
const businessSchema = Joi.object({
  date: Joi.date().required(),
  opening_balance: Joi.number().required(),
  income: Joi.number().required(),
  expense: Joi.number().required(),
  notes: Joi.string().allow("")
});

// Get all business entries
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM business ORDER BY date DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching business entries" });
  }
});

// Get business entry by date
router.get("/:date", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM business WHERE date = ?", [
      req.params.date
    ]);
    if ((rows as any).length === 0) {
      return res.status(404).json({ message: "Business entry not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching business entry" });
  }
});

// Create a new business entry
router.post("/", authenticateJWT, async (req: Request, res: Response) => {
  const { error } = businessSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { date, opening_balance, income, expense, notes } = req.body;
  const closing_balance = opening_balance + income - expense;

  try {
    // Check if entry for date already exists
    const [existing]: any = await db.query("SELECT id FROM business WHERE date = ?", [date]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Business entry for this date already exists" });
    }

    await db.query(
      "INSERT INTO business (date, opening_balance, income, expense, closing_balance, notes) VALUES (?, ?, ?, ?, ?, ?)",
      [date, opening_balance, income, expense, closing_balance, notes || ""]
    );

    res.status(201).json({ message: "Business entry created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating business entry" });
  }
});

// Update business entry
router.put("/:id", authenticateJWT, async (req: Request, res: Response) => {
  const { error } = businessSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { date, opening_balance, income, expense, notes } = req.body;
  const closing_balance = opening_balance + income - expense;

  try {
    const [result]: any = await db.query(
      "UPDATE business SET date=?, opening_balance=?, income=?, expense=?, closing_balance=?, notes=? WHERE id=?",
      [date, opening_balance, income, expense, closing_balance, notes || "", req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Business entry not found" });
    }

    res.json({ message: "Business entry updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating business entry" });
  }
});

// Delete business entry
router.delete("/:id", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [result]: any = await db.query("DELETE FROM business WHERE id = ?", [
      req.params.id
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Business entry not found" });
    }
    res.json({ message: "Business entry deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting business entry" });
  }
});

export default router;

