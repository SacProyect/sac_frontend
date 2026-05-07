import path from "path";
import dotenv from "dotenv";
import { test, expect } from "@playwright/test";
import { io } from "socket.io-client";

dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: false });
dotenv.config({
  path: path.resolve(process.cwd(), "../sac_backend/.env"),
  override: false,
});

type LoginPayload = {
  personId: number;
  password: string;
};

type LoginResponse = {
  token: string;
  user?: { id: string; role: string };
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

async function loginAndGetToken(baseURL: string): Promise<LoginResponse> {
  const personId = Number(getRequiredEnv("PERSON_ID"));
  const password = getRequiredEnv("PASSWORD");
  const payload: LoginPayload = { personId, password };

  const response = await fetch(`${baseURL}/user`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Login failed (${response.status}): ${body}`);
  }

  const body = (await response.json()) as LoginResponse;
  if (!body.token) {
    throw new Error("Login succeeded but token is missing in response.");
  }

  return body;
}

test.describe("Notifications E2E (frontend-driven)", () => {
  test("authenticates and validates notifications REST endpoints", async ({ request, baseURL }) => {
    const apiBaseUrl = baseURL ?? "http://localhost:3000";
    const { token } = await loginAndGetToken(apiBaseUrl);

    const notificationsRes = await request.get("/notifications?page=1&limit=20", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(notificationsRes.ok()).toBeTruthy();
    const notificationsBody = await notificationsRes.json();
    expect(Array.isArray(notificationsBody.notifications)).toBeTruthy();
    expect(notificationsBody.pagination).toBeTruthy();
    expect(typeof notificationsBody.pagination.page).toBe("number");
    expect(typeof notificationsBody.pagination.limit).toBe("number");
    expect(typeof notificationsBody.pagination.total).toBe("number");
    expect(typeof notificationsBody.pagination.pages).toBe("number");

    const unreadRes = await request.get("/notifications/unread-count", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(unreadRes.ok()).toBeTruthy();
    const unreadBody = await unreadRes.json();
    expect(typeof unreadBody.count).toBe("number");
  });

  test("connects to websocket using login token", async ({ baseURL }) => {
    const apiBaseUrl = baseURL ?? "http://localhost:3000";
    const { token } = await loginAndGetToken(apiBaseUrl);
    const socketUrl = process.env.E2E_SOCKET_URL || apiBaseUrl;
    const waitMs = Number(process.env.E2E_SOCKET_WAIT_MS || "10000");

    const connected = await new Promise<boolean>((resolve) => {
      const socket = io(socketUrl, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: false,
      });

      const timeout = setTimeout(() => {
        socket.close();
        resolve(false);
      }, waitMs);

      socket.on("connect", () => {
        clearTimeout(timeout);
        socket.close();
        resolve(true);
      });

      socket.on("connect_error", () => {
        clearTimeout(timeout);
        socket.close();
        resolve(false);
      });
    });

    expect(connected).toBeTruthy();
  });
});
