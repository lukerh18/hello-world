# Personal Life Tracker

## Source of Truth

The canonical project direction lives in:

- `PRODUCT_SOURCE_OF_TRUTH.md`

Use that file for product, design, and engineering decisions.

## Environment Variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ESV_API_KEY` (required for in-app ESV Proverbs reader)
- `VITE_MICROSOFT_TENANT_ID` (optional; set for single-tenant Microsoft Entra apps to avoid `/common` auth errors)
