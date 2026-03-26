import axios from "axios";

export interface ZoomMeetingOptions {
  topic: string;
  startTime: string; // ISO 8601 UTC e.g. "2026-03-15T10:00:00Z"
  duration: number; // minutes
  password?: string;
  timezone?: string;
}

export interface ZoomMeetingResult {
  id: string;
  joinUrl: string;
  startUrl: string;
  password: string;
  topic: string;
  startTime: string;
  duration: number;
}

async function getZoomAccessToken(accountId: string, clientId: string, clientSecret: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await axios.post(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    null,
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return response.data.access_token as string;
}

export async function createZoomMeeting(
  accountId: string,
  clientId: string,
  clientSecret: string,
  options: ZoomMeetingOptions
): Promise<ZoomMeetingResult> {
  const token = await getZoomAccessToken(accountId, clientId, clientSecret);

  const body: Record<string, unknown> = {
    topic: options.topic,
    type: 2, // scheduled meeting
    start_time: options.startTime,
    duration: options.duration,
    timezone: options.timezone ?? "Asia/Tokyo",
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      waiting_room: true,
    },
  };

  if (options.password) {
    body.password = options.password;
  }

  const response = await axios.post("https://api.zoom.us/v2/users/me/meetings", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = response.data;
  return {
    id: String(data.id),
    joinUrl: data.join_url,
    startUrl: data.start_url,
    password: data.password ?? "",
    topic: data.topic,
    startTime: data.start_time,
    duration: data.duration,
  };
}

export function generatePassword(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
