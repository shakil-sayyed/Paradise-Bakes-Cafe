import { Router, Request, Response } from "express";
import { db } from "../db";
import { authenticateJWT } from "../middleware/authMiddleware";
import Joi from "joi";

const router = Router();

// Validation schema
const stockSchema = Joi.object({
  ingredient_id: Joi.number().required(),
  change: Joi.number().required(),
  reason: Joi.string().required()
});

// Get all stock entries
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(
      `SELECT s.id, s.date, i.name as ingredient, s.change, s.reason
       FROM stock s
       JOIN ingredients i ON s.ingredient_id = i.id
       ORDER BY s.date DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching stock entries" });
  }
});

// Get current stock levels
router.get("/current", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(
      `SELECT i.id, i.name, i.unit, IFNULL(SUM(s.change), 0) AS quantity
       FROM ingredients i
       LEFT JOIN stock s ON i.id = s.ingredient_id
       GROUP BY i.id, i.name, i.unit`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching current stock levels" });
  }
});

// Add stock change entry
router.post("/", authenticateJWT, async (req: Request, res: Response) => {
  const { error } = stockSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { ingredient_id, change, reason } = req.body;

  try {
    await db.query(
      "INSERT INTO stock (ingredient_id, change, reason, date) VALUES (?, ?, ?, NOW())",
      [ingredient_id, change, reason]
    );
    res.status(201).json({ message: "Stock entry added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding stock entry" });
  }
});

// Delete stock entry
router.delete("/:id", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [result]: any = await db.query("DELETE FROM stock WHERE id = ?", [
      req.params.id
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Stock entry not found" });
    }
    res.json({ message: "Stock entry deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting stock entry" });
  }
});

export default router;

