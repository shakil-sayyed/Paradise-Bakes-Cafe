import { Router, Request, Response } from "express";
import { db } from "../db";
import { authenticateJWT } from "../middleware/authMiddleware";
import Joi from "joi";

const router = Router();

// Validation schema
const ingredientSchema = Joi.object({
  name: Joi.string().required(),
  unit: Joi.string().required(),
  cost_per_unit: Joi.number().required()
});

// Get all ingredients
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM ingredients ORDER BY name ASC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching ingredients" });
  }
});

// Get single ingredient by ID
router.get("/:id", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM ingredients WHERE id = ?", [
      req.params.id
    ]);
    if ((rows as any).length === 0) {
      return res.status(404).json({ message: "Ingredient not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching ingredient" });
  }
});

// Create ingredient
router.post("/", authenticateJWT, async (req: Request, res: Response) => {
  const { error } = ingredientSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { name, unit, cost_per_unit } = req.body;

  try {
    await db.query(
      "INSERT INTO ingredients (name, unit, cost_per_unit) VALUES (?, ?, ?)",
      [name, unit, cost_per_unit]
    );
    res.status(201).json({ message: "Ingredient created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating ingredient" });
  }
});

// Update ingredient
router.put("/:id", authenticateJWT, async (req: Request, res: Response) => {
  const { error } = ingredientSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { name, unit, cost_per_unit } = req.body;

  try {
    const [result]: any = await db.query(
      "UPDATE ingredients SET name=?, unit=?, cost_per_unit=? WHERE id=?",
      [name, unit, cost_per_unit, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Ingredient not found" });
    }

    res.json({ message: "Ingredient updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating ingredient" });
  }
});

// Delete ingredient
router.delete("/:id", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [result]: any = await db.query("DELETE FROM ingredients WHERE id = ?", [
      req.params.id
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Ingredient not found" });
    }
    res.json({ message: "Ingredient deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting ingredient" });
  }
});

export default router;

