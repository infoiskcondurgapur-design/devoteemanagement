# Scripts Folder

This directory contains database checking and utility management scripts.
- Data cleanups (duplicates checker).
- Workarounds and wrapper compilers (like `fix_7za.py`).
- `import-from-neon.mjs` — pulls missing `devotee` rows from the Neon (web) DB into the local SQLite DB.
  Never overwrites local rows; always backs up first. Dry run by default, `--apply` to execute:
  `node scripts/import-from-neon.mjs [--apply]`
