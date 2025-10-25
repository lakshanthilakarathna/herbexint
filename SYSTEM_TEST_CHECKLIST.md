# HERB Liquor Wholesale - System Test Checklist

## 📋 Pre-Test Setup

### System Requirements
- ✅ Browser: Chrome, Firefox, Safari, or Edge (latest version)
- ✅ Server running at: http://localhost:8080 or http://localhost:8081
- ✅ JavaScript enabled
- ✅ Cookies/localStorage enabled

### Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@herb.com | password123 |
| **Sales Rep 1** | sales1@herb.com | password123 |
| **Sales Rep 2** | sales2@herb.com | password123 |

### Before Starting
- [ ] Server is running (`npm run dev`)
- [ ] Browser console is open (F12) to check for errors
- [ ] Clear localStorage if needed: `localStorage.clear()` in console

---

## ⚡ Quick Health Check (5 Minutes)

**Purpose:** Verify essential functions are working

### Test 1: Login System
- [ ] Navigate to http://localhost:8080
- [ ] Login page displays HERB logo
- [ ] Login with admin@herb.com / password123
- [ ] **PASS:** Redirects to Dashboard
- [ ] **FAIL:** Shows error or doesn't redirect

### Test 2: Dashboard Loads
- [ ] Dashboard displays welcome message
- [ ] Stats cards show numbers (Orders, Revenue, Customers, Products)
- [ ] Recent orders table visible
- [ ] No console errors
- [ ] **PASS:** All elements visible
- [ ] **FAIL:** Missing elements or errors

### Test 3: View Products
- [ ] Click "Products" in sidebar
- [ ] Products list loads
- [ ] Can see product categories (Liquor, Beer, Wine, Spirits)
- [ ] **PASS:** Products display correctly
- [ ] **FAIL:** Empty or error

### Test 4: Create Order
- [ ] Click "Orders" in sidebar
- [ ] Click "Create Order" button
- [ ] Dialog opens with customer selection
- [ ] **PASS:** Can open order creation
- [ ] **FAIL:** Dialog doesn't open

### Test 5: Logout
- [ ] Click logout button
- [ ] Returns to login page
- [ ] **PASS:** Logged out successfully
- [ ] **FAIL:** Still on dashboard

**Quick Check Result:** ___/5 Tests Passed

---

## 🔍 Full System Test (30 Minutes)

### 1. Authentication & Authorization

#### 1.1 Admin Login
- [ ] Go to login page
- [ ] Enter: admin@herb.com / password123
- [ ] Click "Sign in"
- [ ] **Expected:** Redirects to dashboard
- [ ] **Expected:** Shows "Admin User" and "System Administrator" badge
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 1.2 Sales Rep Login
- [ ] Logout if logged in
- [ ] Enter: sales1@herb.com / password123
- [ ] Click "Sign in"
- [ ] **Expected:** Redirects to dashboard
- [ ] **Expected:** Shows "Sales Rep 1" and "Sales Representative" badge
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 1.3 Invalid Login
- [ ] Logout
- [ ] Enter: wrong@email.com / wrongpassword
- [ ] Click "Sign in"
- [ ] **Expected:** Shows error message "Invalid email or password"
- [ ] **Expected:** Stays on login page
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 1.4 Logout Function
- [ ] Login as any user
- [ ] Click logout button in sidebar (desktop) or header (mobile)
- [ ] **Expected:** Returns to login page
- [ ] **Expected:** Cannot access dashboard without login
- [ ] **Result:** ✅ Pass / ❌ Fail

---

### 2. Dashboard

#### 2.1 Admin Dashboard View
- [ ] Login as admin@herb.com
- [ ] Navigate to Dashboard
- [ ] **Expected:** See 4 stat cards (Orders, Revenue, Customers, Products)
- [ ] **Expected:** Revenue card shows total amount
- [ ] **Expected:** Stock alerts visible (if any low stock)
- [ ] **Expected:** Recent orders table shows all orders
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 2.2 Sales Rep Dashboard View
- [ ] Login as sales1@herb.com
- [ ] Navigate to Dashboard
- [ ] **Expected:** See stat cards (Orders, Customers, Products)
- [ ] **Expected:** Revenue card NOT visible or shows "N/A"
- [ ] **Expected:** Recent orders shows ONLY this rep's orders
- [ ] **Expected:** Stock alerts NOT visible
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 2.3 Dashboard Stats Update
- [ ] Note current order count
- [ ] Create a new order (see Orders section)
- [ ] Return to dashboard
- [ ] **Expected:** Order count increased by 1
- [ ] **Expected:** Revenue updated (if admin)
- [ ] **Result:** ✅ Pass / ❌ Fail

---

### 3. Products Management

#### 3.1 View Products List
- [ ] Login as admin
- [ ] Click "Products" in sidebar
- [ ] **Expected:** Products table displays
- [ ] **Expected:** Shows columns: Brand, Product, Category, Prices, Stock, Actions
- [ ] **Expected:** Can see product categories with colored badges
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 3.2 Search Products
- [ ] In Products page, use search box
- [ ] Type a product name or brand
- [ ] **Expected:** List filters to matching products
- [ ] **Expected:** Updates in real-time as you type
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 3.3 Filter by Category
- [ ] Click category filter dropdown
- [ ] Select "Liquor" or "Beer"
- [ ] **Expected:** Shows only products in that category
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 3.4 Create New Product
- [ ] Click "Add Product" button
- [ ] Fill in required fields:
  - Brand Name: "Test Brand"
  - Product Name: "Test Product"
  - Category: "Liquor"
  - Wholesale Price: 1000
  - Cost Price: 800
  - Retail Price: 1200
  - Stock: 100
- [ ] Click "Create Product"
- [ ] **Expected:** Success toast message
- [ ] **Expected:** Product appears in list
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 3.5 Edit Product
- [ ] Click edit icon on any product
- [ ] Change product name
- [ ] Change stock quantity
- [ ] Click "Save Changes"
- [ ] **Expected:** Success toast message
- [ ] **Expected:** Changes reflected in list
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 3.6 Delete Product (Admin Only)
- [ ] Login as admin
- [ ] Click delete icon on test product
- [ ] Confirm deletion
- [ ] **Expected:** Success toast message
- [ ] **Expected:** Product removed from list
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 3.7 CSV Bulk Import
- [ ] Click "Bulk Import" button
- [ ] Paste CSV data (use example format):
  ```
  Arrack,Premium Arrack 750ml,12,1200,800,1500,1+1 offer,Premium toddy,500,HerbDistillery
  ```
- [ ] Click "Import Products"
- [ ] **Expected:** Success message with count
- [ ] **Expected:** Products added to list
- [ ] **Result:** ✅ Pass / ❌ Fail

---

### 4. Customer Management

#### 4.1 View Customers List
- [ ] Click "Customers" in sidebar
- [ ] **Expected:** Customers table displays
- [ ] **Expected:** Shows: Name, Email, Phone, Type, Address, Actions
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 4.2 Search Customers
- [ ] Use search box
- [ ] Type customer name or email
- [ ] **Expected:** List filters to matching customers
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 4.3 Filter by Customer Type
- [ ] Click type filter dropdown
- [ ] Select "Bar" or "Restaurant"
- [ ] **Expected:** Shows only customers of that type
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 4.4 Create New Customer
- [ ] Click "Add Customer" button
- [ ] Fill in:
  - Name: "Test Bar"
  - Email: "test@bar.com"
  - Phone: "+94 77 123 4567"
  - Type: "Bar"
  - Address: "123 Test Street"
- [ ] Click "Create Customer"
- [ ] **Expected:** Success toast
- [ ] **Expected:** Customer appears in list
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 4.5 Edit Customer
- [ ] Click edit icon on any customer
- [ ] Change name and phone
- [ ] Click "Save Changes"
- [ ] **Expected:** Success toast
- [ ] **Expected:** Changes reflected
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 4.6 View Customer Details
- [ ] Click view/eye icon on any customer
- [ ] **Expected:** Dialog shows all customer information
- [ ] **Expected:** Can see order history (if any)
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 4.7 Delete Customer (Admin Only)
- [ ] Login as admin
- [ ] Click delete icon on test customer
- [ ] Confirm deletion
- [ ] **Expected:** Success toast
- [ ] **Expected:** Customer removed
- [ ] **Result:** ✅ Pass / ❌ Fail

---

### 5. Order Management

#### 5.1 View Orders List
- [ ] Click "Orders" in sidebar
- [ ] **Expected:** Orders table displays
- [ ] **Expected:** Shows: Order #, Customer, Amount, Status, Date, Actions
- [ ] **Expected:** Admin sees all orders, Sales Rep sees only their own
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 5.2 Filter Orders by Status
- [ ] Click status filter dropdown
- [ ] Select "Pending" or "Approved"
- [ ] **Expected:** Shows only orders with that status
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 5.3 Create Order with GPS Location
- [ ] Click "Create Order" button
- [ ] Select a customer
- [ ] Add products (search and select)
- [ ] Set quantities
- [ ] Add notes (optional)
- [ ] Click "Create Order"
- [ ] **Expected:** Browser asks for location permission
- [ ] **Expected:** Toast shows "Getting your location..."
- [ ] **Expected:** Toast shows "Location captured: [address]" OR "Location not available"
- [ ] **Expected:** Success toast "Order created"
- [ ] **Expected:** Order appears in list with MapPin icon if location captured
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 5.4 View Order Details
- [ ] Click view/eye icon on any order
- [ ] **Expected:** Dialog shows complete order info
- [ ] **Expected:** Shows customer, items, total, status
- [ ] **Expected:** If location captured, shows address and Google Maps link
- [ ] **Expected:** Can click Google Maps link to view location
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 5.5 Edit Order
- [ ] Click edit icon on own order (Sales Rep) or any order (Admin)
- [ ] Add/remove products
- [ ] Change quantities
- [ ] Update notes
- [ ] Click "Save Changes"
- [ ] **Expected:** Success toast
- [ ] **Expected:** Stock quantities adjusted automatically
- [ ] **Expected:** Changes reflected in list
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 5.6 Change Order Status (Admin Only)
- [ ] Login as admin
- [ ] Find a "Pending" order
- [ ] Click approve (checkmark) button
- [ ] **Expected:** Status changes to "Approved"
- [ ] **Expected:** Success toast
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 5.7 Cancel Order (Stock Restoration)
- [ ] Note product stock before cancelling
- [ ] Change order status to "Cancelled"
- [ ] **Expected:** Toast shows "Stock restored"
- [ ] **Expected:** Product stock increased back
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 5.8 Delete Order
- [ ] Click delete icon on any order
- [ ] Confirm deletion
- [ ] **Expected:** Success toast "Stock restored"
- [ ] **Expected:** Order removed from list
- [ ] **Expected:** Product stock quantities restored
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 5.9 Stock Auto-Update on Order Creation
- [ ] Note a product's stock quantity
- [ ] Create order with 5 units of that product
- [ ] Go to Products page
- [ ] **Expected:** Stock reduced by 5
- [ ] **Result:** ✅ Pass / ❌ Fail

---

### 6. Inventory Management

#### 6.1 View Inventory
- [ ] Click "Inventory" in sidebar
- [ ] **Expected:** Inventory table displays
- [ ] **Expected:** Shows: Product, Stock, Status, Expiry, Batch
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 6.2 Stock Alerts (Admin Only)
- [ ] Login as admin
- [ ] Check Dashboard for stock alerts
- [ ] **Expected:** Shows products with low stock (< 50 units)
- [ ] **Expected:** Alert badge shows count
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 6.3 Filter by Stock Status
- [ ] In Inventory page, use status filter
- [ ] Select "Low Stock" or "Out of Stock"
- [ ] **Expected:** Shows only products matching criteria
- [ ] **Result:** ✅ Pass / ❌ Fail

---

### 7. User Management

#### 7.1 View Users List (Admin Only)
- [ ] Login as admin
- [ ] Click "Users" in sidebar
- [ ] **Expected:** Users table displays
- [ ] **Expected:** Shows: Admin + 2 Sales Reps
- [ ] **Expected:** Shows: Name, Email, Phone, Role, Status, Actions
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 7.2 Search Users
- [ ] Use search box
- [ ] Type user name or email
- [ ] **Expected:** List filters to matching users
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 7.3 Create New Sales Rep
- [ ] Click "Add Sales Rep" button
- [ ] Fill in:
  - Name: "Test Sales Rep"
  - Email: "test@herb.com"
  - Phone: "+94 77 999 8888"
  - Password: "test123"
  - Confirm Password: "test123"
- [ ] Click "Create Sales Rep"
- [ ] **Expected:** Success toast
- [ ] **Expected:** User appears in list
- [ ] **Expected:** Can login with new credentials
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 7.4 View User Details
- [ ] Click view/eye icon on any user
- [ ] **Expected:** Dialog shows user info and permissions
- [ ] **Expected:** Shows role badge
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 7.5 Edit User
- [ ] Click edit icon on a sales rep (not admin)
- [ ] Change name and phone
- [ ] Click "Save Changes"
- [ ] **Expected:** Success toast
- [ ] **Expected:** Changes reflected
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 7.6 Delete User
- [ ] Click delete icon on test sales rep
- [ ] Confirm deletion
- [ ] **Expected:** Success toast
- [ ] **Expected:** User removed
- [ ] **Expected:** Cannot delete default users (Admin, Sales Rep 1, Sales Rep 2)
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 7.7 Users Menu Hidden for Sales Rep
- [ ] Login as sales1@herb.com
- [ ] Check sidebar menu
- [ ] **Expected:** "Users" menu item NOT visible
- [ ] **Expected:** Cannot access /users URL directly
- [ ] **Result:** ✅ Pass / ❌ Fail

---

### 8. System Logs

#### 8.1 View System Logs (Admin Only)
- [ ] Login as admin
- [ ] Click "Logs" in sidebar
- [ ] **Expected:** Logs table displays
- [ ] **Expected:** Shows: Timestamp, User, Action, Resource, Details
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 8.2 Filter Logs by Action Type
- [ ] Use action filter dropdown
- [ ] Select "Create" or "Update"
- [ ] **Expected:** Shows only logs of that action type
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 8.3 Filter Logs by Resource
- [ ] Use resource filter dropdown
- [ ] Select "Order" or "Product"
- [ ] **Expected:** Shows only logs for that resource type
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 8.4 Verify Logging Works
- [ ] Create a new product
- [ ] Go to System Logs
- [ ] **Expected:** See new log entry for product creation
- [ ] **Expected:** Shows your user email
- [ ] **Expected:** Shows timestamp
- [ ] **Result:** ✅ Pass / ❌ Fail

---

### 9. Permissions & Role-Based Access

#### 9.1 Admin Full Access
- [ ] Login as admin@herb.com
- [ ] **Expected:** Can access: Dashboard, Orders, Customers, Products, Inventory, Users, Logs
- [ ] **Expected:** Can see all orders (from all sales reps)
- [ ] **Expected:** Can see revenue data
- [ ] **Expected:** Can delete customers, products, orders
- [ ] **Expected:** Can approve/reject orders
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 9.2 Sales Rep Limited Access
- [ ] Login as sales1@herb.com
- [ ] **Expected:** Can access: Dashboard, Orders, Customers, Products, Inventory
- [ ] **Expected:** CANNOT access: Users, Logs
- [ ] **Expected:** Can see only own orders
- [ ] **Expected:** Cannot see total revenue (shows N/A or hidden)
- [ ] **Expected:** Cannot delete customers
- [ ] **Expected:** Cannot approve/reject orders
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 9.3 Sales Rep Cannot Edit Other Rep's Orders
- [ ] Login as sales1@herb.com
- [ ] Create an order
- [ ] Logout
- [ ] Login as sales2@herb.com
- [ ] Go to Orders page
- [ ] **Expected:** Cannot see sales1's order
- [ ] **Expected:** Can only see own orders
- [ ] **Result:** ✅ Pass / ❌ Fail

---

### 10. Edge Cases & Error Handling

#### 10.1 Empty Form Submission
- [ ] Try to create product without required fields
- [ ] Click "Create Product"
- [ ] **Expected:** Error toast "Please fill required fields"
- [ ] **Expected:** Form doesn't submit
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 10.2 Duplicate Email
- [ ] Try to create customer with existing email
- [ ] **Expected:** Error toast or validation message
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 10.3 Invalid Data
- [ ] Try to enter negative stock quantity
- [ ] Try to enter negative price
- [ ] **Expected:** Validation prevents or shows error
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 10.4 GPS Permission Denied
- [ ] Create an order
- [ ] When browser asks for location, click "Deny"
- [ ] **Expected:** Toast shows "Location not available - order will be created without location"
- [ ] **Expected:** Order still created successfully
- [ ] **Expected:** No MapPin icon on order
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 10.5 Network Offline (localStorage)
- [ ] Disconnect from internet
- [ ] Try to create/edit data
- [ ] **Expected:** Everything still works (localStorage)
- [ ] **Expected:** No network errors
- [ ] **Result:** ✅ Pass / ❌ Fail

---

### 11. Mobile Responsiveness

#### 11.1 Mobile Layout
- [ ] Resize browser to mobile width (< 768px) or use device emulator
- [ ] **Expected:** Hamburger menu appears
- [ ] **Expected:** Sidebar hidden by default
- [ ] **Expected:** Tables become scrollable or card-based
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 11.2 Mobile Navigation
- [ ] Click hamburger menu icon
- [ ] **Expected:** Sidebar slides in
- [ ] **Expected:** Can navigate to different pages
- [ ] **Expected:** Sidebar closes after selection
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 11.3 Mobile Forms
- [ ] Try creating order on mobile
- [ ] **Expected:** Form is usable
- [ ] **Expected:** Buttons are touch-friendly
- [ ] **Expected:** Inputs are properly sized
- [ ] **Result:** ✅ Pass / ❌ Fail

#### 11.4 Mobile Tables
- [ ] View Orders or Products on mobile
- [ ] **Expected:** Table scrolls horizontally OR converts to cards
- [ ] **Expected:** All data is accessible
- [ ] **Result:** ✅ Pass / ❌ Fail

---

## 🎯 Test Results Summary

### Quick Health Check
- **Total Tests:** 5
- **Passed:** ___
- **Failed:** ___
- **Pass Rate:** ___%

### Full System Test
- **Total Tests:** 60+
- **Passed:** ___
- **Failed:** ___
- **Pass Rate:** ___%

### Critical Issues Found
1. ___________________________
2. ___________________________
3. ___________________________

### Non-Critical Issues Found
1. ___________________________
2. ___________________________
3. ___________________________

---

## 🔧 Troubleshooting Guide

### Issue: Login doesn't work
**Solutions:**
1. Check browser console for errors (F12)
2. Verify credentials are correct
3. Clear localStorage: `localStorage.clear()` in console
4. Refresh page and try again

### Issue: Dashboard shows no data
**Solutions:**
1. Check if localStorage has data: `localStorage` in console
2. Try creating some test data (products, customers, orders)
3. Check browser console for errors
4. Verify you're logged in as correct user

### Issue: Orders not showing
**Solutions:**
1. Verify you're logged in as correct user
2. Sales Reps only see their own orders
3. Check status filter - set to "All Status"
4. Check search box - clear any search terms

### Issue: GPS location not working
**Solutions:**
1. Check browser location permissions
2. Make sure you're on HTTPS or localhost
3. Allow location when browser prompts
4. If denied, order will still create without location

### Issue: Products/Customers not saving
**Solutions:**
1. Check browser console for errors
2. Verify all required fields are filled
3. Check localStorage quota: `JSON.stringify(localStorage).length`
4. If quota exceeded, clear old data

### Issue: Stock not updating
**Solutions:**
1. Refresh the page
2. Check browser console for errors
3. Verify order was created successfully
4. Check Products page to see current stock

### Issue: Can't delete items
**Solutions:**
1. Verify you're logged in as Admin
2. Sales Reps cannot delete customers
3. Check if item is protected (default users)
4. Check browser console for errors

### Issue: Mobile menu not working
**Solutions:**
1. Resize browser to mobile width (< 768px)
2. Click hamburger menu icon (three lines)
3. Check browser console for errors
4. Try refreshing page

---

## 🗑️ Clear All Data (Reset System)

If you need to start fresh:

1. Open browser console (F12)
2. Run: `localStorage.clear()`
3. Refresh page
4. Login again
5. All data will be reset

**Warning:** This will delete ALL products, customers, orders, and users!

---

## ✅ Testing Best Practices

1. **Test in Order:** Follow the checklist from top to bottom
2. **Document Issues:** Note any failures with details
3. **Check Console:** Always have browser console open
4. **Test Both Roles:** Test as Admin AND Sales Rep
5. **Test Edge Cases:** Try invalid inputs, empty forms, etc.
6. **Test Mobile:** Use device emulator or resize browser
7. **Fresh Start:** Clear localStorage between major test runs
8. **Take Screenshots:** Capture any errors or issues

---

## 📊 Test Coverage

This checklist covers:
- ✅ Authentication (4 tests)
- ✅ Dashboard (3 tests)
- ✅ Products (7 tests)
- ✅ Customers (7 tests)
- ✅ Orders (9 tests)
- ✅ Inventory (3 tests)
- ✅ Users (7 tests)
- ✅ System Logs (4 tests)
- ✅ Permissions (3 tests)
- ✅ Edge Cases (5 tests)
- ✅ Mobile (4 tests)

**Total: 60+ Test Cases**

---

## 📝 Notes

- All tests use localStorage (no backend required)
- GPS location requires browser permission
- Admin has full access, Sales Reps have limited access
- Stock quantities update automatically on orders
- System logs track all major actions
- Mobile responsive design works on all devices

---

**Last Updated:** 2025-01-25
**System Version:** HERB Liquor Wholesale v1.0
**Test Environment:** Localhost (http://localhost:8080)

