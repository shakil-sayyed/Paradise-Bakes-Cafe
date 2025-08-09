import { Router, Request, Response } from "express";
import { db } from "../db";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router();

// Sales summary report
router.get("/sales-summary", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') AS month, 
        SUM(total_amount) AS total_sales
      FROM sales
      GROUP BY month
      ORDER BY month DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating sales summary" });
  }
});

// Expense summary report
router.get("/expense-summary", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        DATE_FORMAT(e.date, '%Y-%m') AS month, 
        c.name AS category, 
        SUM(e.amount) AS total_expense
      FROM expenses e
      JOIN expense_categories c ON e.category_id = c.id
      GROUP BY month, category
      ORDER BY month DESC, category ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating expense summary" });
  }
});

// Stock usage report
router.get("/stock-usage", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        i.name AS ingredient, 
        SUM(s.change) AS total_used
      FROM stock s
      JOIN ingredients i ON s.ingredient_id = i.id
      WHERE s.change < 0
      GROUP BY i.name
      ORDER BY total_used ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating stock usage report" });
  }
});

// Profit summary (Sales - Expenses)
router.get("/profit-summary", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        sales.month,
        sales.total_sales,
        IFNULL(expenses.total_expenses, 0) AS total_expenses,
        (sales.total_sales - IFNULL(expenses.total_expenses, 0)) AS profit
      FROM (
        SELECT DATE_FORMAT(date, '%Y-%m') AS month, SUM(total_amount) AS total_sales
        FROM sales
        GROUP BY month
      ) sales
      LEFT JOIN (
        SELECT DATE_FORMAT(date, '%Y-%m') AS month, SUM(amount) AS total_expenses
        FROM expenses
        GROUP BY month
      ) expenses ON sales.month = expenses.month
      ORDER BY sales.month DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating profit summary" });
  }
});

export default router;

