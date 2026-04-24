# pi-rtk-bridge

A local Pi package that integrates [RTK](https://github.com/rtk-ai/rtk) with Pi.

## What it does

- Rewrites safe, verbose **bash** commands to `rtk <command>` automatically
- Injects concise RTK guidance into Pi's system prompt
- Adds `/rtk-status` so you can confirm the bridge is active
- Shows a small `RTK:on` / `RTK:off` status in the footer in interactive mode

## Important limitation

RTK only applies to **bash** commands. Pi built-in tools like `read`, `grep`, `find`, `ls`, `edit`, and `write` do **not** automatically pass through RTK.

If you want RTK-filtered output for those workflows, use bash commands or explicit RTK commands such as:

```bash
rtk read path/to/file
rtk grep "pattern" .
rtk find "*.ts" .
rtk ls .
```

## Install RTK first

Install the RTK binary first, then verify it:

```bash
brew install rtk
rtk --version
rtk gain
```

Alternative install:

```bash
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
rtk --version
rtk gain
```

## Install this Pi package

From this machine:

```bash
pi install /Users/daidai/pi-packages/pi-rtk-bridge
```

Then reload Pi:

```text
/reload
```

## Verify

Inside Pi, run:

```text
/rtk-status
```

You should see that the bridge is active. Once RTK is installed, matching bash commands like `git status`, `cargo test`, and `pytest` will be rewritten automatically.

## Remove

```bash
pi remove /Users/daidai/pi-packages/pi-rtk-bridge
```

Then reload Pi again:

```text
/reload
```

## Reinstall on another machine

Copy this directory to the new machine, then run:

```bash
pi install /absolute/path/to/pi-rtk-bridge
```

If you want a cleaner long-term workflow, put this directory in your dotfiles repo or another git repo and install from there.
