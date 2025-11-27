# Testing Checklist

Use this checklist to verify all features are working correctly.

---

## 🔐 Authentication Testing

### Registration
- [ ] Open the application
- [ ] Click "Register" tab
- [ ] Try username with 2 characters → Should show error
- [ ] Try password with 5 characters → Should show error
- [ ] Enter valid username (3+ chars) and password (6+ chars)
- [ ] Click "Create Account" → Should succeed
- [ ] Try same username again → Should show "Username already exists"

### Login
- [ ] Click "Login" tab
- [ ] Enter wrong password → Should show "Invalid username or password"
- [ ] Enter correct credentials → Should login successfully
- [ ] Should redirect to Data Hub page

### Session
- [ ] After login, check sidebar shows your username
- [ ] Reload page → Should stay logged in
- [ ] Click Logout → Should return to login page
- [ ] Try accessing main pages → Should redirect to login

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## 📊 AI Query History Testing

### Saving Queries
- [ ] Login to the application
- [ ] Navigate to "AI Analyst" page
- [ ] Ask a question: "show all sensors"
- [ ] Check right sidebar → Query should appear
- [ ] Ask another question: "find temperature above 50"
- [ ] Check sidebar → Both queries should be visible
- [ ] Reload the page → Queries should still be there

### History Display
- [ ] Check that queries show timestamp
- [ ] Check that successful queries have "Success" badge (blue)
- [ ] Check that queries are ordered by most recent first
- [ ] Ask 10+ questions
- [ ] Verify only last 10 are shown

### Reusing Queries
- [ ] Click on a history item
- [ ] Check that question appears in input box
- [ ] Submit the query
- [ ] Verify it executes correctly

### Refresh Button
- [ ] Click refresh button (↻) in history header
- [ ] Verify history reloads
- [ ] Check loading state appears briefly

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## 🛡️ Security Testing

### Malicious Pattern Detection

#### Test 1: Drop Database
- [ ] Enter query: "drop database streamwatch"
- [ ] Click "Execute Query"
- [ ] Should show RED error box
- [ ] Should say "Query Blocked"
- [ ] Should show reason: "Attempted to drop database/collection"
- [ ] Check history sidebar → Should show as "Blocked" (red badge)

#### Test 2: Delete Collection
- [ ] Enter query: "delete all collections"
- [ ] Click "Execute Query"
- [ ] Should be blocked with specific reason

#### Test 3: $where Operator
- [ ] Enter query: "use $where to find temperature"
- [ ] Click "Execute Query"
- [ ] Should be blocked with reason about $where operator

#### Test 4: Shutdown Command
- [ ] Enter query: "shutdown the database"
- [ ] Click "Execute Query"
- [ ] Should be blocked

#### Test 5: JavaScript Injection
- [ ] Enter query: "eval() function to get data"
- [ ] Click "Execute Query"
- [ ] Should be blocked

### Valid Queries (Should Work)

#### Test 6: Simple Query
- [ ] Enter query: "show all sensor data"
- [ ] Click "Execute Query"
- [ ] Should show results successfully
- [ ] Should display natural language answer
- [ ] Should show generated MongoDB query
- [ ] Should show data results

#### Test 7: Filter Query
- [ ] Enter query: "find temperature above 50"
- [ ] Should work and show filtered results

#### Test 8: Aggregation Query
- [ ] Enter query: "average water level"
- [ ] Should work and show aggregated result

### Blocked Query History
- [ ] Check history sidebar
- [ ] Verify blocked queries show:
  - [ ] Red "Blocked" badge
  - [ ] Block reason text
  - [ ] Red background
  - [ ] Cannot be clicked/reused
  - [ ] Lower opacity (75%)

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## 🎨 UI/UX Testing

### Light Mode
- [ ] Application starts in light mode (or saved preference)
- [ ] Check colors:
  - [ ] Background is white
  - [ ] Sidebar is white
  - [ ] Cards are white with shadows
  - [ ] Text is dark gray/black
  - [ ] Accent color is blue
  - [ ] Borders are light gray

### Dark Mode
- [ ] Click theme toggle button in sidebar
- [ ] Should switch to dark mode smoothly
- [ ] Check colors:
  - [ ] Background is dark gray/black
  - [ ] Sidebar is dark gray
  - [ ] Cards are dark with shadows
  - [ ] Text is white/light gray
  - [ ] Accent color is blue
  - [ ] Borders are dark gray

### Theme Persistence
- [ ] Switch to dark mode
- [ ] Reload page
- [ ] Should stay in dark mode
- [ ] Switch to light mode
- [ ] Reload page
- [ ] Should stay in light mode

### Icons (No Emojis)
- [ ] Check login page → Icon badge (no emoji)
- [ ] Check sidebar navigation → SVG icons (no emojis)
- [ ] Check AI Analyst header → SVG icon (no emoji)
- [ ] Check all buttons → SVG icons where applicable
- [ ] Check status indicators → SVG icons
- [ ] Verify NO emojis anywhere in the UI

### Design Elements
- [ ] Check cards have rounded corners
- [ ] Check cards have shadows
- [ ] Check buttons have gradients
- [ ] Check hover effects work smoothly
- [ ] Check active navigation item has gradient
- [ ] Check loading spinner animates
- [ ] Check transitions are smooth (200ms)

### Responsive Design
- [ ] Resize browser to mobile width
- [ ] Check layout adapts
- [ ] Check all elements are accessible
- [ ] Check text is readable
- [ ] Check buttons are touch-friendly

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## 🔄 Loading States Testing

### Query Execution
- [ ] Enter a query
- [ ] Click "Execute Query"
- [ ] Button should show:
  - [ ] Spinning icon
  - [ ] "Processing Query..." text
  - [ ] Disabled state (grayed out)
  - [ ] Cannot click again

### History Loading
- [ ] Navigate to AI Analyst
- [ ] Check history sidebar shows loading spinner initially
- [ ] After load, spinner disappears
- [ ] History items appear

### Login/Register
- [ ] Submit login form
- [ ] Button should show "Processing..." while loading
- [ ] Should be disabled during processing

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## ❌ Error Handling Testing

### Authentication Errors
- [ ] Try login with wrong password → Clear error message
- [ ] Try register with existing username → Clear error message
- [ ] Try short username → Validation error
- [ ] Try short password → Validation error

### Query Errors
- [ ] Enter invalid query that AI can't parse
- [ ] Should show yellow error box (not red)
- [ ] Should show helpful error message
- [ ] Should not crash the application

### Network Errors
- [ ] Stop backend server
- [ ] Try to execute query
- [ ] Should show error message
- [ ] Should not crash frontend

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## 🎯 Feature Integration Testing

### Complete User Flow
- [ ] Start application (both backend and frontend)
- [ ] Register new account
- [ ] Login with new account
- [ ] Navigate to AI Analyst
- [ ] Ask 3 different questions
- [ ] Check all 3 appear in history
- [ ] Try 1 malicious query
- [ ] Check it appears as blocked in history
- [ ] Click on a successful history item
- [ ] Reuse the query
- [ ] Toggle to dark mode
- [ ] Reload page (should stay dark)
- [ ] Toggle back to light mode
- [ ] Logout
- [ ] Login again
- [ ] Check history is still there

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## 📱 Cross-Browser Testing

### Chrome
- [ ] All features work
- [ ] UI renders correctly
- [ ] Animations smooth

### Firefox
- [ ] All features work
- [ ] UI renders correctly
- [ ] Animations smooth

### Safari
- [ ] All features work
- [ ] UI renders correctly
- [ ] Animations smooth

### Edge
- [ ] All features work
- [ ] UI renders correctly
- [ ] Animations smooth

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## 🗄️ Database Testing

### MongoDB Collections
- [ ] Open MongoDB Compass or Atlas
- [ ] Check `users` collection exists
- [ ] Check user document has:
  - [ ] username
  - [ ] password
  - [ ] createdAt
  - [ ] lastLogin
- [ ] Check `query_history` collection exists
- [ ] Check query document has:
  - [ ] username
  - [ ] question
  - [ ] mongoQuery
  - [ ] result (limited)
  - [ ] naturalAnswer
  - [ ] timestamp
  - [ ] blocked (boolean)
  - [ ] blockReason (if blocked)

### Data Persistence
- [ ] Create user → Check in database
- [ ] Execute query → Check in query_history
- [ ] Execute blocked query → Check blocked=true
- [ ] Restart backend → Data still there
- [ ] Restart frontend → Data still there

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## 🔍 Code Quality Checks

### No Console Errors
- [ ] Open browser DevTools console
- [ ] Navigate through all pages
- [ ] Execute queries
- [ ] Toggle theme
- [ ] Check NO red errors in console
- [ ] Warnings are acceptable

### No Syntax Errors
- [ ] Run: `cd backend && node --check server.js`
- [ ] Should show no errors
- [ ] Frontend builds without errors

### API Responses
- [ ] Open Network tab in DevTools
- [ ] Execute query
- [ ] Check response status is 200 (success) or 403 (blocked)
- [ ] Check response has proper JSON structure
- [ ] Check no 500 errors

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## 📊 Performance Testing

### Load Times
- [ ] Initial page load < 2 seconds
- [ ] Query execution < 3 seconds
- [ ] History load < 1 second
- [ ] Theme switch instant
- [ ] Navigation instant

### Smooth Animations
- [ ] No janky transitions
- [ ] Hover effects smooth
- [ ] Loading spinners smooth
- [ ] Theme switch smooth

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## 📝 Documentation Testing

### README
- [ ] Instructions are clear
- [ ] All links work
- [ ] Code examples are correct

### Quick Start Guide
- [ ] Can follow steps successfully
- [ ] All commands work
- [ ] Application starts correctly

### Other Documentation
- [ ] UPGRADE_NOTES.md is accurate
- [ ] CHANGES_SUMMARY.md is complete
- [ ] DESIGN_SYSTEM.md matches implementation

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## ✅ Final Verification

### All Features Working
- [ ] User authentication ✅
- [ ] Query history (last 10) ✅
- [ ] Malicious query detection ✅
- [ ] Professional UI ✅
- [ ] Dark/Light modes ✅
- [ ] No emojis ✅
- [ ] Elegant design ✅

### Production Ready
- [ ] No critical bugs
- [ ] All tests passed
- [ ] Documentation complete
- [ ] Code is clean
- [ ] Security implemented
- [ ] Ready for bcrypt integration

---

## 📋 Test Results Summary

```
Total Tests: ___
Passed: ___
Failed: ___
Not Tested: ___

Pass Rate: ___%
```

### Critical Issues Found
```
1. 
2. 
3. 
```

### Minor Issues Found
```
1. 
2. 
3. 
```

### Recommendations
```
1. 
2. 
3. 
```

---

## 🎉 Sign Off

**Tested By:** _______________
**Date:** _______________
**Status:** ⬜ Approved | ⬜ Needs Work

**Notes:**
```




```

---

Use this checklist to systematically verify all features are working as expected!
