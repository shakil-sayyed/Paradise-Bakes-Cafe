import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { db } from "../db";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// GET /inventory - list all inventory items
router.get("/", async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM inventory ORDER BY name ASC");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /inventory - add new inventory item
router.post(
  "/",
  body("name").isString().notEmpty().withMessage("Name is required"),
  body("quantity").isNumeric().withMessage("Quantity must be a number"),
  body("unit").isString().notEmpty().withMessage("Unit is required"),
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, quantity, unit, notes } = req.body;

    try {
      await db.query(
        "INSERT INTO inventory (name, quantity, unit, notes, created_by) VALUES (?, ?, ?, ?, ?)",
        [name, quantity, unit, notes || null, req.user?.id]
      );

      res.status(201).json({ message: "Inventory item added successfully" });
    } catch (error) {
      console.error("Error adding inventory item:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// PUT /inventory/:id - update inventory item
router.put(
  "/:id",
  body("name").optional().isString(),
  body("quantity").optional().isNumeric(),
  body("unit").optional().isString(),
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, quantity, unit, notes } = req.body;

    try {
      const [result]: any = await db.query(
        "UPDATE inventory SET name = ?, quantity = ?, unit = ?, notes = ? WHERE id = ?",
        [name, quantity, unit, notes || null, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Inventory item not found" });
      }

      res.json({ message: "Inventory item updated successfully" });
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// DELETE /inventory/:id - delete inventory item
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const [result]: any = await db.query("DELETE FROM inventory WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.json({ message: "Inventory item deleted successfully" });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

