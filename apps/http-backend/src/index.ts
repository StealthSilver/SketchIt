import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";
import {
  CreateUserSchema,
  SigninSchema,
  CreateRoomSchema,
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import cors from "cors";

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(cors());

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
    res.json({
      message: "Incorrect Inputs",
    });
    return;
  }

  const user = await prismaClient.user.findFirst({
    where: {
      email: parsedData.data.username,
    },
  });

  if (!user) {
    return res.status(403).json({
      message: "not authorised",
    });
  }

  const isPasswordValid = await bcrypt.compare(
    parsedData.data.password,
    user.password
  );

  if (!isPasswordValid) {
    return res.status(403).json({
      message: "Invalid credentials",
    });
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
});

app.post("/room", middleware, async (req, res) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "Incorrect Inputs",
    });
    return;
  }

  //@ts-ignore
  const userId = req.userId;

  try {
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
      message: "Room already exists with this name",
    });
  }
});

app.get("/chats/:roomId", async (req, res) => {
  const roomIdParam = req.params.roomId;

  try {
    let room;

    // Try to find room by slug first (for string identifiers like "demo")
    room = await prismaClient.room.findFirst({
      where: {
        slug: roomIdParam,
      },
    });

    // If not found and roomIdParam is numeric, try by ID
    if (!room && !isNaN(Number(roomIdParam))) {
      const roomId = Number(roomIdParam);
      room = await prismaClient.room.findFirst({
        where: {
          id: roomId,
        },
      });
    }

    // If room doesn't exist, return empty messages
    if (!room) {
      return res.json({
        messages: [],
      });
    }

    const messages = await prismaClient.chat.findMany({
      where: {
        roomId: room.id,
      },
      orderBy: {
        id: "desc",
      },
      take: 50,
    });

    res.json({
      messages,
    });
  } catch (e) {
    console.error("Error fetching chats:", e);
    res.status(500).json({
      message: "Error fetching chats",
    });
  }
});

// return the roomId by the slug or create if doesn't exist
app.get("/room/:slug", async (req, res) => {
  const slug = req.params.slug;

  try {
    let room = await prismaClient.room.findFirst({
      where: {
        slug,
      },
    });

    // If room doesn't exist, create it with a default admin
    // In production, you'd want proper admin assignment
    if (!room) {
      // For demo purposes, we'll need a default user
      // You should handle this better in production
      const defaultUser = await prismaClient.user.findFirst();

      if (defaultUser) {
        room = await prismaClient.room.create({
          data: {
            slug,
            adminId: defaultUser.id,
          },
        });
      } else {
        return res.status(404).json({
          message: "No users exist. Please sign up first.",
        });
      }
    }

    res.json({
      room,
    });
  } catch (e) {
    console.error("Error with room:", e);
    res.status(500).json({
      message: "Error fetching or creating room",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
