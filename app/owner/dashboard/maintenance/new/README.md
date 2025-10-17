# ⚠️ NOTICE: This Route Is Not Used

## Status: **DEPRECATED - Do Not Use**

This page was originally created to allow property owners to create maintenance requests. However, based on proper business logic and system design, **only tenants should create maintenance requests**.

## Why This Exists

This file is kept for reference and potential future use cases, but is **not linked** in the application UI and should **not be accessed** in normal operations.

## Current Maintenance Workflow

### ✅ Correct Flow:
1. **Tenant** creates maintenance request at `/tenant/dashboard/maintenance/new`
2. **Owner** receives and manages requests at `/owner/dashboard/maintenance`
3. **Owner** can view, assign, update status, and complete requests
4. **Tenant** receives updates and can track progress

### ❌ Incorrect Flow (Removed):
- ~~Owner creates maintenance request for tenant~~

## What Owners Can Do

**Owners should use:** `/owner/dashboard/maintenance`

From there, owners can:
- ✅ View all maintenance requests from their tenants
- ✅ Assign maintenance personnel
- ✅ Update request status
- ✅ Add completion notes and costs
- ✅ Schedule maintenance work
- ✅ Communicate with tenants about requests

## What Owners Cannot Do

- ❌ Create maintenance requests (only tenants can)
- ❌ Access this "new" page via UI (no navigation links)

## Future Considerations

If there's a need for owner-initiated maintenance (e.g., preventive maintenance, scheduled inspections), a separate module should be created with:
- Different route: `/owner/dashboard/preventive-maintenance`
- Different workflow from tenant-reported issues
- Clear distinction from emergency repairs

## File Retention

This file is retained in the codebase for:
1. Reference purposes
2. Potential future adaptation
3. Code history and documentation
4. Avoiding confusion about missing features

## Important Notes

- **Do not link to this page** in navigation menus
- **Do not promote this feature** to users
- **Refer to MAINTENANCE_ROLE_CLARIFICATION.md** for full details

---

**Last Updated:** October 17, 2025  
**Status:** Deprecated  
**Alternative:** Use `/owner/dashboard/maintenance` for viewing and managing tenant-submitted requests
