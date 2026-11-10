import { expect, test } from "vitest";
import { socialIcon, socialLabel } from "../src/borda/socials.ts";

test("the icon comes from the network name, then the host, then the globe", () => {
  expect(socialIcon("LinkedIn", "https://www.linkedin.com/in/x")).toBe("linkedin");
  expect(socialIcon("Twitter", "https://x.com/example")).toBe("x");
  expect(socialIcon("profile", "https://www.instagram.com/example")).toBe("instagram");
  expect(socialIcon("video", "https://youtu.be/abc")).toBe("youtube");
  expect(socialIcon("sitio", "https://example.com")).toBe("website");
  expect(socialIcon("other", "not a url")).toBe("website");
});

test("the label is the board file's, else the network's name, else the host", () => {
  expect(socialLabel("instagram", "https://www.instagram.com/example", "@example")).toBe("@example");
  expect(socialLabel("tiktok", "https://www.tiktok.com/@example", null)).toBe("TikTok");
  expect(socialLabel("site", "https://www.example.com", null)).toBe("example.com");
});
