"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Check if Supabase is configured ──────────────────────────
function isConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && url !== "your_supabase_project_url";
}

// ── DASHBOARD ─────────────────────────────────────────────────
export async function getDashboardMetrics() {
  if (!isConfigured()) return null;
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const [
    { count: totalCustomers },
    { count: commercialCustomers },
    { count: ordersToday },
    { count: pendingApproval },
    { count: pendingDispatch },
    { count: deliveriesToday },
    { data: todayOrders },
    { data: todayDeliveries },
    { data: invoiceSummary },
    { data: paymentSummary },
  ] = await Promise.all([
    supabase.from("customers").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("customers").select("*", { count: "exact", head: true }).eq("status", "active").eq("category", "commercial"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("order_date", today),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending_dispatch"),
    supabase.from("deliveries").select("*", { count: "exact", head: true }).eq("delivery_date", today).eq("status", "delivered"),
    supabase.from("orders").select("total_amount, order_items(quantity)").eq("order_date", today),
    supabase.from("deliveries").select("delivery_items(delivered_quantity)").eq("delivery_date", today).eq("status", "delivered"),
    supabase.from("invoices").select("total_amount, outstanding_amount").eq("status", "posted"),
    supabase.from("payments").select("amount").eq("payment_date", today).eq("status", "cleared"),
  ]);

  const salesToday = ((todayOrders as any[]) || []).reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
  const cylsOrdered = ((todayOrders as any[]) || []).reduce((s: number, o: any) =>
    s + (o.order_items || []).reduce((ss: number, i: any) => ss + (i.quantity || 0), 0), 0);
  const cylsDelivered = ((todayDeliveries as any[]) || []).reduce((s: number, d: any) =>
    s + (d.delivery_items || []).reduce((ss: number, i: any) => ss + (i.delivered_quantity || 0), 0), 0);
  const totalReceivables = ((invoiceSummary as any[]) || []).reduce((s: number, inv: any) => s + (inv.outstanding_amount || 0), 0);
  const paymentsToday = ((paymentSummary as any[]) || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);

  return {
    totalCustomers: totalCustomers || 0,
    commercialCustomers: commercialCustomers || 0,
    ordersToday: ordersToday || 0,
    pendingApproval: pendingApproval || 0,
    pendingDispatch: pendingDispatch || 0,
    deliveriesToday: deliveriesToday || 0,
    salesToday,
    cylsOrdered,
    cylsDelivered,
    totalReceivables,
    paymentsToday,
  };
}

export async function getMonthlySales() {
  if (!isConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_monthly_sales_summary");
  return data || [];
}

export async function getRecentOrders(limit = 10) {
  if (!isConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(`*, customer:customers(customer_name, business_name), order_items(quantity, unit_rate, total_amount, product:products(product_name))`)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function getTopOutstanding(limit = 5) {
  if (!isConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_top_outstanding_customers", { p_limit: limit });
  return data || [];
}

// ── CUSTOMERS ─────────────────────────────────────────────────
export async function getCustomers(params: {
  search?: string; category?: string; status?: string;
  page?: number; pageSize?: number; sortBy?: string; sortOrder?: "asc" | "desc";
}) {
  if (!isConfigured()) return { data: [], count: 0 };
  const supabase = await createClient();
  const { search, category, status, page = 1, pageSize = 20, sortBy = "created_at", sortOrder = "desc" } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("customers").select("*", { count: "exact" });

  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,business_name.ilike.%${search}%,mobile.ilike.%${search}%,customer_code.ilike.%${search}%,consumer_number.ilike.%${search}%`);
  }
  if (category && category !== "all") query = query.eq("category", category);
  if (status && status !== "all") query = query.eq("status", status);

  query = query.order(sortBy, { ascending: sortOrder === "asc" }).range(from, to);
  const { data, count } = await query;
  return { data: data || [], count: count || 0 };
}

export async function getCustomerById(id: string) {
  if (!isConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select(`
      *,
      customer_rates(*, product:products(*)),
      orders(id, order_number, order_date, status, total_amount),
      invoices(id, invoice_number, invoice_date, status, total_amount, outstanding_amount, due_date),
      payments(id, payment_number, payment_date, amount, method, status),
      ledger_entries(*)
    `)
    .eq("id", id)
    .single();
  return data;
}

export async function getCustomerFinancials(customerId: string) {
  if (!isConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_customer_financials", { p_customer_id: customerId });
  return data;
}

export async function createCustomer(formData: FormData) {
  if (!isConfigured()) return { error: "Database not configured. Please add Supabase credentials to .env.local" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: codeData } = await supabase.rpc("generate_customer_code");

  const payload = {
    customer_code: codeData,
    customer_name: formData.get("customer_name") as string,
    business_name: formData.get("business_name") as string || null,
    category: formData.get("category") as string || "commercial",
    consumer_type: formData.get("consumer_type") as string || "regular",
    status: "active",
    contact_person: formData.get("contact_person") as string || null,
    mobile: formData.get("mobile") as string || null,
    alternate_mobile: formData.get("alternate_mobile") as string || null,
    email: formData.get("email") as string || null,
    gst_number: formData.get("gst_number") as string || null,
    existing_consumer_id: formData.get("existing_consumer_id") as string || null,
    consumer_number: formData.get("consumer_number") as string || null,
    billing_address: formData.get("billing_address") as string || null,
    delivery_address: formData.get("delivery_address") as string || null,
    city: formData.get("city") as string || null,
    area: formData.get("area") as string || null,
    state: formData.get("state") as string || "Rajasthan",
    pin_code: formData.get("pin_code") as string || null,
    credit_limit: parseFloat(formData.get("credit_limit") as string || "0"),
    payment_terms: formData.get("payment_terms") as string || "net_30",
    opening_receivable: parseFloat(formData.get("opening_receivable") as string || "0"),
    notes: formData.get("notes") as string || null,
    created_by: user.id,
  };

  const { data, error } = await supabase.from("customers").insert(payload).select().single();
  if (error) return { error: error.message };

  // Log opening balance as ledger entry if > 0
  if (payload.opening_receivable > 0) {
    await supabase.from("ledger_entries").insert({
      customer_id: data.id,
      entry_date: new Date().toISOString().split("T")[0],
      entry_type: "opening_balance",
      debit_amount: payload.opening_receivable,
      credit_amount: 0,
      running_balance: payload.opening_receivable,
      description: "Opening Balance",
      created_by: user.id,
    });
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "create",
    resource_type: "customers",
    resource_id: data.id,
    new_values: payload,
  });

  revalidatePath("/customers");
  return { data, error: null };
}

export async function updateCustomer(id: string, formData: FormData) {
  if (!isConfigured()) return { error: "Database not configured" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: old } = await supabase.from("customers").select("*").eq("id", id).single();

  const payload = {
    customer_name: formData.get("customer_name") as string,
    business_name: formData.get("business_name") as string || null,
    category: formData.get("category") as string,
    consumer_type: formData.get("consumer_type") as string,
    status: formData.get("status") as string,
    contact_person: formData.get("contact_person") as string || null,
    mobile: formData.get("mobile") as string || null,
    alternate_mobile: formData.get("alternate_mobile") as string || null,
    email: formData.get("email") as string || null,
    gst_number: formData.get("gst_number") as string || null,
    billing_address: formData.get("billing_address") as string || null,
    delivery_address: formData.get("delivery_address") as string || null,
    city: formData.get("city") as string || null,
    area: formData.get("area") as string || null,
    state: formData.get("state") as string || "Rajasthan",
    pin_code: formData.get("pin_code") as string || null,
    credit_limit: parseFloat(formData.get("credit_limit") as string || "0"),
    payment_terms: formData.get("payment_terms") as string,
    notes: formData.get("notes") as string || null,
  };

  const { data, error } = await supabase.from("customers").update(payload).eq("id", id).select().single();
  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    user_id: user.id, action: "update", resource_type: "customers",
    resource_id: id, old_values: old, new_values: payload,
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { data, error: null };
}

// ── ORDERS ────────────────────────────────────────────────────
export async function getOrders(params: {
  search?: string; status?: string; customerId?: string;
  dateFrom?: string; dateTo?: string; page?: number; pageSize?: number;
}) {
  if (!isConfigured()) return { data: [], count: 0 };
  const supabase = await createClient();
  const { search, status, customerId, dateFrom, dateTo, page = 1, pageSize = 20 } = params;
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("orders")
    .select(`*, customer:customers(customer_name, business_name, customer_code), order_items(*, product:products(product_name, net_weight_kg))`, { count: "exact" });

  if (search) query = query.or(`order_number.ilike.%${search}%,customers.customer_name.ilike.%${search}%`);
  if (status && status !== "all") query = query.eq("status", status);
  if (customerId) query = query.eq("customer_id", customerId);
  if (dateFrom) query = query.gte("order_date", dateFrom);
  if (dateTo) query = query.lte("order_date", dateTo);

  const { data, count } = await query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  return { data: data || [], count: count || 0 };
}

export async function createOrder(formData: FormData) {
  if (!isConfigured()) return { error: "Database not configured" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const customerId = formData.get("customer_id") as string;
  const productId = formData.get("product_id") as string;
  const quantity = parseFloat(formData.get("quantity") as string || "0");
  const orderDate = formData.get("order_date") as string || new Date().toISOString().split("T")[0];
  const remarks = formData.get("remarks") as string || null;

  // Get applicable rate
  const today = orderDate;
  let rate = 0;
  const { data: custRate } = await supabase
    .from("customer_rates")
    .select("rate")
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .lte("effective_from", today)
    .or("effective_to.is.null,effective_to.gte." + today)
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();

  if (custRate) {
    rate = custRate.rate;
  } else {
    const { data: prodRate } = await supabase
      .from("product_rates")
      .select("rate")
      .eq("product_id", productId)
      .lte("effective_from", today)
      .or("effective_to.is.null,effective_to.gte." + today)
      .order("effective_from", { ascending: false })
      .limit(1)
      .single();
    if (prodRate) rate = prodRate.rate;
    else {
      const { data: prod } = await supabase.from("products").select("default_rate, tax_rate_pct").eq("id", productId).single();
      rate = prod?.default_rate || 0;
    }
  }

  const { data: prod } = await supabase.from("products").select("tax_rate_pct").eq("id", productId).single();
  const taxRate = prod?.tax_rate_pct || 0;
  const subtotal = quantity * rate;
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount;

  // Generate order number
  const { data: orderNum } = await supabase.rpc("generate_order_number");

  const { data: order, error } = await supabase.from("orders").insert({
    order_number: orderNum,
    customer_id: customerId,
    order_date: orderDate,
    status: "draft",
    subtotal,
    tax_amount: taxAmount,
    discount_amount: 0,
    total_amount: totalAmount,
    remarks,
    created_by: user.id,
  }).select().single();

  if (error) return { error: error.message };

  await supabase.from("order_items").insert({
    order_id: order.id,
    product_id: productId,
    quantity,
    unit_rate: rate,
    tax_rate_pct: taxRate,
    subtotal,
    tax_amount: taxAmount,
    total_amount: totalAmount,
  });

  await supabase.from("audit_logs").insert({
    user_id: user.id, action: "create", resource_type: "orders", resource_id: order.id,
    new_values: { order_number: orderNum, customer_id: customerId, total_amount: totalAmount },
  });

  revalidatePath("/orders");
  return { data: order, error: null };
}

export async function updateOrderStatus(orderId: string, status: string, reason?: string) {
  if (!isConfigured()) return { error: "Database not configured" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const update: Record<string, unknown> = { status };
  if (status === "approved") { update.approved_at = new Date().toISOString(); update.approved_by = user.id; }
  if (status === "cancelled") { update.cancelled_at = new Date().toISOString(); update.cancelled_by = user.id; update.cancellation_reason = reason; }

  const { data, error } = await supabase.from("orders").update(update).eq("id", orderId).select().single();
  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    user_id: user.id, action: "approve", resource_type: "orders", resource_id: orderId,
    new_values: { status },
  });

  revalidatePath("/orders");
  return { data, error: null };
}

// ── DELIVERIES ────────────────────────────────────────────────
export async function getDeliveries(params: { status?: string; page?: number; pageSize?: number; }) {
  if (!isConfigured()) return { data: [], count: 0 };
  const supabase = await createClient();
  const { status, page = 1, pageSize = 20 } = params;
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("deliveries")
    .select(`*, customer:customers(customer_name, customer_code), order:orders(order_number), delivery_items(*, product:products(product_name, net_weight_kg))`, { count: "exact" });

  if (status && status !== "all") query = query.eq("status", status);

  const { data, count } = await query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  return { data: data || [], count: count || 0 };
}

export async function confirmDelivery(deliveryId: string) {
  if (!isConfigured()) return { error: "Database not configured" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get delivery with items
  const { data: delivery } = await supabase
    .from("deliveries")
    .select("*, delivery_items(*)")
    .eq("id", deliveryId)
    .single();

  if (!delivery) return { error: "Delivery not found" };

  // Update delivery status
  await supabase.from("deliveries").update({
    status: "delivered",
    confirmed_at: new Date().toISOString(),
    confirmed_by: user.id,
  }).eq("id", deliveryId);

  // Update order item delivered quantities
  for (const item of (delivery.delivery_items || [])) {
    const { data: orderItem } = await supabase.from("order_items").select("delivered_quantity, quantity").eq("id", item.order_item_id).single();
    if (orderItem) {
      const newDelivered = orderItem.delivered_quantity + item.delivered_quantity;
      const newStatus = newDelivered >= orderItem.quantity ? "delivered" : "partially_delivered";
      await supabase.from("order_items").update({ delivered_quantity: newDelivered }).eq("id", item.order_item_id);
      // Update order status if all items delivered
      await supabase.from("orders").update({ status: newStatus }).eq("id", delivery.order_id);
    }
  }

  // Update customer last supply date
  await supabase.from("customers").update({
    updated_at: new Date().toISOString(),
  }).eq("id", delivery.customer_id);

  revalidatePath("/deliveries");
  revalidatePath("/orders");
  return { error: null };
}

// ── PRODUCTS ──────────────────────────────────────────────────
export async function getProducts() {
  if (!isConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").order("product_name");
  return data || [];
}

export async function getApplicableRate(customerId: string, productId: string, date: string) {
  if (!isConfigured()) return null;
  const supabase = await createClient();

  const { data: custRate } = await supabase
    .from("customer_rates")
    .select("rate")
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .lte("effective_from", date)
    .or(`effective_to.is.null,effective_to.gte.${date}`)
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();

  if (custRate) return custRate.rate;

  const { data: prodRate } = await supabase
    .from("product_rates")
    .select("rate")
    .eq("product_id", productId)
    .lte("effective_from", date)
    .or(`effective_to.is.null,effective_to.gte.${date}`)
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();

  if (prodRate) return prodRate.rate;

  const { data: prod } = await supabase.from("products").select("default_rate").eq("id", productId).single();
  return prod?.default_rate ?? null;
}

// ── PAYMENTS ──────────────────────────────────────────────────
export async function getPayments(params: { customerId?: string; page?: number; pageSize?: number }) {
  if (!isConfigured()) return { data: [], count: 0 };
  const supabase = await createClient();
  const { customerId, page = 1, pageSize = 20 } = params;
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("payments")
    .select(`*, customer:customers(customer_name, customer_code)`, { count: "exact" });

  if (customerId) query = query.eq("customer_id", customerId);

  const { data, count } = await query.order("payment_date", { ascending: false }).range(from, from + pageSize - 1);
  return { data: data || [], count: count || 0 };
}

export async function recordPayment(formData: FormData) {
  if (!isConfigured()) return { error: "Database not configured" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const customerId = formData.get("customer_id") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const method = formData.get("method") as string;
  const paymentDate = formData.get("payment_date") as string || new Date().toISOString().split("T")[0];
  const referenceNumber = formData.get("reference_number") as string || null;
  const remarks = formData.get("remarks") as string || null;

  const { data: payNum } = await supabase.rpc("generate_payment_number");

  const { data: payment, error } = await supabase.from("payments").insert({
    payment_number: payNum,
    customer_id: customerId,
    payment_date: paymentDate,
    amount,
    method,
    reference_number: referenceNumber,
    status: "cleared",
    allocated_amount: 0,
    remarks,
    recorded_by: user.id,
  }).select().single();

  if (error) return { error: error.message };

  // Get current running balance for ledger
  const { data: lastEntry } = await supabase
    .from("ledger_entries")
    .select("running_balance")
    .eq("customer_id", customerId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const prevBalance = lastEntry?.running_balance || 0;
  const newBalance = prevBalance - amount;

  await supabase.from("ledger_entries").insert({
    customer_id: customerId,
    entry_date: paymentDate,
    entry_type: "payment",
    payment_id: payment.id,
    debit_amount: 0,
    credit_amount: amount,
    running_balance: newBalance,
    description: `Payment received — ${method.replace("_", " ").toUpperCase()}${referenceNumber ? " #" + referenceNumber : ""}`,
    reference_number: payNum,
    created_by: user.id,
  });

  await supabase.from("audit_logs").insert({
    user_id: user.id, action: "create", resource_type: "payments", resource_id: payment.id,
    new_values: { payment_number: payNum, amount, method, customer_id: customerId },
  });

  revalidatePath("/finance/payments");
  revalidatePath(`/customers/${customerId}`);
  return { data: payment, error: null };
}

// ── INVOICES ──────────────────────────────────────────────────
export async function getInvoices(params: { status?: string; customerId?: string; page?: number; pageSize?: number }) {
  if (!isConfigured()) return { data: [], count: 0 };
  const supabase = await createClient();
  const { status, customerId, page = 1, pageSize = 20 } = params;
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("invoices")
    .select(`*, customer:customers(customer_name, customer_code)`, { count: "exact" });

  if (status && status !== "all") query = query.eq("status", status);
  if (customerId) query = query.eq("customer_id", customerId);

  const { data, count } = await query.order("invoice_date", { ascending: false }).range(from, from + pageSize - 1);
  return { data: data || [], count: count || 0 };
}

export async function getLedger(customerId: string) {
  if (!isConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("customer_id", customerId)
    .eq("is_reversed", false)
    .order("entry_date", { ascending: true })
    .order("created_at", { ascending: true });
  return data || [];
}

export async function getOutstandingReport() {
  if (!isConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_outstanding_report");
  return data || [];
}

// ── AUTH ──────────────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { data, error: null };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
}

export async function getCurrentUser() {
  if (!isConfigured()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
  return profile;
}

