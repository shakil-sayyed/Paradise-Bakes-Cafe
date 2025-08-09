import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { AuthRequest } from "../middleware/auth";
import { db } from "../db";

const router = Router();

// GET /equipment - fetch all equipment
router.get("/", async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM equipment ORDER BY name ASC");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching equipment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /equipment - add new equipment
router.post(
  "/",
  body("name").isString().notEmpty().withMessage("Name is required"),
  body("type").isString().notEmpty().withMessage("Type is required"),
  body("purchase_date").isISO8601().withMessage("Valid purchase date is required"),
  body("condition").isString().notEmpty().withMessage("Condition is required"),
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, purchase_date, condition, notes } = req.body;

    try {
      await db.query(
        "INSERT INTO equipment (name, type, purchase_date, condition, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)",
        [name, type, purchase_date, condition, notes || null, req.user?.id]
      );

      res.status(201).json({ message: "Equipment added successfully" });
    } catch (error) {
      console.error("Error adding equipment:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// PUT /equipment/:id - update equipment
router.put(
  "/:id",
  body("name").optional().isString(),
  body("type").optional().isString(),
  body("purchase_date").optional().isISO8601(),
  body("condition").optional().isString(),
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, type, purchase_date, condition, notes } = req.body;

    try {
      const [result]: any = await db.query(
        "UPDATE equipment SET name = ?, type = ?, purchase_date = ?, condition = ?, notes = ? WHERE id = ?",
        [name, type, purchase_date, condition, notes || null, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Equipment not found" });
      }

      res.json({ message: "Equipment updated successfully" });
    } catch (error) {
      console.error("Error updating equipment:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// DELETE /equipment/:id - delete equipment
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await db.query("DELETE FROM equipment WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    res.json({ message: "Equipment deleted successfully" });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

