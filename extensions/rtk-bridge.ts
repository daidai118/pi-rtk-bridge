import { isToolCallEventType } from "@mariozechner/pi-coding-agent";

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

export default function (pi) {
  let rtkAvailable = false;

  async function refreshAvailability() {
    const result = await pi.exec("bash", [
      "-lc",
      "command -v rtk >/dev/null 2>&1 && rtk gain >/dev/null 2>&1"
    ]);
    rtkAvailable = result.code === 0;
    return rtkAvailable;
  }

  pi.on("session_start", async (_event, ctx) => {
    await refreshAvailability();
    if (ctx.hasUI) {
      ctx.ui.setStatus("rtk-bridge", rtkAvailable ? "RTK:on" : "RTK:off");
    }
  });

  pi.on("before_agent_start", async (event) => {
    if (!rtkAvailable) return;

    return {
      systemPrompt:
        event.systemPrompt +
        "\n\nRTK bridge: safe bash commands are auto-rewritten to `rtk <command>`. Pi built-in tools like read, grep, find, ls, edit, and write bypass RTK. When you want RTK-filtered output for those workflows, prefer bash commands or explicit `rtk read`, `rtk grep`, `rtk find`, or `rtk ls`."
    };
  });

  pi.on("tool_call", async (event) => {
    if (!rtkAvailable) return;
    if (!isToolCallEventType("bash", event)) return;

    const command = (event.input.command ?? "").trim();
    if (!shouldRewrite(command)) return;

    event.input.command = `rtk ${command}`;
  });

  pi.registerCommand("rtk-status", {
    description: "Show RTK bridge status",
    handler: async (_args, ctx) => {
      await refreshAvailability();
      const lines = rtkAvailable
        ? [
            "RTK bridge is active.",
            "- Matching safe bash commands will be rewritten to rtk automatically.",
            "- Built-in read/grep/find/ls/edit/write still bypass RTK.",
            "- Use explicit rtk commands when you want RTK-filtered output for those tools."
          ]
        : [
            "RTK bridge is installed but the rtk binary is not available.",
            "Install RTK, then verify with: rtk --version && rtk gain",
            "Recommended install: brew install rtk"
          ];

      if (ctx.hasUI) {
        ctx.ui.notify(lines.join("\n"), rtkAvailable ? "info" : "warning");
        ctx.ui.setStatus("rtk-bridge", rtkAvailable ? "RTK:on" : "RTK:off");
      } else {
        process.stdout.write(`${lines.join("\n")}\n`);
      }
    }
  });
}
