import { Router, Request, Response } from "express";
import { db } from "../db";
import { authenticateJWT } from "../middleware/authMiddleware";
import Joi from "joi";

const router = Router();

// Validation schema
const expenseSchema = Joi.object({
  date: Joi.date().required(),
  category_id: Joi.number().required(),
  amount: Joi.number().required(),
  description: Joi.string().allow("")
});

// Get all expenses
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(
      `SELECT e.id, e.date, c.name as category, e.amount, e.description
       FROM expenses e
       JOIN expense_categories c ON e.category_id = c.id
       ORDER BY e.date DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching expenses" });
  }
});

// Get expense by ID
router.get("/:id", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(
      `SELECT e.id, e.date, c.name as category, e.amount, e.description
       FROM expenses e
       JOIN expense_categories c ON e.category_id = c.id
       WHERE e.id = ?`,
      [req.params.id]
    );
    if ((rows as any).length === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching expense" });
  }
});

// Create expense
router.post("/", authenticateJWT, async (req: Request, res: Response) => {
  const { error } = expenseSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { date, category_id, amount, description } = req.body;

  try {
    await db.query(
      "INSERT INTO expenses (date, category_id, amount, description) VALUES (?, ?, ?, ?)",
      [date, category_id, amount, description || ""]
    );
    res.status(201).json({ message: "Expense created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating expense" });
  }
});

// Update expense
router.put("/:id", authenticateJWT, async (req: Request, res: Response) => {
  const { error } = expenseSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { date, category_id, amount, description } = req.body;

  try {
    const [result]: any = await db.query(
      "UPDATE expenses SET date=?, category_id=?, amount=?, description=? WHERE id=?",
      [date, category_id, amount, description || "", req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ message: "Expense updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating expense" });
  }
});

// Delete expense
router.delete("/:id", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [result]: any = await db.query("DELETE FROM expenses WHERE id = ?", [
      req.params.id
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting expense" });
  }
});

export default router;

