import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "../src/middleware";
import {
  CreateUserSchema,
  SigninSchema,
  CreateRoomSchema,
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import cors from "cors";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.NEXT_PUBLIC_FRONTEND_URL || "",
    ].filter(Boolean),
    credentials: true,
  })
);

app.post("/signup", async (req, res) => {
  const parsedData = CreateUserSchema.safeParse(req.body);

  if (!parsedData.success) {
    return res.json({
      message: "Incorrect Input",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);

    const user = await prismaClient.user.create({
      data: {
        email: parsedData.data.username,
        password: hashedPassword,
        name: parsedData.data.name,
      },
    });

    res.json({
      userId: user.id,
    });
  } catch (e) {
    res.status(411).json({
      message: "user already exists with this username",
    });
  }
});

app.post("/signin", async (req, res) => {
  const parsedData = SigninSchema.safeParse(req.body);

  if (!parsedData.success) {
    return res.json({
      message: "Incorrect Input",
    });
  }

  try {
    const user = await prismaClient.user.findFirst({
      where: {
        email: parsedData.data.username,
      },
    });

    if (!user) {
      res.status(403).json({
        message: "user not found",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      parsedData.data.password,
      user.password
    );

    if (!isPasswordValid) {
      res.status(403).json({
        message: "Incorrect password",
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET
    );

    res.json({
      token,
    });
  } catch (e) {
    res.status(411).json({
      message: "Error while signing in",
    });
  }
});

app.post("/room", middleware, async (req, res) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);

  if (!parsedData.success) {
    return res.json({
      message: "Incorrect Input",
    });
  }

  try {
    //@ts-ignore
    const userId = req.userId;

    const room = await prismaClient.room.create({
      data: {
        slug: parsedData.data.name,
        adminId: userId,
      },
    });

    res.json({
      roomId: room.id,
    });
  } catch (e) {
    res.status(411).json({
      message: "Error while creating a room",
    });
  }
});

app.get("/chats/:roomId", async (req, res) => {
  const roomId = Number(req.params.roomId);

  try {
    const messages = await prismaClient.chat.findMany({
      where: {
        roomId,
      },
      include: {
        user: true,
      },
    });

    res.json({
      messages,
    });
  } catch (e) {
    res.status(411).json({
      message: "Error while getting chats",
    });
  }
});

export default (req: VercelRequest, res: VercelResponse) => {
  return new Promise((resolve) => {
    app(req as any, res as any);
    res.on("finish", resolve);
  });
};
