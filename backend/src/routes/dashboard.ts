import { Router, Request, Response } from "express";
import { db } from "../db";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router();

// Get dashboard stats
router.get("/stats", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [[salesToday]]: any = await db.query(
      "SELECT IFNULL(SUM(total_amount), 0) AS total FROM sales WHERE DATE(date) = CURDATE()"
    );

    const [[expensesToday]]: any = await db.query(
      "SELECT IFNULL(SUM(amount), 0) AS total FROM expenses WHERE DATE(date) = CURDATE()"
    );

    const [[lowStock]]: any = await db.query(`
      SELECT COUNT(*) AS count
      FROM (
        SELECT i.id, i.name, IFNULL(SUM(s.change), 0) AS quantity
        FROM ingredients i
        LEFT JOIN stock s ON i.id = s.ingredient_id
        GROUP BY i.id, i.name
        HAVING quantity < 10
      ) AS low_stock_items
    `);

    const [[unreadNotifications]]: any = await db.query(
      "SELECT COUNT(*) AS count FROM notifications WHERE is_read = 0"
    );

    res.json({
      salesToday: salesToday.total,
      expensesToday: expensesToday.total,
      lowStockCount: lowStock.count,
      unreadNotifications: unreadNotifications.count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
});

export default router;

