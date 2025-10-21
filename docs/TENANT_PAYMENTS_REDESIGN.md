# Tenant Payments Dashboard - Complete Redesign
## Based on payments.md + Xendit Integration

---

## 🎯 **Overview**

Complete overhaul of tenant payment experience following real-world payment lifecycle from `payments.md` with Xendit payment gateway integration.

---

## 📱 **New UI Structure**

### **1. Dashboard Header**
```
┌─────────────────────────────────────────────────┐
│  💳 My Payments                                 │
│  Manage your rent, utilities, and payments      │
└─────────────────────────────────────────────────┘
```

### **2. Alert Cards (Top Priority)**
```
┌─────────────────────────────────────────────────┐
│  🔴 OVERDUE PAYMENTS (2)                        │
│  ┌───────────────────────────────────────────┐ │
│  │ Monthly Rent - October 2025               │ │
│  │ Sky Apartment - Unit 301                  │ │
│  │ ₱5,000 + ₱250 late fee                    │ │
│  │ Due: Oct 5, 2025 (20 days overdue)        │ │
│  │            [Pay Now]                       │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ⚠️ DUE SOON (3 days remaining)                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Utilities - Water & Electric              │ │
│  │ ₱1,200    Due: Oct 25, 2025               │ │
│  │            [Pay Now]                       │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### **3. Summary Cards**
```
┌─────────┬─────────┬─────────┬─────────┐
│ Total   │ Paid    │ Pending │ Overdue │
│ ₱65,000 │ ₱55,000 │ ₱5,000  │ ₱5,250  │
└─────────┴─────────┴─────────┴─────────┘
```

### **4. Payment Tabs**
```
[All Payments] [Rent] [Utilities] [Deposits] [Refunds]
```

### **5. Payment Timeline**
```
THIS MONTH
  ✅ Rent - Oct 2025        ₱5,000  Paid
  ⏳ Utilities              ₱1,200  Pending
  
PREVIOUS
  ✅ Rent - Sept 2025       ₱5,000  Paid
  ✅ Utilities - Sept       ₱1,100  Paid
```

---

## 🎨 **Component Breakdown**

### **Component 1: Payment Status Cards**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Overdue Card */}
  <Card className="border-red-200 bg-red-50">
    <CardContent>
      <div className="text-red-700">
        <AlertTriangle className="w-8 h-8" />
        <p className="text-3xl font-bold">₱5,250</p>
        <p className="text-sm">Overdue (2)</p>
      </div>
    </CardContent>
  </Card>

  {/* Due Soon Card */}
  <Card className="border-yellow-200 bg-yellow-50">
    <CardContent>
      <div className="text-yellow-700">
        <Clock className="w-8 h-8" />
        <p className="text-3xl font-bold">₱6,200</p>
        <p className="text-sm">Due Soon (3)</p>
      </div>
    </CardContent>
  </Card>

  {/* Paid Card */}
  <Card className="border-green-200 bg-green-50">
    <CardContent>
      <div className="text-green-700">
        <CheckCircle className="w-8 h-8" />
        <p className="text-3xl font-bold">₱55,000</p>
        <p className="text-sm">Paid This Year</p>
      </div>
    </CardContent>
  </Card>

  {/* Total Card */}
  <Card className="border-blue-200 bg-blue-50">
    <CardContent>
      <div className="text-blue-700">
        <TrendingUp className="w-8 h-8" />
        <p className="text-3xl font-bold">₱66,450</p>
        <p className="text-sm">Total Payments</p>
      </div>
    </CardContent>
  </Card>
</div>
```

### **Component 2: Urgent Payments Section**
```tsx
{overduePayments.length > 0 && (
  <Card className="border-red-300 bg-red-50/50">
    <CardHeader>
      <CardTitle className="text-red-700 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        Overdue Payments ({overduePayments.length})
      </CardTitle>
      <CardDescription className="text-red-600">
        Please settle these payments to avoid additional penalties
      </CardDescription>
    </CardHeader>
    <CardContent>
      {overduePayments.map(payment => (
        <PaymentCard 
          key={payment.id}
          payment={payment}
          urgent
          onPay={() => handlePayWithXendit(payment)}
        />
      ))}
    </CardContent>
  </Card>
)}
```

### **Component 3: Xendit Payment Dialog**
```tsx
<Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Pay with Xendit</DialogTitle>
      <DialogDescription>
        Choose your payment method
      </DialogDescription>
    </DialogHeader>

    {/* Payment Details */}
    <div className="p-4 bg-blue-50 rounded-lg">
      <div className="flex justify-between mb-2">
        <span className="text-gray-600">Payment Type:</span>
        <span className="font-medium">{selectedPayment?.payment_type}</span>
      </div>
      <div className="flex justify-between mb-2">
        <span className="text-gray-600">Amount:</span>
        <span className="font-medium text-lg">
          ₱{selectedPayment?.amount.toLocaleString()}
        </span>
      </div>
      {selectedPayment?.late_fee > 0 && (
        <div className="flex justify-between text-red-600">
          <span>Late Fee:</span>
          <span className="font-medium">
            +₱{selectedPayment?.late_fee.toLocaleString()}
          </span>
        </div>
      )}
    </div>

    {/* Payment Methods */}
    <div className="space-y-2">
      <Label>Select Payment Method</Label>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className={selectedMethod === 'gcash' ? 'border-blue-500 bg-blue-50' : ''}
          onClick={() => setSelectedMethod('gcash')}>
          <img src="/gcash-logo.png" alt="GCash" className="h-6" />
        </Button>
        <Button
          variant="outline"
          className={selectedMethod === 'maya' ? 'border-green-500 bg-green-50' : ''}
          onClick={() => setSelectedMethod('maya')}>
          <img src="/maya-logo.png" alt="Maya" className="h-6" />
        </Button>
        <Button
          variant="outline"
          className={selectedMethod === 'card' ? 'border-purple-500 bg-purple-50' : ''}
          onClick={() => setSelectedMethod('card')}>
          <CreditCard className="w-5 h-5 mr-2" />
          Card
        </Button>
        <Button
          variant="outline"
          className={selectedMethod === 'bank' ? 'border-orange-500 bg-orange-50' : ''}
          onClick={() => setSelectedMethod('bank')}>
          Bank
        </Button>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
        Cancel
      </Button>
      <Button
        onClick={handleProceedToXendit}
        disabled={!selectedMethod || isProcessing}
        className="bg-blue-600 hover:bg-blue-700">
        {isProcessing ? 'Processing...' : 'Proceed to Payment'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 🔄 **Payment Flow Logic**

### **1. Calculate Payment Status**
```typescript
function getPaymentStatus(payment: PaymentWithDetails): 'overdue' | 'due_soon' | 'pending' | 'paid' {
  if (payment.payment_status === 'paid') return 'paid';
  
  const dueDate = new Date(payment.due_date);
  const now = new Date();
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 7) return 'due_soon';
  return 'pending';
}
```

### **2. Calculate Late Fee**
```typescript
function calculateLateFee(payment: PaymentWithDetails): number {
  if (payment.payment_status === 'paid') return 0;
  
  const dueDate = new Date(payment.due_date);
  const now = new Date();
  const daysOverdue = Math.max(0, Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  if (daysOverdue === 0) return 0;
  
  // Example: 5% of amount or ₱50/day, whichever is higher
  const percentageFee = payment.amount * 0.05;
  const dailyFee = daysOverdue * 50;
  
  return Math.max(percentageFee, dailyFee);
}
```

### **3. Xendit Payment Integration**
```typescript
async function handlePayWithXendit(payment: PaymentWithDetails, method: string) {
  try {
    setIsProcessing(true);
    
    const lateFee = calculateLateFee(payment);
    const totalAmount = payment.amount + lateFee;
    
    // Create Xendit invoice
    const response = await fetch('/api/xendit/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_id: payment.id,
        amount: totalAmount,
        payment_method: method,
        description: `${payment.payment_type} - ${payment.property.name}`,
        customer_email: authState.user.email,
        customer_name: `${authState.user.first_name} ${authState.user.last_name}`
      })
    });
    
    const { invoice_url, invoice_id } = await response.json();
    
    // Redirect to Xendit checkout
    window.location.href = invoice_url;
    
  } catch (error) {
    toast.error('Failed to process payment');
    console.error(error);
  } finally {
    setIsProcessing(false);
  }
}
```

---

## 📋 **Payment Categories**

### **Rent Payments:**
- Monthly recurring
- Auto-generated on 1st of month
- Late fee after grace period

### **Utilities:**
- Water, Electric, Internet
- Based on meter readings
- Owner uploads bills

### **Deposits:**
- Security deposit
- Advance rent
- Reservation fee

### **Penalties:**
- Late payment fees
- Damage charges
- Other fees

### **Refunds:**
- Already implemented! ✅
- Show in separate tab

---

## 🎯 **Key Features**

1. ✅ **Visual Priority** - Overdue/Due Soon prominently displayed
2. ✅ **Auto Late Fee** - Calculate based on days overdue
3. ✅ **Payment Methods** - GCash, Maya, Card, Bank via Xendit
4. ✅ **Receipt Downloads** - PDF generation after payment
5. ✅ **Payment History** - Categorized by type
6. ✅ **Refund Requests** - Integrated seamlessly
7. ✅ **Mobile Responsive** - Works on all devices
8. ✅ **Real-time Status** - Updates via Xendit webhook

---

## 📊 **Data Structure**

```typescript
interface EnhancedPaymentView extends PaymentWithDetails {
  status: 'overdue' | 'due_soon' | 'pending' | 'paid';
  late_fee: number;
  days_until_due: number;
  days_overdue: number;
  total_amount: number;
  can_request_refund: boolean;
}
```

---

## 🚀 **Implementation Plan**

1. ✅ **Update UI Structure** - Dashboard cards, tabs
2. ✅ **Add Payment Logic** - Status, late fees, calculations
3. ✅ **Xendit Integration** - Payment dialog, redirect flow
4. ✅ **Receipt Generation** - PDF download
5. ✅ **Testing** - All payment scenarios

**Estimated Time**: 1-2 hours

**Ready to build?** This will be a professional, production-ready payment dashboard!
