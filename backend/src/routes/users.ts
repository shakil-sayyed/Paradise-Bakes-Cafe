import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// GET /users - list all users (admin only)
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /users - create a new user (admin only)
router.post(
  "/",
  body("name").isString().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").isIn(["admin", "staff"]).withMessage("Role must be admin or staff"),
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      await db.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, role]
      );

      res.status(201).json({ message: "User created successfully" });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// PUT /users/:id - update a user
router.put(
  "/:id",
  body("name").optional().isString(),
  body("email").optional().isEmail(),
  body("password").optional().isLength({ min: 6 }),
  body("role").optional().isIn(["admin", "staff"]),
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, email, password, role } = req.body;

    try {
      let updateFields: any[] = [];
      let queryStr = "UPDATE users SET ";

      if (name) {
        queryStr += "name = ?, ";
        updateFields.push(name);
      }
      if (email) {
        queryStr += "email = ?, ";
        updateFields.push(email);
      }
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        queryStr += "password = ?, ";
        updateFields.push(hashedPassword);
      }
      if (role) {
        queryStr += "role = ?, ";
        updateFields.push(role);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }

      // Remove last comma and space
      queryStr = queryStr.slice(0, -2) + " WHERE id = ?";
      updateFields.push(id);

      const [result]: any = await db.query(queryStr, updateFields);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User updated successfully" });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// DELETE /users/:id - delete a user
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await db.query("DELETE FROM users WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

