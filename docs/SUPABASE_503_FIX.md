# 🔴 Fix: Supabase 503 Error

## **Error: Service Unavailable (503)**

---

## ⚡ **Quick Fix (90% of cases):**

### **Wake Up Your Supabase Database:**

**Supabase free tier auto-pauses after inactivity!**

1. **Go to:** https://supabase.com/dashboard
2. **Select your project:** `pracvktfoiilhobuzxel`
3. **Click:** SQL Editor
4. **Run this query:**
   ```sql
   SELECT 1;
   ```
5. **Wait:** 10-20 seconds
6. **Refresh your app** - Should work now! ✅

---

## 🔍 **Check If Supabase is Really Down:**

### **Test 1: Visit Your Supabase URL**
Open in browser:
```
https://pracvktfoiilhobuzxel.supabase.co/rest/v1/
```

**If you see:**
- ✅ `{"message":"..."}`  → Database is awake
- ❌ `503 Service Unavailable` → Database is sleeping

### **Test 2: Check Supabase Status**
Visit: https://status.supabase.com

**If there's an outage:**
- Wait for Supabase to fix it
- Check their status page for updates

---

## 🛠️ **Other Possible Causes:**

### **Cause 1: Wrong Supabase URL**
Check `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://pracvktfoiilhobuzxel.supabase.co
```

### **Cause 2: Wrong API Keys**
Check `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### **Cause 3: Network Issues**
- Check your internet connection
- Try a different network
- Disable VPN if using one

### **Cause 4: Rate Limiting**
Supabase free tier has limits:
- Refresh the page
- Wait a few minutes
- Upgrade plan if hitting limits often

---

## ✅ **Prevention:**

### **Keep Database Awake (Free Tier):**

**Option 1: Use Database Regularly**
- Just log in daily
- Database stays awake with activity

**Option 2: Upgrade to Pro**
- $25/month
- Never pauses
- Better performance

**Option 3: Ping Script (Advanced)**
Create a cron job that pings your database every hour:
```bash
# Keep database awake
*/60 * * * * curl https://pracvktfoiilhobuzxel.supabase.co/rest/v1/
```

---

## 🧪 **Test Connection:**

Run this in your browser console:
```javascript
fetch('https://pracvktfoiilhobuzxel.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'your_anon_key_here'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**Expected:** Should return data or message
**If 503:** Database is sleeping

---

## 📝 **Summary:**

**Problem:** Supabase 503 Service Unavailable  
**Cause:** Free tier database auto-pauses  
**Solution:** Wake it up via SQL Editor  
**Prevention:** Use regularly or upgrade  

---

**Try this:**
1. Go to Supabase Dashboard
2. Open SQL Editor
3. Run `SELECT 1;`
4. Wait 20 seconds
5. Refresh your app

**Should work now!** ✅
