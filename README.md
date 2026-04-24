# pi-rtk-bridge

A Pi package that integrates [RTK](https://github.com/rtk-ai/rtk) with Pi.

Repository:

- https://github.com/daidai118/pi-rtk-bridge

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

## Local development install

If you are editing the package locally, you can still install from a filesystem path:

```bash
pi install /absolute/path/to/pi-rtk-bridge
```

For this repo on this machine:

```bash
pi install /Users/daidai/pi-packages/pi-rtk-bridge
```
