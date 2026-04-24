# pi-rtk-bridge

A Pi package that integrates [RTK](https://github.com/rtk-ai/rtk) with Pi.

Repository:

- https://github.com/daidai118/pi-rtk-bridge

## What it does

- Rewrites safe, verbose **bash** commands to `rtk <command>` automatically
- Injects concise RTK guidance into Pi's system prompt
- Adds `/rtk-status`, `/rtk-on`, `/rtk-off`, and `/rtk-toggle`
- Shows a small `RTK:on`, `RTK:off`, or `RTK:missing` status in the footer in interactive mode

## Important limitation

RTK only applies to **bash** commands. Pi built-in tools like `read`, `grep`, `find`, `ls`, `edit`, and `write` do **not** automatically pass through RTK.

If you want RTK-filtered output for those workflows, use bash commands or explicit RTK commands such as:

```bash
rtk read path/to/file
rtk grep "pattern" .
rtk find "*.ts" .
rtk ls .
```

## Prerequisite: install RTK

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

### Global install

Recommended if you want RTK integration in all Pi sessions:

```bash
pi install git:github.com/daidai118/pi-rtk-bridge
```

You can also install with the full GitHub URL:

```bash
pi install https://github.com/daidai118/pi-rtk-bridge.git
```

### Project-local install

Use this if you want the package enabled only for the current project:

```bash
pi install -l git:github.com/daidai118/pi-rtk-bridge
```

## Activate it

After installation, reload Pi:

```text
/reload
```

Then verify inside Pi:

```text
/rtk-status
```

Once active, matching bash commands like `git status`, `cargo test`, and `pytest` will be rewritten automatically.

## Control it manually

Inside Pi, you can control the bridge with:

```text
/rtk-status   # show whether the bridge is on, off, or missing RTK
/rtk-on       # enable automatic RTK rewriting
/rtk-off      # disable automatic RTK rewriting
/rtk-toggle   # toggle between on and off
```

The on/off setting is persisted in:

```text
~/.pi/agent/extensions/pi-rtk-bridge.json
```

So if you turn it off, it stays off across reloads and future Pi restarts until you turn it back on.

## Update

If you installed from an unpinned git source, you can update it with:

```bash
pi update
```

If you want reproducible installs, install a pinned ref instead:

```bash
pi install git:github.com/daidai118/pi-rtk-bridge@main
```

Replace `main` with a tag or commit if you want a stricter pin.

## Remove

Global remove:

```bash
pi remove git:github.com/daidai118/pi-rtk-bridge
```

Project-local remove:

```bash
pi remove -l git:github.com/daidai118/pi-rtk-bridge
```

Then reload Pi again:

```text
/reload
```

## No manual AGENTS.md changes required

You do not need to manually edit `AGENTS.md` for this package. The extension injects the necessary RTK guidance into Pi automatically when the bridge is enabled.
