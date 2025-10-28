# Owner - Complete Workflow Use Cases

## 1. Property Management

### 1.1 Property Listing & Setup
```mermaid
graph TD
    A[Owner] -->|1.1.1| B[Create Property Listing]
    A -->|1.1.2| C[Upload Documents]
    A -->|1.1.3| D[Set Availability]
    A -->|1.1.4| E[Publish Listing]
    
    B --> B1[Property Details]
    B --> B2[Pricing & Fees]
    B --> B3[House Rules]
    
    C --> C1[Lease Agreement]
    C --> C2[Property Photos]
    C --> C3[Legal Documents]
    
    style A fill:#2196F3,color:white
```

### 1.2 Application Management
```mermaid
graph TD
    A[Owner] -->|1.2.1| B[Review Applications]
    A -->|1.2.2| C[Check References]
    A -->|1.2.3| D[Approve/Reject]
    A -->|1.2.4| E[Notify Applicant]
    
    B --> B1[View Application]
    B --> B2[Check Documents]
    B --> B3[Review History]
    
    D --> D1[Send Approval]
    D --> D2[Request More Info]
    D --> D3[Decline with Reason]
    
    style A fill:#2196F3,color:white
```

## 2. Tenant Onboarding

### 2.1 Lease Creation
```mermaid
graph TD
    A[Owner] -->|2.1.1| B[Create Lease]
    A -->|2.1.2| C[Set Terms]
    A -->|2.1.3| D[Collect Deposit]
    A -->|2.1.4| E[Activate Lease]
    
    B --> B1[Lease Duration]
    B --> B2[Payment Schedule]
    B --> B3[House Rules]
    
    D --> D1[Payment Link]
    D --> D2[Receipt]
    D --> D3[Deposit Protection]
    
    style A fill:#2196F3,color:white
```

### 2.2 Move-in Process
```mermaid
graph TD
    A[Owner] -->|2.2.1| B[Schedule Move-in]
    A -->|2.2.2| C[Conduct Inspection]
    A -->|2.2.3| D[Hand Over Keys]
    A -->|2.2.4| E[Complete Documentation]
    
    B --> B1[Coordinate Date/Time]
    B --> B2[Prepare Unit]
    B --> B3[Confirm Details]
    
    C --> C1[Inspection Checklist]
    C --> C2[Document Condition]
    C --> C3[Sign-Off]
    
    style A fill:#2196F3,color:white
```

## 1. Property Management

### 1.1 Property Listing
```mermaid
graph TD
    A[Owner] -->|1.1.1| B[Create New Listing]
    A -->|1.1.2| C[Edit Existing Listing]
    A -->|1.1.3| D[Duplicate Listing]
    A -->|1.1.4| E[Delete Listing]
    
    B --> B1[Basic Information]
    B --> B2[Detailed Description]
    B --> B3[Pricing & Fees]
    B --> B4[House Rules]
    
    C --> C1[Update Availability]
    C --> C2[Modify Pricing]
    C --> C3[Edit Photos]
    
    style A fill:#2196F3,color:white
```

### 1.2 Media Management
```mermaid
graph TD
    A[Owner] -->|1.2.1| B[Upload Photos]
    A -->|1.2.2| C[Edit Photo Order]
    A -->|1.2.3| D[Add/Edit Video]
    A -->|1.2.4| E[Add 3D Tour]
    
    B --> B1[High-Quality Images]
    B --> B2[Image Optimization]
    B --> B3[Alt Text]
    
    D --> D1[Embed YouTube/Vimeo]
    D --> D2[Virtual Tour]
    D --> D3[Neighborhood Video]
    
    style A fill:#2196F3,color:white
```

## 2. Booking Management

### 2.1 Reservation Handling
```mermaid
graph TD
    A[Owner] -->|2.1.1| B[View Booking Requests]
    A -->|2.1.2| C[Approve/Decline]
    A -->|2.1.3| D[Manage Calendar]
    A -->|2.1.4| E[Set Minimum Stay]
    
    B --> B1[Check Guest Profile]
    B --> B2[View Message History]
    B --> B3[Special Requests]
    
    D --> D1[Block Dates]
    D --> D2[Set Seasonal Rates]
    D --> D3[Sync External Calendars]
    
    style A fill:#2196F3,color:white
```

### 2.2 Pricing Strategy
```mermaid
graph TD
    A[Owner] -->|2.2.1| B[Set Base Pricing]
    A -->|2.2.2| C[Seasonal Rates]
    A -->|2.2.3| D[Special Offers]
    A -->|2.2.4| E[Last-Minute Deals]
    
    B --> B1[Weekday/Weekend Rates]
    B --> B2[Monthly Discounts]
    B --> B3[Cleaning Fees]
    
    D --> D1[Percentage Discount]
    D --> D2[Free Nights]
    D --> D3[Package Deals]
    
    style A fill:#2196F3,color:white
```

## 3. Rent Collection & Financials

### 3.1 Rent Collection
```mermaid
graph TD
    A[Owner] -->|3.1.1| B[View Payments Due]
    A -->|3.1.2| C[Send Reminders]
    A -->|3.1.3| D[Process Payments]
    A -->|3.1.4| E[Track Transactions]
    
    B --> B1[Upcoming Payments]
    B --> B2[Overdue Notices]
    B --> B3[Payment History]
    
    D --> D1[Record Payment]
    D --> D2[Issue Receipt]
    D --> D3[Update Ledger]
    
    style A fill:#2196F3,color:white
```

### 3.2 Security Deposit Management
```mermaid
graph TD
    A[Owner] -->|3.2.1| B[Register Deposit]
    A -->|3.2.2| C[Track Status]
    A -->|3.2.3| D[Process Refund]
    A -->|3.2.4| E[Handle Disputes]
    
    B --> B1[Deposit Protection]
    B --> B2[Legal Requirements]
    B --> B3[Timeline]
    
    D --> D1[Inspection Report]
    D --> D2[Calculate Deductions]
    D --> D3[Process Payment]
    
    style A fill:#2196F3,color:white
```

## 4. Property Maintenance

### 4.1 Maintenance Management
```mermaid
graph TD
    A[Owner] -->|4.1.1| B[Receive Request]
    A -->|4.1.2| C[Assess Urgency]
    A -->|4.1.3| D[Assign Vendor]
    A -->|4.1.4| E[Track Resolution]
    
    B --> B1[Emergency]
    B --> B2[Routine]
    B --> B3[Tenant-Caused]
    
    D --> D1[Get Quotes]
    D --> D2[Schedule Work]
    D --> D3[Supervise]
    
    style A fill:#2196F3,color:white
```

### 4.2 Property Inspections
```mermaid
graph TD
    A[Owner] -->|4.2.1| B[Schedule Inspection]
    A -->|4.2.2| C[Conduct Check]
    A -->|4.2.3| D[Document Findings]
    A -->|4.2.4| E[Follow Up]
    
    B --> B1[Regular]
    B --> B2[Move-in/Move-out]
    B --> B3[Condition-Based]
    
    D --> D1[Photos]
    D --> D2[Report]
    D --> D3[Action Items]
    
    style A fill:#2196F3,color:white
```

## 5. Lease Management

### 5.1 Lease Renewals
```mermaid
graph TD
    A[Owner] -->|5.1.1| B[Review Lease]
    A -->|5.1.2| C[Update Terms]
    A -->|5.1.3| D[Send Offer]
    A -->|5.1.4| E[Finalize Renewal]
    
    B --> B1[Market Rate]
    B --> B2[Tenant History]
    B --> B3[Property Condition]
    
    D --> D1[New Terms]
    D --> D2[Price Adjustment]
    D --> D3[Incentives]
    
    style A fill:#2196F3,color:white
```

### 5.2 Move-out Process
```mermaid
graph TD
    A[Owner] -->|5.2.1| B[Receive Notice]
    A -->|5.2.2| C[Schedule Final Inspection]
    A -->|5.2.3| D[Assess Property]
    A -->|5.2.4| E[Process Deposit]
    
    B --> B1[Coordinate Date]
    B --> B2[Prepare Checklist]
    B --> B3[Notify Tenant]
    
    D --> D1[Compare Condition]
    D --> D2[Document Issues]
    D --> D3[Estimate Costs]
    
    style A fill:#2196F3,color:white
```

## 6. Financial Management

### 6.1 Income & Expenses
```mermaid
graph TD
    A[Owner] -->|6.1.1| B[Track Income]
    A -->|6.1.2| C[Record Expenses]
    A -->|6.1.3| D[Generate Reports]
    A -->|6.1.4| E[Tax Preparation]
    
    B --> B1[Rent]
    B --> B2[Fees]
    B --> B3[Other Income]
    
    C --> C1[Maintenance]
    C --> C2[Utilities]
    C --> C3[Management Fees]
    
    style A fill:#2196F3,color:white
```

### 6.2 Financial Reporting
```mermaid
graph TD
    A[Owner] -->|6.2.1| B[Generate Statements]
    A -->|6.2.2| C[View Analytics]
    A -->|6.2.3| D[Export Data]
    A -->|6.2.4| E[Tax Documentation]
    
    B --> B1[Monthly]
    B --> B2[Quarterly]
    B --> B3[Annual]
    
    C --> C1[Cash Flow]
    C --> C2[Expense Breakdown]
    C --> C3[Performance Metrics]
    
    style A fill:#2196F3,color:white
```
```mermaid
graph TD
    A[Owner] -->|3.1.1| B[View Earnings]
    A -->|3.1.2| C[Request Payout]
    A -->|3.1.3| D[View Transactions]
    A -->|3.1.4| E[Set Up Tax Information]
    
    B --> B1[Available Balance]
    B --> B2[Processing Time]
    B --> B3[Payout Methods]
    
    D --> D1[Filter by Date]
    D --> D2[Export to CSV]
    D --> D3[Tax Documents]
    
    style A fill:#2196F3,color:white
```

### 3.2 Expense Tracking
```mermaid
graph TD
    A[Owner] -->|3.2.1| B[Add Expense]
    A -->|3.2.2| C[Categorize Expenses]
    A -->|3.2.3| D[Generate Reports]
    A -->|3.2.4| E[Track Tax Deductibles]
    
    B --> B1[One-Time Expenses]
    B --> B2[Recurring Expenses]
    B --> B3[Receipt Upload]
    
    D --> D1[Monthly Summary]
    D --> D2[Yearly Overview]
    D --> D3[Profit/Loss]
    
    style A fill:#2196F3,color:white
```

## 4. Guest Communication

### 4.1 Messaging System
```mermaid
graph TD
    A[Owner] -->|4.1.1| B[Inbox Management]
    A -->|4.1.2| C[Quick Responses]
    A -->|4.1.3| D[Booking Inquiries]
    A -->|4.1.4| E[Review Notifications]
    
    B --> B1[Message Filtering]
    B --> B2[Message Templates]
    B --> B3[Attachment Support]
    
    D --> D1[Pre-Booking Questions]
    D --> D2[Special Requests]
    D --> D3[Itinerary Details]
    
    style A fill:#2196F3,color:white
```

### 4.2 Review Management
```mermaid
graph TD
    A[Owner] -->|4.2.1| B[View Guest Reviews]
    A -->|4.2.2| C[Respond to Reviews]
    A -->|4.2.3| D[Request Reviews]
    A -->|4.2.4| E[Review Analytics]
    
    B --> B1[Overall Rating]
    B --> B2[Category Ratings]
    B --> B3[Private Feedback]
    
    C --> C1[Public Response]
    C --> C2[Thank You Notes]
    C --> C3[Issue Resolution]
    
    style A fill:#2196F3,color:white
```

## 5. Property Maintenance

### 5.1 Maintenance Requests
```mermaid
graph TD
    A[Owner] -->|5.1.1| B[Submit Request]
    A -->|5.1.2| C[Track Progress]
    A -->|5.1.3| D[Approve Quotes]
    A -->|5.1.4| E[Maintenance History]
    
    B --> B1[Issue Description]
    B --> B2[Priority Level]
    B --> B3[Photo Upload]
    
    C --> C1[Assigned Technician]
    C --> C2[Status Updates]
    C --> C3[Completion Notes]
    
    style A fill:#2196F3,color:white
```

### 5.2 Property Inspections
```mermaid
graph TD
    A[Owner] -->|5.2.1| B[Schedule Inspection]
    A -->|5.2.2| C[Inspection Checklist]
    A -->|5.2.3| D[Document Findings]
    A -->|5.2.4| E[Create Work Orders]
    
    B --> B1[Regular Maintenance]
    B --> B2[Pre/Post Stay]
    B --> B3[Seasonal Checks]
    
    D --> D1[Photo Documentation]
    D --> D2[Condition Reports]
    D --> D3[Maintenance Recommendations]
    
    style A fill:#2196F3,color:white
```

## 6. Business Growth

### 6.1 Performance Analytics
```mermaid
graph TD
    A[Owner] -->|6.1.1| B[Occupancy Rates]
    A -->|6.1.2| C[Revenue Reports]
    A -->|6.1.3| D[Guest Demographics]
    A -->|6.1.4| E[Competitor Analysis]
    
    B --> B1[Daily/Monthly/Yearly]
    B --> B2[Seasonal Trends]
    B --> B3[Booking Lead Time]
    
    D --> D1[Guest Origin]
    D --> D2[Travel Purpose]
    D --> D3[Repeat Guest Rate]
    
    style A fill:#2196F3,color:white
```

### 6.2 Marketing Tools
```mermaid
graph TD
    A[Owner] -->|6.2.1| B[Promote Listing]
    A -->|6.2.2| C[Social Media Integration]
    A -->|6.2.3| D[Email Marketing]
    A -->|6.2.4| E[Special Promotions]
    
    B --> B1[Featured Listings]
    B --> B2[Ad Campaigns]
    B --> B3[SEO Optimization]
    
    D --> D1[Newsletter Templates]
    D --> D2[Guest Segments]
    D --> D3[Performance Tracking]
    
    style A fill:#2196F3,color:white
```
