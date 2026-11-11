import { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Switch, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface ClientFormProps {
  initial?: Record<string, any>;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  submitting?: boolean;
  submitLabel?: string;
}

// Shared create/edit form. Renders inside a page or a bottom sheet; the parent
// owns the mutation and navigation via onSubmit.
export function ClientForm({ initial, onSubmit, submitting, submitLabel }: ClientFormProps) {
  const i: any = initial || {};
  const [error, setError] = useState("");
  const [name, setName] = useState(i.name ?? "");
  const [phone, setPhone] = useState(i.phone ?? "");
  const [email, setEmail] = useState(i.email ?? "");

  const inputClass =
    "bg-white dark:bg-[#111118] border border-[#E5E7EB] dark:border-[#2a2a3a] rounded-2xl px-4 py-3.5 text-[#0F1018] dark:text-white text-[15px] mb-4";
  const labelClass = "text-[13px] font-semibold text-[#6B7280] dark:text-[#9090a8] mb-2";

  const submit = async () => {
    setError("");

    try {
      await onSubmit({
        name: name,
        phone: phone,
        email: email,
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

        <Text className={labelClass}>Name</Text>
        <TextInput className={inputClass} placeholder="Name" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} />
        <Text className={labelClass}>Phone</Text>
        <TextInput className={inputClass} placeholder="Phone" placeholderTextColor="#9CA3AF" value={phone} onChangeText={setPhone} />
        <Text className={labelClass}>Email</Text>
        <TextInput className={inputClass} placeholder="Email" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} />
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
