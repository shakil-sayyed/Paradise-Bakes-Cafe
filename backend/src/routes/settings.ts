import { Router, Request, Response } from "express";
import { db } from "../db";
import { authenticateJWT } from "../middleware/authMiddleware";
import Joi from "joi";

const router = Router();

const settingSchema = Joi.object({
  key: Joi.string().required(),
  value: Joi.string().required()
});

// Get all settings
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM settings ORDER BY key ASC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching settings" });
  }
});

// Get single setting by key
router.get("/:key", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM settings WHERE `key` = ?", [
      req.params.key
    ]);
    if ((rows as any).length === 0) {
      return res.status(404).json({ message: "Setting not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching setting" });
  }
});

// Create or update setting
router.post("/", authenticateJWT, async (req: Request, res: Response) => {
  const { error } = settingSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { key, value } = req.body;

  try {
    await db.query(
      `INSERT INTO settings (\`key\`, \`value\`)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)`,
      [key, value]
    );
    res.status(201).json({ message: "Setting saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving setting" });
  }
});

// Delete setting
router.delete("/:key", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [result]: any = await db.query(
      "DELETE FROM settings WHERE `key` = ?",
      [req.params.key]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Setting not found" });
    }
    res.json({ message: "Setting deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting setting" });
  }
});

export default router;

