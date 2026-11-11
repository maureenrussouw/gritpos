import { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Switch, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useClients } from "@/hooks/use-clients";
import { RelationSelect } from "@/components/ui/relation-select";
import { formatNumberInput, parseNumberInput } from "@/lib/format";

export interface SaleFormProps {
  initial?: Record<string, any>;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  submitting?: boolean;
  submitLabel?: string;
}

// Shared create/edit form. Renders inside a page or a bottom sheet; the parent
// owns the mutation and navigation via onSubmit.
export function SaleForm({ initial, onSubmit, submitting, submitLabel }: SaleFormProps) {
  const i: any = initial || {};
  const [error, setError] = useState("");
  const [clientID, setClientID] = useState(i.client_id ?? "");
  const [total, setTotal] = useState(i.total != null ? formatNumberInput(String(i.total), true) : "");
  const [discount, setDiscount] = useState(i.discount != null ? formatNumberInput(String(i.discount), true) : "");
  const [paymentMethod, setPaymentMethod] = useState(i.payment_method ?? "");
  const [amountReceived, setAmountReceived] = useState(i.amount_received != null ? formatNumberInput(String(i.amount_received), true) : "");
  const [items, setItems] = useState(i.items ?? "");
  const clientsQuery = useClients("", {}, "created_at", "desc", 500);
  const clientsOpts = clientsQuery.data?.pages.flatMap((p: any) => p.data) ?? [];
  const inputClass =
    "bg-white dark:bg-[#111118] border border-[#E5E7EB] dark:border-[#2a2a3a] rounded-2xl px-4 py-3.5 text-[#0F1018] dark:text-white text-[15px] mb-4";
  const labelClass = "text-[13px] font-semibold text-[#6B7280] dark:text-[#9090a8] mb-2";

  const submit = async () => {
    setError("");
    if (!clientID) return setError("Client is required");
    try {
      await onSubmit({
        client_id: clientID,
        total: parseNumberInput(total),
        discount: parseNumberInput(discount),
        payment_method: paymentMethod,
        amount_received: parseNumberInput(amountReceived),
        items: items,
      });
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    }
  };

  return (
    <View>
      {error ? (
        <View className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/25 rounded-2xl px-4 py-3 mb-4 flex-row items-center">
          <Ionicons name="alert-circle" size={18} color="#ff6b6b" />
          <Text className="text-[#ff6b6b] text-[13px] ml-2 flex-1">{error}</Text>
        </View>
      ) : null}

      <RelationSelect label="Client" value={clientID} onChange={setClientID} options={clientsOpts} />
        <Text className={labelClass}>Total</Text>
        <TextInput className={inputClass} placeholder="Total" placeholderTextColor="#9CA3AF" value={total} onChangeText={(t) => setTotal(formatNumberInput(t, true))} keyboardType="decimal-pad" />
        <Text className={labelClass}>Discount</Text>
        <TextInput className={inputClass} placeholder="Discount" placeholderTextColor="#9CA3AF" value={discount} onChangeText={(t) => setDiscount(formatNumberInput(t, true))} keyboardType="decimal-pad" />
        <Text className={labelClass}>Payment Method</Text>
        <TextInput className={inputClass} placeholder="Payment Method" placeholderTextColor="#9CA3AF" value={paymentMethod} onChangeText={setPaymentMethod} />
        <Text className={labelClass}>Amount Received</Text>
        <TextInput className={inputClass} placeholder="Amount Received" placeholderTextColor="#9CA3AF" value={amountReceived} onChangeText={(t) => setAmountReceived(formatNumberInput(t, true))} keyboardType="decimal-pad" />
        <Text className={labelClass}>Items</Text>
        <TextInput className={inputClass} placeholder="Items" placeholderTextColor="#9CA3AF" value={items} onChangeText={setItems} multiline numberOfLines={4} style={{ minHeight: 96, textAlignVertical: "top" }} />
      <Pressable
        onPress={submit}
        disabled={submitting}
        className="bg-[#6c5ce7] rounded-full py-4 items-center mt-2"
        style={{ opacity: submitting ? 0.7 : 1 }}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-[15px]">{submitLabel || "Save"}</Text>
        )}
      </Pressable>
    </View>
  );
}
