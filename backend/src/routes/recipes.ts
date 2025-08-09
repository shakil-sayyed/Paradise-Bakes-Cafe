import { Router, Request, Response } from "express";
import { db } from "../db";
import { authenticateJWT, requireAdmin } from "../middleware/authMiddleware";
import Joi from "joi";

const router = Router();

// Validation schema
const recipeSchema = Joi.object({
  name_en: Joi.string().required(),
  type: Joi.string().required(),
  ingredients: Joi.string().required(),
  steps_hi: Joi.string().required(),
  chef_tips: Joi.string().allow(""),
  cost_per_portion: Joi.number().required(),
  equipment: Joi.string().allow(""),
  image_path: Joi.string().allow(""),
  storage_notes: Joi.string().allow("")
});

// Get all recipes
router.get("/", async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM recipes ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching recipes" });
  }
});

// Get single recipe by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM recipes WHERE id = ?", [
      req.params.id
    ]);
    if ((rows as any).length === 0) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching recipe" });
  }
});

// Create recipe (admin only)
router.post("/", authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  const { error } = recipeSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const {
      name_en,
      type,
      ingredients,
      steps_hi,
      chef_tips,
      cost_per_portion,
      equipment,
      image_path,
      storage_notes
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO recipes (name_en, type, ingredients, steps_hi, chef_tips, cost_per_portion, equipment, image_path, storage_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name_en,
        type,
        ingredients,
        steps_hi,
        chef_tips,
        cost_per_portion,
        equipment,
        image_path,
        storage_notes
      ]
    );

    res.status(201).json({ message: "Recipe created", id: (result as any).insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating recipe" });
  }
});

// Update recipe (admin only)
router.put("/:id", authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  const { error } = recipeSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const [result] = await db.query(
      `UPDATE recipes SET name_en=?, type=?, ingredients=?, steps_hi=?, chef_tips=?, cost_per_portion=?, equipment=?, image_path=?, storage_notes=?
       WHERE id=?`,
      [
        req.body.name_en,
        req.body.type,
        req.body.ingredients,
        req.body.steps_hi,
        req.body.chef_tips,
        req.body.cost_per_portion,
        req.body.equipment,
        req.body.image_path,
        req.body.storage_notes,
        req.params.id
      ]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    res.json({ message: "Recipe updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating recipe" });
  }
});

// Delete recipe (admin only)
router.delete("/:id", authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [result] = await db.query("DELETE FROM recipes WHERE id = ?", [
      req.params.id
    ]);
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    res.json({ message: "Recipe deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting recipe" });
  }
});

export default router;

