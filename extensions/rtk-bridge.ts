import { getAgentDir, isToolCallEventType } from "@mariozechner/pi-coding-agent";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const SIMPLE_PREFIXES = [
  "git",
  "gh",
  "ls",
  "tree",
  "cat",
  "head",
  "tail",
  "rg",
  "grep",
  "find",
  "fd",
  "pytest",
  "jest",
  "vitest",
  "tsc",
  "next build",
  "ruff check",
  "go test",
  "cargo test",
  "cargo build",
  "cargo clippy",
  "playwright test",
  "docker ps",
  "docker images",
  "docker logs",
  "docker compose ps",
  "npm test",
  "npm run test",
  "npm run build",
  "npm list",
  "pnpm test",
  "pnpm list",
  "pnpm outdated",
  "pnpm install",
  "prettier --check"
];

const CONFIG_PATH = join(getAgentDir(), "extensions", "pi-rtk-bridge.json");

function startsWithWord(command, prefix) {
  return command === prefix || command.startsWith(`${prefix} `);
}

function hasShellMetacharacters(command) {
  return command.includes("\n") || /&&|\|\||[|;<>()`]/.test(command);
}

function hasLeadingEnvAssignment(command) {
  return /^[A-Za-z_][A-Za-z0-9_]*=/.test(command);
}

function shouldSkip(command) {
  return ["rtk", "sudo", "time", "command", "builtin", "source", "cd", "export", "."].some((prefix) =>
    startsWithWord(command, prefix)
  );
}

function shouldRewrite(command) {
  if (!command) return false;
  if (hasShellMetacharacters(command)) return false;
  if (hasLeadingEnvAssignment(command)) return false;
  if (shouldSkip(command)) return false;
  return SIMPLE_PREFIXES.some((prefix) => startsWithWord(command, prefix));
}

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    return { enabled: true };
  }

  try {
    const parsed = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    return { enabled: parsed.enabled !== false };
  } catch {
    return { enabled: true };
  }
}

async function saveConfig(config) {
  await mkdir(dirname(CONFIG_PATH), { recursive: true });
  await writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function getStatusLabel(enabled, rtkAvailable) {
  if (!enabled) return "RTK:off";
  return rtkAvailable ? "RTK:on" : "RTK:missing";
}

function getStatusLines(enabled, rtkAvailable) {
  if (!enabled) {
    return [
      "RTK bridge is installed but manually disabled.",
      "Use /rtk-on to enable automatic RTK rewriting again.",
      `Config: ${CONFIG_PATH}`
    ];
  }

  if (!rtkAvailable) {
    return [
      "RTK bridge is enabled but the rtk binary is not available.",
      "Verify with: rtk --version && rtk gain",
      `Config: ${CONFIG_PATH}`
    ];
  }

  return [
    "RTK bridge is active.",
    "- Matching safe bash commands will be rewritten to rtk automatically.",
    "- Built-in read/grep/find/ls/edit/write still bypass RTK.",
    "- Use explicit rtk commands when you want RTK-filtered output for those tools.",
    `Config: ${CONFIG_PATH}`
  ];
}

function writeMessage(ctx, lines, level, enabled, rtkAvailable) {
  if (ctx.hasUI) {
    ctx.ui.notify(lines.join("\n"), level);
    ctx.ui.setStatus("rtk-bridge", getStatusLabel(enabled, rtkAvailable));
    return;
  }

  process.stdout.write(`${lines.join("\n")}\n`);
}

export default function (pi) {
  let enabled = true;
  let rtkAvailable = false;

  async function refreshAvailability() {
    const result = await pi.exec("bash", ["-lc", "command -v rtk >/dev/null 2>&1 && rtk gain >/dev/null 2>&1"]);
    rtkAvailable = result.code === 0;
    return rtkAvailable;
  }

  function updateStatus(ctx) {
    if (ctx.hasUI) {
      ctx.ui.setStatus("rtk-bridge", getStatusLabel(enabled, rtkAvailable));
    }
  }

  async function setEnabled(nextValue, ctx) {
    enabled = nextValue;
    await saveConfig({ enabled });
    await refreshAvailability();
    updateStatus(ctx);
    return getStatusLines(enabled, rtkAvailable);
  }

  function registerSwitchCommand(name, nextValue, description) {
    pi.registerCommand(name, {
      description,
      handler: async (_args, ctx) => {
        const lines = await setEnabled(nextValue, ctx);
        writeMessage(ctx, lines, nextValue ? "info" : "warning", enabled, rtkAvailable);
      }
    });
  }

  pi.on("session_start", async (_event, ctx) => {
    enabled = loadConfig().enabled;
    await refreshAvailability();
    updateStatus(ctx);
  });

  pi.on("before_agent_start", async (event) => {
    if (!enabled || !rtkAvailable) return;

    return {
      systemPrompt:
        event.systemPrompt +
        "\n\nRTK bridge: safe bash commands are auto-rewritten to `rtk <command>`. Pi built-in tools like read, grep, find, ls, edit, and write bypass RTK. When you want RTK-filtered output for those workflows, prefer bash commands or explicit `rtk read`, `rtk grep`, `rtk find`, or `rtk ls`."
    };
  });

  pi.on("tool_call", async (event) => {
    if (!enabled || !rtkAvailable) return;
    if (!isToolCallEventType("bash", event)) return;

    const command = (event.input.command ?? "").trim();
    if (!shouldRewrite(command)) return;

    event.input.command = `rtk ${command}`;
  });

  pi.registerCommand("rtk-status", {
    description: "Show RTK bridge status",
    handler: async (_args, ctx) => {
      enabled = loadConfig().enabled;
      await refreshAvailability();
      updateStatus(ctx);
      writeMessage(ctx, getStatusLines(enabled, rtkAvailable), enabled && rtkAvailable ? "info" : "warning", enabled, rtkAvailable);
    }
  });

  pi.registerCommand("rtk-toggle", {
    description: "Toggle the RTK bridge on or off",
    handler: async (_args, ctx) => {
      enabled = loadConfig().enabled;
      const lines = await setEnabled(!enabled, ctx);
      writeMessage(ctx, lines, enabled ? "info" : "warning", enabled, rtkAvailable);
    }
  });

  registerSwitchCommand("rtk-on", true, "Enable automatic RTK rewriting");
  registerSwitchCommand("rtk-off", false, "Disable automatic RTK rewriting");
}
