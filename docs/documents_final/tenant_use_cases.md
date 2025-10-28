# Tenant - Complete Workflow Use Cases

## 1. Property Search & Application

### 1.1 Property Search & Selection
```mermaid
graph TD
    A[Tenant] -->|1.1.1| B[Browse Properties]
    A -->|1.1.2| C[View Property Details]
    A -->|1.1.3| D[Check Availability]
    A -->|1.1.4| E[Initiate Application]
    
    B --> B1[Filter by Location]
    B --> B2[View Photos]
    B --> B3[Check Amenities]
    
    D --> D1[Select Move-in Date]
    D --> D2[Verify Pricing]
    D --> D3[Review Terms]
    
    style A fill:#9C27B0,color:white
```

### 1.2 Application Process
```mermaid
graph TD
    A[Tenant] -->|1.2.1| B[Fill Application Form]
    A -->|1.2.2| C[Upload Documents]
    A -->|1.2.3| D[Submit Application]
    A -->|1.2.4| E[Track Status]
    
    B --> B1[Personal Information]
    B --> B2[Employment Details]
    B --> B3[References]
    
    C --> C1[ID Proof]
    C --> C2[Proof of Income]
    C --> C3[Previous Landlord Reference]
    
    style A fill:#9C27B0,color:white
```

## 2. Lease Management

### 2.1 Lease Signing
```mermaid
graph TD
    A[Tenant] -->|2.1.1| B[Review Lease Terms]
    A -->|2.1.2| C[E-Sign Document]
    A -->|2.1.3| D[Pay Security Deposit]
    A -->|2.1.4| E[Confirm Move-in Date]
    
    B --> B1[Lease Duration]
    B --> B2[House Rules]
    B --> B3[Payment Schedule]
    
    D --> D1[Payment Confirmation]
    D --> D2[Receipt Generation]
    D --> D3[Lease Activation]
    
    style A fill:#9C27B0,color:white
```

### 2.2 Lease Renewal
```mermaid
graph TD
    A[Tenant] -->|2.2.1| B[Receive Renewal Notice]
    A -->|2.2.2| C[Review New Terms]
    A -->|2.2.3| D[Accept/Decline]
    A -->|2.2.4| E[Sign Renewal]
    
    B --> B1[Updated Rent]
    B --> B2[New Terms]
    B --> B3[Changes Highlighted]
    
    D --> D1[Confirm Decision]
    D --> D2[Provide Notice if Leaving]
    D --> D3[Schedule Move-out]
    
    style A fill:#9C27B0,color:white
```

## 1. Property Search & Discovery

### 1.1 Property Search
```mermaid
graph TD
    A[Tenant] -->|1.1.1| B[Search Properties]
    A -->|1.1.2| C[Apply Filters]
    A -->|1.1.3| D[Save Favorites]
    A -->|1.1.4| E[View on Map]
    
    B --> B1[Location Search]
    B --> B2[Date Selection]
    B --> B3[Guest Count]
    
    C --> C1[Price Range]
    C --> C2[Property Type]
    C --> C3[Amenities]
    
    style A fill:#9C27B0,color:white
```

### 1.2 Property Comparison
```mermaid
graph TD
    A[Tenant] -->|1.2.1| B[Compare Listings]
    A -->|1.2.2| C[View Photos]
    A -->|1.2.3| D[Check Availability]
    A -->|1.2.4| E[Read Reviews]
    
    B --> B1[Side-by-Side View]
    B --> B2[Key Features]
    B --> B3[Pricing Breakdown]
    
    E --> E1[Guest Ratings]
    E --> E2[Detailed Feedback]
    E --> E3[Owner Responses]
    
    style A fill:#9C27B0,color:white
```

## 2. Booking Process

### 2.1 Reservation
```mermaid
graph TD
    A[Tenant] -->|2.1.1| B[Select Dates]
    A -->|2.1.2| C[Choose Options]
    A -->|2.1.3| D[Review Pricing]
    A -->|2.1.4| E[Book Now]
    
    C --> C1[Add Guests]
    C --> C2[Extra Services]
    C --> C3[Special Requests]
    
    D --> D1[Base Rate]
    D --> D2[Additional Fees]
    D --> D3[Total Cost]
    
    style A fill:#9C27B0,color:white
```

### 2.2 Payment & Confirmation
```mermaid
graph TD
    A[Tenant] -->|2.2.1| B[Enter Payment Details]
    A -->|2.2.2| C[Apply Promo Code]
    A -->|2.2.3| D[Review Policy]
    A -->|2.2.4| E[Confirm Booking]
    
    B --> B1[Credit/Debit Card]
    B --> B2[Digital Wallet]
    B --> B3[Bank Transfer]
    
    D --> D1[Cancellation Policy]
    D --> D2[House Rules]
    D --> D3[Terms & Conditions]
    
    style A fill:#9C27B0,color:white
```

## 3. Rent & Payments

### 3.1 Payment Processing
```mermaid
graph TD
    A[Tenant] -->|3.1.1| B[View Payment Dashboard]
    A -->|3.1.2| C[Make Payment]
    A -->|3.1.3| D[Set Up Auto-Pay]
    A -->|3.1.4| E[View Payment History]
    
    B --> B1[Current Balance]
    B --> B2[Due Dates]
    B --> B3[Payment Methods]
    
    C --> C1[Select Payment Method]
    C --> C2[Enter Amount]
    C --> C3[Confirm Payment]
    
    style A fill:#9C27B0,color:white
```

### 3.2 Security Deposit
```mermaid
graph TD
    A[Tenant] -->|3.2.1| B[View Deposit Status]
    A -->|3.2.2| C[Track Deductions]
    A -->|3.2.3| D[Request Refund]
    A -->|3.2.4| E[Dispute Charges]
    
    B --> B1[Initial Amount]
    B --> B2[Current Status]
    B --> B3[Expected Refund Date]
    
    D --> D1[Provide Bank Details]
    D --> D2[Track Processing]
    D --> D3[Confirm Receipt]
    
    style A fill:#9C27B0,color:white
```

## 4. Move-in & Living

### 4.1 Move-in Process
```mermaid
graph TD
    A[Tenant] -->|4.1.1| B[Schedule Move-in]
    A -->|4.1.2| C[Complete Inspection]
    A -->|4.1.3| D[Receive Keys]
    A -->|4.1.4| E[Confirm Move-in]
    
    B --> B1[Select Date/Time]
    B --> B2[Confirm Details]
    B --> B3[Receive Confirmation]
    
    C --> C1[Document Condition]
    C --> C2[Take Photos]
    C --> C3[Sign Inspection Report]
    
    style A fill:#9C27B0,color:white
```

### 4.2 Maintenance Requests
```mermaid
graph TD
    A[Tenant] -->|4.2.1| B[Submit Request]
    A -->|4.2.2| C[Track Status]
    A -->|4.2.3| D[Communicate with Staff]
    A -->|4.2.4| E[Confirm Resolution]
    
    B --> B1[Describe Issue]
    B --> B2[Upload Photos]
    B --> B3[Set Urgency]
    
    C --> C1[View Updates]
    C --> C2[Receive Notifications]
    C --> C3[Schedule Access]
    
    style A fill:#9C27B0,color:white
```

## 5. Move-out Process

### 5.1 Move-out Preparation
```mermaid
graph TD
    A[Tenant] -->|5.1.1| B[Submit Move-out Notice]
    A -->|5.1.2| C[Schedule Final Inspection]
    A -->|5.1.3| D[Complete Move-out Checklist]
    A -->|5.1.4| E[Return Keys]
    
    B --> B1[Provide Forwarding Address]
    B --> B2[Confirm Last Day]
    B --> B3[Review Move-out Requirements]
    
    D --> D1[Cleaning]
    D --> D2[Repairs]
    D --> D3[Personal Belongings]
    
    style A fill:#9C27B0,color:white
```

### 5.2 Deposit Refund
```mermaid
graph TD
    A[Tenant] -->|5.2.1| B[Review Inspection Report]
    A -->|5.2.2| C[View Deductions]
    A -->|5.2.3| D[Receive Refund]
    A -->|5.2.4| E[Dispute if Needed]
    
    B --> B1[Compare Move-in/Move-out]
    B --> B2[Documentation Review]
    B --> B3[Sign Off]
    
    D --> D1[Payment Method]
    D --> D2[Timeline]
    D --> D3[Confirmation]
    
    style A fill:#9C27B0,color:white
```

## 6. Account Management

### 3.1 Profile Settings
```mermaid
graph TD
    A[Tenant] -->|3.1.1| B[Edit Profile]
    A -->|3.1.2| C[Update Preferences]
    A -->|3.1.3| D[Manage Documents]
    A -->|3.1.4| E[Privacy Settings]
    
    B --> B1[Personal Information]
    B --> B2[Contact Details]
    B --> B3[Profile Photo]
    
    D --> D1[ID Verification]
    D --> D2[Payment Methods]
    D --> D3[Saved Documents]
    
    style A fill:#9C27B0,color:white
```

### 3.2 Notification Center
```mermaid
graph TD
    A[Tenant] -->|3.2.1| B[View Notifications]
    A -->|3.2.2| C[Email Preferences]
    A -->|3.2.3| D[Push Notifications]
    A -->|3.2.4| E[Message Alerts]
    
    B --> B1[Booking Updates]
    B --> B2[Payment Reminders]
    B --> B3[Special Offers]
    
    D --> D1[New Messages]
    D --> D2[Check-in Reminders]
    D --> D3[Review Requests]
    
    style A fill:#9C27B0,color:white
```

## 4. Stay Management

### 4.1 Pre-Arrival
```mermaid
graph TD
    A[Tenant] -->|4.1.1| B[View Itinerary]
    A -->|4.1.2| C[Check-in Instructions]
    A -->|4.1.3| D[Message Host]
    A -->|4.1.4| E[Request Early Check-in]
    
    B --> B1[Property Address]
    B --> B2[Check-in/out Times]
    B --> B3[Emergency Contacts]
    
    C --> C1[Key Collection]
    C --> C2[Access Codes]
    C --> C3[Parking Information]
    
    style A fill:#9C27B0,color:white
```

### 4.2 During Stay
```mermaid
graph TD
    A[Tenant] -->|4.2.1| B[Access Property Guide]
    A -->|4.2.2| C[Request Assistance]
    A -->|4.2.3| D[Report Issues]
    A -->|4.2.4| E[Extend Stay]
    
    B --> B1[Appliance Manuals]
    B --> B2[WiFi Details]
    B --> B3[Local Recommendations]
    
    D --> D1[Maintenance Request]
    D --> D2[Emergency Contact]
    D --> D3[Upload Photos]
    
    style A fill:#9C27B0,color:white
```

## 5. Payments & Billing

### 5.1 Payment Methods
```mermaid
graph TD
    A[Tenant] -->|5.1.1| B[Add Payment Method]
    A -->|5.1.2| C[Set Default Payment]
    A -->|5.1.3| D[View Payment History]
    A -->|5.1.4| E[Download Receipts]
    
    B --> B1[Credit/Debit Card]
    B --> B2[PayPal]
    B --> B3[Bank Transfer]
    
    D --> D1[Filter by Date]
    D --> D2[Search Transactions]
    D --> D3[Export to PDF]
    
    style A fill:#9C27B0,color:white
```

### 5.2 Security Deposits
```mermaid
graph TD
    A[Tenant] -->|5.2.1| B[View Deposit Status]
    A -->|5.2.2| C[Dispute Charges]
    A -->|5.2.3| D[Receive Refund]
    A -->|5.2.4| E[Payment Protection]
    
    B --> B1[Amount Held]
    B --> B2[Release Date]
    B --> B3[Conditions]
    
    C --> C1[Submit Evidence]
    C --> C2[Resolution Center]
    C --> C3[Status Updates]
    
    style A fill:#9C27B0,color:white
```

## 6. Reviews & Feedback

### 6.1 Leave a Review
```mermaid
graph TD
    A[Tenant] -->|6.1.1| B[Rate Property]
    A -->|6.1.2| C[Write Review]
    A -->|6.1.3| D[Upload Photos]
    A -->|6.1.4| E[Submit Feedback]
    
    B --> B1[Overall Rating]
    B --> B2[Cleanliness]
    B --> B3[Accuracy]
    
    C --> C1[Detailed Comments]
    C --> C2[Private Feedback]
    C --> C3[Tips for Future Guests]
    
    style A fill:#9C27B0,color:white
```

### 6.2 View Responses
```mermaid
graph TD
    A[Tenant] -->|6.2.1| B[Read Owner Responses]
    A -->|6.2.2| C[View Public Profile]
    A -->|6.2.3| D[Edit Review]
    A -->|6.2.4| E[Delete Review]
    
    B --> B1[Owner's Reply]
    B --> B2[Thank You Message]
    B --> B3[Follow-up Questions]
    
    D --> D1[Edit Window]
    D --> D2[Update Rating]
    D --> D3[Modify Text]
    
    style A fill:#9C27B0,color:white
```
