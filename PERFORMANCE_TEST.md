# 🚀 HERB Performance Testing Guide

## Overview

This guide provides comprehensive performance testing scenarios for the HERB Liquor Wholesale Management System deployed on AWS EC2. It includes load testing, stress testing, and benchmarking procedures.

**🌐 System URL:** `http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com`

---

## 📊 Performance Benchmarks

### Target Performance Metrics

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| API Response Time | < 200ms | < 500ms | > 1000ms |
| Page Load Time | < 2s | < 5s | > 10s |
| Concurrent Users | 50+ | 20+ | < 10 |
| Memory Usage | < 512MB | < 1GB | > 2GB |
| CPU Usage | < 50% | < 80% | > 95% |
| Database Response | < 100ms | < 300ms | > 500ms |

---

## 🧪 Test Scenarios

### 1. Basic Performance Test

#### Objective
Measure baseline performance of core API endpoints.

#### Test Script
```bash
#!/bin/bash
# basic-performance-test.sh

API_URL="http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com/api"
ITERATIONS=100

echo "🚀 Basic Performance Test"
echo "========================="

# Test health endpoint
echo "Testing health endpoint..."
for i in $(seq 1 $ITERATIONS); do
    start=$(date +%s%3N)
    curl -s "$API_URL/health" > /dev/null
    end=$(date +%s%3N)
    echo "$((end - start))ms"
done | awk '{sum+=$1; count++} END {print "Average: " sum/count "ms"}'

# Test products endpoint
echo "Testing products endpoint..."
for i in $(seq 1 $ITERATIONS); do
    start=$(date +%s%3N)
    curl -s "$API_URL/products" > /dev/null
    end=$(date +%s%3N)
    echo "$((end - start))ms"
done | awk '{sum+=$1; count++} END {print "Average: " sum/count "ms"}'
```

#### Expected Results
- Health endpoint: < 100ms average
- Products endpoint: < 300ms average
- No timeouts or errors

---

### 2. Load Testing

#### Objective
Test system performance under normal expected load.

#### Test Configuration
- **Concurrent Users:** 20
- **Duration:** 5 minutes
- **Ramp-up:** 2 minutes
- **Test Data:** 100 products, 50 customers, 200 orders

#### Test Script
```bash
#!/bin/bash
# load-test.sh

API_URL="http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com/api"
CONCURRENT_USERS=20
DURATION=300  # 5 minutes
RAMP_UP=120   # 2 minutes

echo "🔥 Load Test - $CONCURRENT_USERS concurrent users for $DURATION seconds"
echo "=================================================================="

# Function to simulate user activity
simulate_user() {
    local user_id=$1
    local start_time=$(date +%s)
    local end_time=$((start_time + DURATION))
    
    while [ $(date +%s) -lt $end_time ]; do
        # Random API calls
        case $((RANDOM % 4)) in
            0) curl -s "$API_URL/health" > /dev/null ;;
            1) curl -s "$API_URL/products" > /dev/null ;;
            2) curl -s "$API_URL/customers" > /dev/null ;;
            3) curl -s "$API_URL/orders" > /dev/null ;;
        esac
        
        # Random delay between requests (1-3 seconds)
        sleep $((RANDOM % 3 + 1))
    done
}

# Start concurrent users
for i in $(seq 1 $CONCURRENT_USERS); do
    simulate_user $i &
    echo "Started user $i"
    
    # Ramp up gradually
    if [ $i -lt $CONCURRENT_USERS ]; then
        sleep $((RAMP_UP / CONCURRENT_USERS))
    fi
done

# Wait for all users to complete
wait
echo "Load test completed"
```

#### Expected Results
- All requests complete successfully
- Average response time < 500ms
- No memory leaks or crashes
- System remains responsive

---

### 3. Stress Testing

#### Objective
Determine system breaking point and recovery behavior.

#### Test Configuration
- **Concurrent Users:** 50-100
- **Duration:** 10 minutes
- **Ramp-up:** 1 minute
- **Test Data:** Large datasets (1000+ records)

#### Test Script
```bash
#!/bin/bash
# stress-test.sh

API_URL="http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com/api"
MAX_USERS=100
DURATION=600  # 10 minutes

echo "💥 Stress Test - Up to $MAX_USERS concurrent users for $DURATION seconds"
echo "========================================================================="

# Function to create heavy load
stress_user() {
    local user_id=$1
    local start_time=$(date +%s)
    local end_time=$((start_time + DURATION))
    
    while [ $(date +%s) -lt $end_time ]; do
        # Heavy API operations
        case $((RANDOM % 6)) in
            0) curl -s "$API_URL/products" > /dev/null ;;
            1) curl -s "$API_URL/customers" > /dev/null ;;
            2) curl -s "$API_URL/orders" > /dev/null ;;
            3) curl -s "$API_URL/users" > /dev/null ;;
            4) curl -s "$API_URL/system-logs" > /dev/null ;;
            5) 
                # Create test data
                curl -s -X POST "$API_URL/products" \
                    -H "Content-Type: application/json" \
                    -d '{"product_name":"Stress Test Product","category":"liquor","retail_price":1000}' > /dev/null
                ;;
        esac
        
        # Minimal delay for maximum stress
        sleep 0.1
    done
}

# Gradually increase load
for users in 10 25 50 75 100; do
    echo "Testing with $users concurrent users..."
    
    for i in $(seq 1 $users); do
        stress_user $i &
    done
    
    # Run for 2 minutes at this load level
    sleep 120
    
    # Kill all stress users
    pkill -f "stress_user"
    sleep 10
done

echo "Stress test completed"
```

#### Expected Results
- System handles up to 50+ concurrent users
- Graceful degradation under extreme load
- Automatic recovery after load reduction
- No data corruption

---

### 4. Memory Leak Testing

#### Objective
Identify memory leaks and resource consumption patterns.

#### Test Script
```bash
#!/bin/bash
# memory-test.sh

API_URL="http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com/api"
DURATION=1800  # 30 minutes

echo "🧠 Memory Leak Test - 30 minutes of continuous operation"
echo "========================================================"

# Monitor system resources
monitor_resources() {
    while true; do
        echo "$(date): $(free -m | grep Mem | awk '{print $3}')MB used"
        sleep 30
    done
}

# Start resource monitoring
monitor_resources &
MONITOR_PID=$!

# Continuous API operations
start_time=$(date +%s)
end_time=$((start_time + DURATION))

while [ $(date +%s) -lt $end_time ]; do
    # Mix of read and write operations
    curl -s "$API_URL/health" > /dev/null
    curl -s "$API_URL/products" > /dev/null
    curl -s "$API_URL/customers" > /dev/null
    
    # Create and delete test data
    PRODUCT_ID=$(curl -s -X POST "$API_URL/products" \
        -H "Content-Type: application/json" \
        -d '{"product_name":"Memory Test Product","category":"liquor","retail_price":1000}' | \
        grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$PRODUCT_ID" ]; then
        curl -s -X DELETE "$API_URL/products/$PRODUCT_ID" > /dev/null
    fi
    
    sleep 1
done

# Stop monitoring
kill $MONITOR_PID
echo "Memory test completed"
```

#### Expected Results
- Memory usage remains stable
- No gradual increase in memory consumption
- Garbage collection working properly
- No memory leaks detected

---

### 5. Database Performance Test

#### Objective
Test database operations and query performance.

#### Test Script
```bash
#!/bin/bash
# database-test.sh

API_URL="http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com/api"

echo "🗄️ Database Performance Test"
echo "============================"

# Test CRUD operations performance
test_crud_performance() {
    local operation=$1
    local endpoint=$2
    local data=$3
    local iterations=50
    
    echo "Testing $operation performance..."
    
    local times=()
    for i in $(seq 1 $iterations); do
        start=$(date +%s%3N)
        
        case $operation in
            "CREATE")
                curl -s -X POST "$API_URL/$endpoint" \
                    -H "Content-Type: application/json" \
                    -d "$data" > /dev/null
                ;;
            "READ")
                curl -s "$API_URL/$endpoint" > /dev/null
                ;;
            "UPDATE")
                # Update first record
                curl -s -X PUT "$API_URL/$endpoint/1" \
                    -H "Content-Type: application/json" \
                    -d "$data" > /dev/null
                ;;
            "DELETE")
                # Delete last record
                curl -s -X DELETE "$API_URL/$endpoint/1" > /dev/null
                ;;
        esac
        
        end=$(date +%s%3N)
        times+=($((end - start)))
    done
    
    # Calculate statistics
    local sum=0
    for time in "${times[@]}"; do
        sum=$((sum + time))
    done
    local avg=$((sum / iterations))
    
    local min=${times[0]}
    local max=${times[0]}
    for time in "${times[@]}"; do
        if [ $time -lt $min ]; then min=$time; fi
        if [ $time -gt $max ]; then max=$time; fi
    done
    
    echo "  Average: ${avg}ms"
    echo "  Min: ${min}ms"
    echo "  Max: ${max}ms"
    echo ""
}

# Test data
PRODUCT_DATA='{"product_name":"DB Test Product","category":"liquor","retail_price":1000}'
CUSTOMER_DATA='{"name":"DB Test Customer","type":"bar","email":"test@db.com"}'

# Run tests
test_crud_performance "CREATE" "products" "$PRODUCT_DATA"
test_crud_performance "READ" "products" ""
test_crud_performance "UPDATE" "products" "$PRODUCT_DATA"
test_crud_performance "DELETE" "products" ""

test_crud_performance "CREATE" "customers" "$CUSTOMER_DATA"
test_crud_performance "READ" "customers" ""
test_crud_performance "UPDATE" "customers" "$CUSTOMER_DATA"
test_crud_performance "DELETE" "customers" ""
```

#### Expected Results
- CREATE operations: < 200ms average
- READ operations: < 100ms average
- UPDATE operations: < 150ms average
- DELETE operations: < 100ms average
- No query timeouts

---

### 6. Network Performance Test

#### Objective
Test network latency and bandwidth utilization.

#### Test Script
```bash
#!/bin/bash
# network-test.sh

API_URL="http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com/api"

echo "🌐 Network Performance Test"
echo "==========================="

# Test latency
echo "Testing latency..."
for i in {1..10}; do
    start=$(date +%s%3N)
    curl -s "$API_URL/health" > /dev/null
    end=$(date +%s%3N)
    echo "Ping $i: $((end - start))ms"
done

# Test bandwidth
echo "Testing bandwidth..."
for size in 1 10 100 1000; do
    echo "Testing $size KB response..."
    start=$(date +%s%3N)
    curl -s "$API_URL/products" > /dev/null
    end=$(date +%s%3N)
    duration=$((end - start))
    echo "  Duration: ${duration}ms"
done

# Test connection stability
echo "Testing connection stability..."
for i in {1..100}; do
    if curl -s "$API_URL/health" > /dev/null; then
        echo -n "."
    else
        echo "X"
    fi
    sleep 0.1
done
echo ""
```

#### Expected Results
- Latency: < 100ms average
- Bandwidth: Sufficient for all operations
- Connection stability: 100% success rate
- No network timeouts

---

## 📈 Performance Monitoring

### Real-time Monitoring

#### System Metrics
```bash
# Monitor CPU and Memory
htop

# Monitor disk usage
df -h

# Monitor network
iftop

# Monitor processes
ps aux | grep node
```

#### Application Metrics
```bash
# Check PM2 status
pm2 status

# View PM2 logs
pm2 logs herb-backend

# Monitor PM2 metrics
pm2 monit
```

### Performance Logging

#### Backend Logging
Add performance logging to the backend:

```javascript
// Add to server.js
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});
```

#### Frontend Logging
Add performance logging to the frontend:

```javascript
// Add to apiClient.ts
const request = async (url, options = {}) => {
    const start = performance.now();
    const response = await fetch(url, options);
    const duration = performance.now() - start;
    console.log(`API ${options.method || 'GET'} ${url} - ${duration.toFixed(2)}ms`);
    return response;
};
```

---

## 🔧 Performance Optimization

### Backend Optimizations

#### 1. Enable Gzip Compression
```javascript
// Add to server.js
const compression = require('compression');
app.use(compression());
```

#### 2. Add Response Caching
```javascript
// Add to server.js
app.use((req, res, next) => {
    if (req.method === 'GET') {
        res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    }
    next();
});
```

#### 3. Optimize Database Queries
```javascript
// Use efficient queries
app.get('/api/products', (req, res) => {
    // Only fetch necessary fields
    const products = data.products.map(p => ({
        id: p.id,
        product_name: p.product_name,
        retail_price: p.retail_price
    }));
    res.json(products);
});
```

### Frontend Optimizations

#### 1. Implement Lazy Loading
```javascript
// Lazy load components
const Reports = lazy(() => import('./pages/Reports'));
```

#### 2. Add Request Debouncing
```javascript
// Debounce search requests
const debouncedSearch = useMemo(
    () => debounce((query) => {
        // Perform search
    }, 300),
    []
);
```

#### 3. Optimize Bundle Size
```javascript
// Use dynamic imports
const Chart = lazy(() => import('react-chartjs-2'));
```

---

## 📊 Performance Reports

### Test Results Template

```
HERB Performance Test Results
============================
Date: ___________
Tester: ___________
Environment: EC2 (t3.medium)
Duration: ___________

Basic Performance:
- Health endpoint: _____ms (target: <100ms)
- Products endpoint: _____ms (target: <300ms)
- Customers endpoint: _____ms (target: <300ms)
- Orders endpoint: _____ms (target: <300ms)

Load Testing:
- Concurrent users: _____
- Average response time: _____ms
- Peak response time: _____ms
- Error rate: _____%
- Throughput: _____ requests/second

Stress Testing:
- Maximum users: _____
- System breaking point: _____ users
- Recovery time: _____ seconds
- Data integrity: ✅/❌

Memory Testing:
- Initial memory: _____MB
- Peak memory: _____MB
- Memory growth: _____MB/hour
- Memory leaks: ✅/❌

Database Performance:
- CREATE operations: _____ms
- READ operations: _____ms
- UPDATE operations: _____ms
- DELETE operations: _____ms

Network Performance:
- Average latency: _____ms
- Bandwidth utilization: _____%
- Connection stability: _____%
- Packet loss: _____%

Recommendations:
1. ________________
2. ________________
3. ________________
```

### Performance Dashboard

Create a simple performance dashboard:

```html
<!DOCTYPE html>
<html>
<head>
    <title>HERB Performance Dashboard</title>
</head>
<body>
    <h1>HERB Performance Dashboard</h1>
    <div id="metrics"></div>
    
    <script>
        setInterval(async () => {
            const start = performance.now();
            const response = await fetch('/api/health');
            const duration = performance.now() - start;
            
            document.getElementById('metrics').innerHTML = `
                <p>API Response Time: ${duration.toFixed(2)}ms</p>
                <p>Status: ${response.ok ? 'OK' : 'ERROR'}</p>
                <p>Last Check: ${new Date().toLocaleTimeString()}</p>
            `;
        }, 5000);
    </script>
</body>
</html>
```

---

## 🚨 Performance Alerts

### Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|---------|
| Response Time | > 500ms | > 1000ms | Check server load |
| Memory Usage | > 80% | > 95% | Restart application |
| CPU Usage | > 70% | > 90% | Scale up instance |
| Error Rate | > 5% | > 10% | Check logs |
| Disk Usage | > 80% | > 95% | Clean up logs |

### Alert Script

```bash
#!/bin/bash
# performance-alert.sh

API_URL="http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com/api"
ALERT_EMAIL="admin@herb.com"

check_performance() {
    local response_time=$(curl -s -w '%{time_total}' -o /dev/null "$API_URL/health")
    local response_time_ms=$(echo "$response_time * 1000" | bc)
    
    if (( $(echo "$response_time_ms > 1000" | bc -l) )); then
        echo "CRITICAL: API response time ${response_time_ms}ms exceeds 1000ms threshold"
        # Send alert email
        echo "API response time critical: ${response_time_ms}ms" | mail -s "HERB Performance Alert" $ALERT_EMAIL
    elif (( $(echo "$response_time_ms > 500" | bc -l) )); then
        echo "WARNING: API response time ${response_time_ms}ms exceeds 500ms threshold"
    else
        echo "OK: API response time ${response_time_ms}ms is within normal range"
    fi
}

check_performance
```

---

## 📚 Performance Testing Tools

### Recommended Tools

1. **Apache Bench (ab)**
   ```bash
   ab -n 1000 -c 10 http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com/api/health
   ```

2. **wrk**
   ```bash
   wrk -t12 -c400 -d30s http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com/api/health
   ```

3. **Artillery**
   ```bash
   npm install -g artillery
   artillery quick --count 10 --num 10 http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com/api/health
   ```

4. **JMeter**
   - GUI tool for complex load testing
   - Create test plans with multiple scenarios
   - Generate detailed reports

### Custom Monitoring

```bash
#!/bin/bash
# custom-monitor.sh

while true; do
    echo "$(date): $(curl -s -w '%{time_total}' -o /dev/null http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com/api/health)s"
    sleep 60
done
```

---

*Last Updated: January 2025*
*Version: 1.0*
*System: HERB Liquor Wholesale Management System - Performance Testing*
