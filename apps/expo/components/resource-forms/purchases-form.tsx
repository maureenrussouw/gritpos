import { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Switch, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSuppliers } from "@/hooks/use-suppliers";
import { RelationSelect } from "@/components/ui/relation-select";
import { formatNumberInput, parseNumberInput } from "@/lib/format";

export interface PurchaseFormProps {
  initial?: Record<string, any>;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  submitting?: boolean;
  submitLabel?: string;
}

// Shared create/edit form. Renders inside a page or a bottom sheet; the parent
// owns the mutation and navigation via onSubmit.
export function PurchaseForm({ initial, onSubmit, submitting, submitLabel }: PurchaseFormProps) {
  const i: any = initial || {};
  const [error, setError] = useState("");
  const [supplierID, setSupplierID] = useState(i.supplier_id ?? "");
  const [reference, setReference] = useState(i.reference ?? "");
  const [total, setTotal] = useState(i.total != null ? formatNumberInput(String(i.total), true) : "");
  const [status, setStatus] = useState(i.status ?? "");
  const [items, setItems] = useState(i.items ?? "");
  const suppliersQuery = useSuppliers("", {}, "created_at", "desc", 500);
  const suppliersOpts = suppliersQuery.data?.pages.flatMap((p: any) => p.data) ?? [];
  const inputClass =
    "bg-white dark:bg-[#111118] border border-[#E5E7EB] dark:border-[#2a2a3a] rounded-2xl px-4 py-3.5 text-[#0F1018] dark:text-white text-[15px] mb-4";
  const labelClass = "text-[13px] font-semibold text-[#6B7280] dark:text-[#9090a8] mb-2";

  const submit = async () => {
    setError("");
    if (!supplierID) return setError("Supplier is required");
    try {
      await onSubmit({
        supplier_id: supplierID,
        reference: reference,
        total: parseNumberInput(total),
        status: status,
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

      <RelationSelect label="Supplier" value={supplierID} onChange={setSupplierID} options={suppliersOpts} />
        <Text className={labelClass}>Reference</Text>
        <TextInput className={inputClass} placeholder="Reference" placeholderTextColor="#9CA3AF" value={reference} onChangeText={setReference} />
        <Text className={labelClass}>Total</Text>
        <TextInput className={inputClass} placeholder="Total" placeholderTextColor="#9CA3AF" value={total} onChangeText={(t) => setTotal(formatNumberInput(t, true))} keyboardType="decimal-pad" />
        <Text className={labelClass}>Status</Text>
        <TextInput className={inputClass} placeholder="Status" placeholderTextColor="#9CA3AF" value={status} onChangeText={setStatus} />
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
