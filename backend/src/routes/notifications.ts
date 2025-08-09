import { Router, Request, Response } from "express";
import { db } from "../db";
import { authenticateJWT } from "../middleware/authMiddleware";
import Joi from "joi";

const router = Router();

const notificationSchema = Joi.object({
  message: Joi.string().required(),
  type: Joi.string().valid("info", "warning", "error", "success").required(),
  is_read: Joi.boolean().default(false)
});

// Get all notifications
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM notifications ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

// Get unread notifications
router.get("/unread", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM notifications WHERE is_read = 0 ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching unread notifications" });
  }
});

// Create notification
router.post("/", authenticateJWT, async (req: Request, res: Response) => {
  const { error } = notificationSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { message, type, is_read } = req.body;

  try {
    await db.query(
      "INSERT INTO notifications (message, type, is_read, created_at) VALUES (?, ?, ?, NOW())",
      [message, type, is_read || false]
    );
    res.status(201).json({ message: "Notification created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating notification" });
  }
});

// Mark notification as read
router.put("/:id/read", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [result]: any = await db.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error marking notification as read" });
  }
});

// Delete notification
router.delete("/:id", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [result]: any = await db.query(
      "DELETE FROM notifications WHERE id = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting notification" });
  }
});

export default router;

