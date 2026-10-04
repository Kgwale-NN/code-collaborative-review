import type { Request, Response, NextFunction } from "express";
import { pool } from "../config/db";

export async function createProject(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        if (!req.user) {
            res.status(401).json({
                message: "Authentication is required"
            });
            return;
        }

        const { name, description } = req.body;

        const result = await pool.query(
            `INSERT INTO projects (name, description, owner_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, owner_id, created_at`,
            [name, description ?? null, req.user.id]
        );

        res.status(201).json({
            message: "Project created successfully",
            project: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
}

export async function listProjects(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        if (!req.user) {
            res.status(401).json({
                message: "Authentication is required"
            });
            return;
        }

        const result = await pool.query(
            `SELECT p.id, p.name, p.description, p.owner_id, p.created_at,
              u.name as owner_name
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       WHERE p.owner_id = $1 OR p.id IN (
         SELECT project_id FROM project_members WHERE user_id = $1
       )
       ORDER BY p.created_at DESC`,
            [req.user.id]
        );

        res.status(200).json({
            projects: result.rows
        });
    } catch (error) {
        next(error);
    }
}

export async function addProjectMember(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const projectId = Number(req.params.id);

        if (!Number.isSafeInteger(projectId) || projectId <= 0) {
            res.status(400).json({
                message: "Project ID must be a positive integer"
            });
            return;
        }

        if (!req.user) {
            res.status(401).json({
                message: "Authentication is required"
            });
            return;
        }

        const { user_id } = req.body;

        // Check if the requester is the project owner
        const projectCheck = await pool.query(
            "SELECT owner_id FROM projects WHERE id = $1",
            [projectId]
        );

        if (projectCheck.rows.length === 0) {
            res.status(404).json({
                message: "Project not found"
            });
            return;
        }

        if (projectCheck.rows[0].owner_id !== req.user.id) {
            res.status(403).json({
                message: "Only the project owner can add members"
            });
            return;
        }

        // Add the member
        const result = await pool.query(
            `INSERT INTO project_members (project_id, user_id)
       VALUES ($1, $2)
       RETURNING id, project_id, user_id, joined_at`,
            [projectId, user_id]
        );

        res.status(201).json({
            message: "Member added successfully",
            member: result.rows[0]
        });
    } catch (error) {
        if (
            error instanceof Error &&
            "code" in error &&
            error.code === "23505"
        ) {
            res.status(409).json({
                message: "This user is already a member of this project"
            });
            return;
        }

        if (
            error instanceof Error &&
            "code" in error &&
            error.code === "23503"
        ) {
            res.status(404).json({
                message: "User not found"
            });
            return;
        }

        next(error);
    }
}

export async function removeProjectMember(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const projectId = Number(req.params.id);
        const userId = Number(req.params.userId);

        if (!Number.isSafeInteger(projectId) || projectId <= 0) {
            res.status(400).json({
                message: "Project ID must be a positive integer"
            });
            return;
        }

        if (!Number.isSafeInteger(userId) || userId <= 0) {
            res.status(400).json({
                message: "User ID must be a positive integer"
            });
            return;
        }

        if (!req.user) {
            res.status(401).json({
                message: "Authentication is required"
            });
            return;
        }

        // Check if the requester is the project owner
        const projectCheck = await pool.query(
            "SELECT owner_id FROM projects WHERE id = $1",
            [projectId]
        );

        if (projectCheck.rows.length === 0) {
            res.status(404).json({
                message: "Project not found"
            });
            return;
        }

        if (projectCheck.rows[0].owner_id !== req.user.id) {
            res.status(403).json({
                message: "Only the project owner can remove members"
            });
            return;
        }

        // Remove the member
        const result = await pool.query(
            "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING id",
            [projectId, userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({
                message: "Member not found in this project"
            });
            return;
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
}