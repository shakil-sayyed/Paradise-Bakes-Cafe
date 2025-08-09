import { Router, Request, Response } from "express";
import { db } from "../db";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router();

// Get all audit logs
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(
      `SELECT al.*, u.username 
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.timestamp DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching audit logs" });
  }
});

// Get audit logs by user
router.get("/user/:userId", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(
      `SELECT al.*, u.username 
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.user_id = ?
       ORDER BY al.timestamp DESC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching audit logs for user" });
  }
});

// Log an action (internal use)
router.post("/", authenticateJWT, async (req: Request, res: Response) => {
  const { user_id, action, details } = req.body;

  if (!user_id || !action) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, details, timestamp)
       VALUES (?, ?, ?, NOW())`,
      [user_id, action, details || ""]
    );
    res.status(201).json({ message: "Audit log created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating audit log" });
  }
});

export default router;

