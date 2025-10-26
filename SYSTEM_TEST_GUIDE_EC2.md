# 🧪 HERB System Test Guide - EC2 Deployment

## Overview

This comprehensive testing guide covers the EC2-deployed HERB Liquor Wholesale Management System. All tests are designed to work with the live backend API running on AWS EC2.

**🌐 Live System URL:** `http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com`

## 📋 Quick Reference

### Test Accounts
- **Admin:** `admin@herb.com` / `password123`
- **Sales Rep 1:** `sales1@herb.com` (username: `sales1`) / `password123`
- **Sales Rep 2:** `sales2@herb.com` (username: `sales2`) / `password123`

### Test Data
- **Test Product:** "Test Whiskey" (Category: Liquor, Price: Rs. 2,500)
- **Test Customer:** "Test Bar & Grill" (Type: Bar, Phone: 011-1234567)
- **Test Order:** 2x Test Whiskey = Rs. 5,000

---

## 🚀 Quick Smoke Test (10 minutes)

### 1. Backend Health Check
- [ ] Open browser developer tools (F12)
- [ ] Navigate to: `http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com/api/health`
- [ ] Verify response: `{"status":"ok","message":"HERB Backend API is running"}`
- [ ] Check response time < 500ms

### 2. Frontend Load Test
- [ ] Navigate to: `http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com`
- [ ] Verify HERB logo and branding loads
- [ ] Check page loads without errors in console
- [ ] Verify responsive design on mobile/tablet

### 3. Authentication Test
- [ ] Click "Login" button
- [ ] Enter admin credentials: `admin@herb.com` / `password123`
- [ ] Verify successful login and dashboard loads
- [ ] Check user role displays as "System Administrator"

### 4. Basic CRUD Test
- [ ] Navigate to Products page
- [ ] Click "Add Product"
- [ ] Create product: Name="Smoke Test Product", Category="Liquor", Price="1000"
- [ ] Save and verify product appears in list
- [ ] Edit the product and change price to "1500"
- [ ] Verify price update is reflected
- [ ] Delete the test product

### 5. Multi-Device Sync Test
- [ ] Open same URL on different device/browser
- [ ] Login with same admin account
- [ ] Navigate to Products page
- [ ] Verify the test product from step 4 is visible
- [ ] Create a new product on this device
- [ ] Switch back to first device and refresh
- [ ] Verify new product appears

---

## 🔍 Full System Test (45 minutes)

### Authentication & User Management

#### Admin Login Test
- [ ] Login with `admin@herb.com` / `password123`
- [ ] Verify dashboard shows admin-specific features
- [ ] Check user menu shows "System Administrator"
- [ ] Verify all menu items are visible

#### Sales Rep Login Test
- [ ] Logout and login with `sales1@herb.com` / `password123`
- [ ] Verify dashboard shows sales rep features
- [ ] Check user menu shows "Sales Representative"
- [ ] Verify limited menu items (no Users, System Logs)

#### Username Login Test
- [ ] Logout and login with username `sales1` / `password123`
- [ ] Verify same access as email login
- [ ] Test with `sales2` username

#### User Management Test (Admin only)
- [ ] Navigate to Users page
- [ ] Click "Create User"
- [ ] Create new sales rep: Name="Test Rep", Username="testrep", Email="testrep@herb.com"
- [ ] Verify user appears in list
- [ ] Edit user and change name to "Updated Test Rep"
- [ ] Verify update is reflected
- [ ] Delete the test user

### Product Management

#### Product CRUD Test
- [ ] Navigate to Products page
- [ ] Create product with all fields:
  - Product Name: "Premium Whiskey"
  - Brand Name: "Test Brand"
  - Category: "Liquor"
  - Retail Price: "5000"
  - Stock Quantity: "100"
  - Description: "Test description"
- [ ] Save and verify product appears
- [ ] Edit product and change price to "5500"
- [ ] Verify price update
- [ ] Delete the test product

#### Product Categories Test
- [ ] Create products in each category:
  - Liquor (Whiskey)
  - Beer (Lager)
  - Wine (Red Wine)
  - Spirits (Vodka)
  - Other (Mixers)
- [ ] Verify category badges display correctly
- [ ] Test category filtering

#### CSV Import Test
- [ ] Click "Bulk Import" button
- [ ] Download CSV template
- [ ] Fill template with 3 test products
- [ ] Upload CSV file
- [ ] Verify all products imported correctly
- [ ] Delete imported test products

#### Catalog Sharing Test
- [ ] Select 2-3 products
- [ ] Click "Share Catalog"
- [ ] Fill catalog details:
  - Title: "Test Catalog"
  - Company: "Test Company"
  - Expiration: 3 days
- [ ] Generate catalog link
- [ ] Copy link and open in new tab
- [ ] Verify catalog displays correctly
- [ ] Check expiration date is shown

### Customer Management

#### Customer CRUD Test
- [ ] Navigate to Customers page
- [ ] Click "Create Customer"
- [ ] Create customer with all fields:
  - Name: "Test Restaurant"
  - Type: "Restaurant"
  - Email: "test@restaurant.com"
  - Phone: "011-9876543"
  - Address: "123 Test Street, Colombo"
- [ ] Save and verify customer appears
- [ ] Edit customer and change name to "Updated Restaurant"
- [ ] Verify update is reflected
- [ ] Delete the test customer

#### Customer Types Test
- [ ] Create customers of each type:
  - Bar
  - Restaurant
  - Hotel
  - Retail Store
  - Other
- [ ] Verify type badges display correctly
- [ ] Test type filtering

#### Customer Search Test
- [ ] Create 5 test customers with different names
- [ ] Test search by name
- [ ] Test search by phone
- [ ] Test search by email
- [ ] Verify search results are accurate

### Order Management

#### Order Creation Test
- [ ] Navigate to Orders page
- [ ] Click "Create Order"
- [ ] Select customer from dropdown
- [ ] Add products to order:
  - Product 1: Quantity 2, Price 1000
  - Product 2: Quantity 1, Price 2000
- [ ] Verify total calculation (4000)
- [ ] Add order notes: "Test order"
- [ ] Save order
- [ ] Verify order appears in list

#### GPS Location Test
- [ ] Create new order
- [ ] Click "Capture Location" button
- [ ] Allow location access when prompted
- [ ] Verify GPS coordinates are captured
- [ ] Check reverse geocoding shows address
- [ ] Save order with location

#### Order Status Test
- [ ] Create test order
- [ ] Change status from "Pending" to "Processing"
- [ ] Verify status update is reflected
- [ ] Change to "Completed"
- [ ] Verify final status

#### Stock Update Test
- [ ] Note stock quantity of a product
- [ ] Create order with that product
- [ ] Verify stock quantity decreased
- [ ] Cancel the order
- [ ] Verify stock quantity restored

### Reports & Analytics

#### Sales Summary Test
- [ ] Navigate to Reports page
- [ ] Select "Sales Summary" tab
- [ ] Set date range to last 30 days
- [ ] Verify revenue calculations
- [ ] Check order count
- [ ] Verify trend charts load

#### Product Performance Test
- [ ] Select "Product Performance" tab
- [ ] Verify top products list
- [ ] Check revenue by category
- [ ] Verify slow-moving products

#### Stock Status Test
- [ ] Select "Stock Status" tab
- [ ] Verify inventory levels
- [ ] Check low stock alerts
- [ ] Verify out of stock items

#### Sales Rep Performance Test
- [ ] Select "Sales Rep Performance" tab
- [ ] Verify sales rep metrics
- [ ] Check performance comparisons
- [ ] Verify order counts per rep

#### Customer Analytics Test
- [ ] Select "Customer Analytics" tab
- [ ] Verify customer metrics
- [ ] Check customer type breakdown
- [ ] Verify top customers list

#### Financial Analysis Test
- [ ] Select "Financial Analysis" tab
- [ ] Verify revenue calculations
- [ ] Check profit margins
- [ ] Verify cost analysis

### Shared Catalogs

#### Catalog Creation Test
- [ ] Navigate to Shared Catalogs page
- [ ] Click "Create Catalog"
- [ ] Select products for catalog
- [ ] Set catalog details
- [ ] Generate shareable link
- [ ] Verify catalog is created

#### Catalog Viewing Test
- [ ] Copy catalog link
- [ ] Open in new tab/incognito
- [ ] Verify catalog displays correctly
- [ ] Check product information
- [ ] Verify expiration date

#### Catalog Management Test
- [ ] Navigate to Shared Catalogs page
- [ ] View catalog list
- [ ] Test catalog status changes
- [ ] Delete test catalogs

### Customer Portals

#### Portal Creation Test
- [ ] Navigate to Customer Portals page
- [ ] Click "Create Portal"
- [ ] Select customer
- [ ] Set portal details
- [ ] Generate portal URL
- [ ] Verify portal is created

#### Portal Access Test
- [ ] Copy portal URL
- [ ] Open in new tab/incognito
- [ ] Verify portal loads correctly
- [ ] Check customer-specific products
- [ ] Test order placement

### System Logs

#### Log Generation Test
- [ ] Perform various actions (create, update, delete)
- [ ] Navigate to System Logs page
- [ ] Verify actions are logged
- [ ] Check log details and timestamps

#### Log Filtering Test
- [ ] Filter logs by user
- [ ] Filter logs by action
- [ ] Filter logs by date range
- [ ] Verify filter results

### Permissions & Security

#### Role-Based Access Test
- [ ] Login as Sales Rep 1
- [ ] Verify cannot access Users page
- [ ] Verify cannot access System Logs page
- [ ] Verify can access Products, Customers, Orders
- [ ] Verify can access Reports (read-only)

#### Data Isolation Test
- [ ] Login as Sales Rep 1
- [ ] Create test data
- [ ] Login as Sales Rep 2
- [ ] Verify can see shared data
- [ ] Verify cannot see other rep's private data

---

## 🌐 EC2-Specific Tests

### Backend API Health
- [ ] Test health endpoint: `/api/health`
- [ ] Verify response time < 500ms
- [ ] Check response format is JSON
- [ ] Test during peak usage

### Data Persistence
- [ ] Create test data
- [ ] Restart browser
- [ ] Login again
- [ ] Verify data persists
- [ ] Test across different browsers

### Multi-Device Synchronization
- [ ] Create data on Device A
- [ ] Switch to Device B
- [ ] Verify data appears immediately
- [ ] Update data on Device B
- [ ] Switch to Device A and refresh
- [ ] Verify updates are reflected

### Network Error Handling
- [ ] Disconnect internet
- [ ] Try to perform actions
- [ ] Verify error messages
- [ ] Reconnect internet
- [ ] Verify system recovers

### Cache Busting
- [ ] Make changes on one device
- [ ] Switch to another device
- [ ] Verify changes appear without hard refresh
- [ ] Check browser cache headers

---

## 🔧 Troubleshooting Guide

### Common Issues

#### "Failed to load" errors
- **Cause:** Backend API not responding
- **Solution:** Check EC2 instance status, restart backend if needed
- **Command:** `pm2 restart herb-backend`

#### "Cannot read properties of undefined" errors
- **Cause:** Missing data fields in API responses
- **Solution:** Check backend logs, verify data structure
- **Command:** `pm2 logs herb-backend`

#### Login issues
- **Cause:** Incorrect credentials or session expired
- **Solution:** Clear browser cache, try different credentials
- **Test:** Use test accounts provided above

#### Data not syncing
- **Cause:** Browser cache or network issues
- **Solution:** Hard refresh (Ctrl+Shift+R), check network connection
- **Test:** Clear browser cache completely

#### GPS location not working
- **Cause:** Location permission denied or GPS unavailable
- **Solution:** Allow location access, check device GPS settings
- **Test:** Try on different device with GPS enabled

### Performance Issues

#### Slow page loads
- **Check:** Network speed, server load
- **Solution:** Check EC2 instance metrics, consider scaling
- **Test:** Use different network connection

#### High memory usage
- **Check:** Browser memory usage, server memory
- **Solution:** Close unused tabs, restart browser
- **Test:** Monitor with browser dev tools

### Backend Issues

#### API not responding
- **Check:** EC2 instance status
- **Command:** `pm2 status`
- **Solution:** Restart backend service

#### Database errors
- **Check:** Backend logs
- **Command:** `pm2 logs herb-backend`
- **Solution:** Check data.json file permissions

---

## 📊 Test Results Template

### Test Execution Log
```
Date: ___________
Tester: ___________
Browser: ___________
Device: ___________

Quick Smoke Test: ✅/❌
Full System Test: ✅/❌
EC2-Specific Tests: ✅/❌

Issues Found:
1. ________________
2. ________________
3. ________________

Performance Notes:
- Average page load time: _____ms
- API response time: _____ms
- Memory usage: _____MB

Recommendations:
1. ________________
2. ________________
3. ________________
```

### Automated Test Results
- **Backend Health:** ✅/❌
- **API Connectivity:** ✅/❌
- **Data Operations:** ✅/❌
- **Business Logic:** ✅/❌
- **Multi-Device Sync:** ✅/❌
- **Performance:** ✅/❌

---

## 🎯 Success Criteria

### Must Pass (Critical)
- [ ] All authentication tests pass
- [ ] All CRUD operations work
- [ ] Data persists across sessions
- [ ] Multi-device sync works
- [ ] Backend API responds < 500ms

### Should Pass (Important)
- [ ] All reports generate correctly
- [ ] GPS location capture works
- [ ] Catalog sharing functions
- [ ] User permissions enforced
- [ ] Error handling works

### Nice to Have (Optional)
- [ ] Performance is optimal
- [ ] UI is responsive
- [ ] All features documented
- [ ] No console errors
- [ ] Accessibility standards met

---

## 📞 Support Information

### System Information
- **Frontend:** React + Vite + TypeScript
- **Backend:** Node.js + Express
- **Database:** JSON file storage
- **Hosting:** AWS EC2
- **Domain:** ec2-13-41-78-113.eu-west-2.compute.amazonaws.com

### Contact
- **Technical Issues:** Check EC2 instance logs
- **Feature Requests:** Document in test results
- **Bug Reports:** Include browser console logs

### Useful Commands
```bash
# Check backend status
pm2 status

# View backend logs
pm2 logs herb-backend

# Restart backend
pm2 restart herb-backend

# Check system resources
htop

# Check disk space
df -h
```

---

*Last Updated: January 2025*
*Version: 1.0*
*System: HERB Liquor Wholesale Management System - EC2 Deployment*
