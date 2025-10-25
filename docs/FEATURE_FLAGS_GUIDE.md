# Feature Flags Guide

## Overview
Feature flags allow you to enable/disable features without changing code. This is especially useful for performance optimization during development.

---

## 🎛️ Configuration File

**Location**: `config/features.ts`

```typescript
export const FEATURE_FLAGS = {
  REALTIME_NOTIFICATIONS: false,  // ⚠️ Currently DISABLED
  REALTIME_MESSAGES: false,       // ⚠️ Currently DISABLED
  AUTO_REFRESH_INTERVAL: 30000,
  SHOW_CONNECTION_STATUS: false,
  ENABLE_TOAST_NOTIFICATIONS: true,
  DEBUG_MODE: false
};
```

---

## 🚫 Real-time Features (Currently Disabled)

### **Why Disabled?**
Real-time subscriptions are **query-heavy** and can impact performance:
- Constant database polling
- Multiple WebSocket connections
- High bandwidth usage
- Increased Supabase costs

### **What's Affected:**

#### **1. Real-time Notifications** (`REALTIME_NOTIFICATIONS: false`)
**When Enabled:**
- ✅ Notifications update instantly
- ✅ Toast popups for urgent notifications
- ✅ Live badge count updates
- ❌ High query load

**When Disabled (Current):**
- ✅ Notifications load on page refresh
- ✅ No constant database polling
- ✅ Better performance
- ❌ No instant updates

#### **2. Real-time Messages** (`REALTIME_MESSAGES: false`)
**When Enabled:**
- ✅ Messages update instantly
- ✅ Toast popups for new messages
- ✅ Live unread count
- ❌ High query load

**When Disabled (Current):**
- ✅ Messages load on page refresh
- ✅ No constant database polling
- ✅ Better performance
- ❌ No instant updates

---

## 🔧 How to Enable/Disable

### **Option 1: Edit Config File** (Recommended)

**File**: `config/features.ts`

```typescript
// Enable real-time notifications
export const FEATURE_FLAGS = {
  REALTIME_NOTIFICATIONS: true,  // ✅ Changed to true
  REALTIME_MESSAGES: true,       // ✅ Changed to true
  // ... other flags
};
```

**Note**: Requires app restart (refresh browser)

### **Option 2: Environment Variables** (Future Enhancement)

```env
# .env.local
NEXT_PUBLIC_REALTIME_NOTIFICATIONS=true
NEXT_PUBLIC_REALTIME_MESSAGES=true
```

---

## 📊 Performance Impact

### **With Real-time Enabled:**
```
Database Queries per Minute: ~60-120
WebSocket Connections: 2-4
Bandwidth Usage: High
Supabase Cost: Higher
User Experience: Instant updates
```

### **With Real-time Disabled (Current):**
```
Database Queries per Minute: ~2-5
WebSocket Connections: 0
Bandwidth Usage: Low
Supabase Cost: Lower
User Experience: Manual refresh needed
```

---

## 🎯 Recommended Settings

### **For Development:**
```typescript
REALTIME_NOTIFICATIONS: false,  // ✅ Disabled
REALTIME_MESSAGES: false,       // ✅ Disabled
AUTO_REFRESH_INTERVAL: 0,       // Manual refresh only
SHOW_CONNECTION_STATUS: false,
ENABLE_TOAST_NOTIFICATIONS: true,
DEBUG_MODE: true
```

**Benefits:**
- ✅ Faster development
- ✅ Lower database load
- ✅ Easier debugging
- ✅ No query limits hit

### **For Production:**
```typescript
REALTIME_NOTIFICATIONS: true,   // ✅ Enabled
REALTIME_MESSAGES: true,        // ✅ Enabled
AUTO_REFRESH_INTERVAL: 30000,   // 30 seconds
SHOW_CONNECTION_STATUS: false,
ENABLE_TOAST_NOTIFICATIONS: true,
DEBUG_MODE: false
```

**Benefits:**
- ✅ Best user experience
- ✅ Instant updates
- ✅ Professional feel
- ⚠️ Higher costs

---

## 🔄 How It Works

### **Code Implementation:**

**File**: `components/layout/top-navbar.tsx`

```typescript
// Conditionally use real-time or static data
const {
  notifications,
  stats: notificationStats,
  // ...
} = FEATURE_FLAGS.REALTIME_NOTIFICATIONS
  ? useRealtimeNotifications({...})  // ✅ Real-time hook
  : {                                 // ❌ Static fallback
      notifications: [],
      stats: { unread_notifications: 0, ... },
      isConnected: false,
      // ...
    };
```

### **When Disabled:**
- Returns empty data structures
- No database subscriptions
- No WebSocket connections
- Functions are no-ops (do nothing)

### **When Enabled:**
- Subscribes to database changes
- Opens WebSocket connections
- Updates UI in real-time
- Shows toast notifications

---

## 🧪 Testing

### **Test 1: Verify Disabled State**
1. Check `config/features.ts`
2. Confirm `REALTIME_NOTIFICATIONS: false`
3. Confirm `REALTIME_MESSAGES: false`
4. Open browser DevTools → Network tab
5. ✅ No WebSocket connections
6. ✅ No constant polling

### **Test 2: Enable Real-time**
1. Edit `config/features.ts`
2. Set `REALTIME_NOTIFICATIONS: true`
3. Save and refresh browser
4. Open DevTools → Network tab
5. ✅ See WebSocket connection
6. ✅ Notifications update instantly

### **Test 3: Performance Comparison**
```
Disabled:
- Open DevTools → Network
- Count requests in 1 minute
- Should be: ~2-5 requests

Enabled:
- Open DevTools → Network
- Count requests in 1 minute
- Should be: ~60-120 requests
```

---

## 📝 Current Status

### **✅ Currently Disabled:**
- Real-time Notifications
- Real-time Messages
- Connection Status Indicators

### **✅ Currently Enabled:**
- Toast Notifications (for manual actions)
- Manual Refresh
- Static Data Loading

### **📍 Where Used:**
- `components/layout/top-navbar.tsx` (lines 64-99, 132-166)
- Navbar notification bell
- Navbar message icon

---

## 🚀 Future Enhancements

### **1. Auto-refresh When Disabled:**
```typescript
// Refresh every 30 seconds when real-time is off
useEffect(() => {
  if (!FEATURE_FLAGS.REALTIME_NOTIFICATIONS && FEATURE_FLAGS.AUTO_REFRESH_INTERVAL > 0) {
    const interval = setInterval(() => {
      loadNotifications();
    }, FEATURE_FLAGS.AUTO_REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }
}, []);
```

### **2. Hybrid Mode:**
```typescript
// Real-time for critical updates, polling for others
REALTIME_URGENT_ONLY: true,  // Only subscribe to high-priority
POLLING_INTERVAL: 60000,     // Poll for normal updates
```

### **3. User Preference:**
```typescript
// Let users choose in settings
const userPreference = await getUserSettings();
const useRealtime = userPreference.enableRealtime ?? FEATURE_FLAGS.REALTIME_NOTIFICATIONS;
```

---

## 💡 Tips

### **When to Enable Real-time:**
- ✅ Production environment
- ✅ Demo/presentation
- ✅ User testing
- ✅ When budget allows

### **When to Keep Disabled:**
- ✅ Local development
- ✅ Testing workflows
- ✅ Low budget
- ✅ High user count (cost optimization)

### **Monitoring:**
Check Supabase dashboard for:
- Database connections
- Query count
- Bandwidth usage
- Real-time subscribers

---

## 🐛 Troubleshooting

### **Issue: Changes Not Taking Effect**
**Solution**: Hard refresh browser (Ctrl + Shift + R)

### **Issue: Still Seeing WebSocket Connections**
**Solution**: 
1. Check `config/features.ts`
2. Confirm flags are `false`
3. Clear browser cache
4. Restart dev server

### **Issue: Notifications Not Loading**
**Solution**:
- Real-time disabled = Manual refresh needed
- Click refresh button or reload page
- Check console for errors

---

## 📊 Cost Comparison

### **Supabase Free Tier Limits:**
- Database: 500 MB
- Bandwidth: 5 GB
- Real-time: 200 concurrent connections
- API Requests: 500,000/month

### **With Real-time Enabled:**
```
100 users × 2 connections = 200 connections (at limit!)
100 users × 60 queries/min × 60 min × 24 hrs = 8.6M queries/day
```
**Risk**: Hit limits quickly ⚠️

### **With Real-time Disabled:**
```
100 users × 0 connections = 0 connections ✅
100 users × 5 queries/min × 60 min × 24 hrs = 720K queries/day
```
**Safe**: Well within limits ✅

---

## Summary

### **Current Configuration:**
- ❌ Real-time Notifications: **DISABLED**
- ❌ Real-time Messages: **DISABLED**
- ✅ Manual Refresh: **ENABLED**
- ✅ Toast Notifications: **ENABLED**

### **Benefits:**
- ✅ Better performance
- ✅ Lower costs
- ✅ No query limits
- ✅ Easier development

### **Trade-offs:**
- ❌ No instant updates
- ❌ Manual refresh needed
- ❌ Less "real-time" feel

### **To Enable:**
Edit `config/features.ts` and set flags to `true`

---

**Date**: October 25, 2025  
**Status**: Real-time features disabled for performance  
**Recommendation**: Keep disabled for development, enable for production demos
