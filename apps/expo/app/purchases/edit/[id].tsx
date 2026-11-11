import { View, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@/components/ui/screen-header";
import { PurchaseForm } from "@/components/resource-forms/purchases-form";
import { usePurchase, useUpdatePurchase } from "@/hooks/use-purchases";

export default function EditPurchaseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, isLoading } = usePurchase(id);
  const update = useUpdatePurchase();

  return (
    <View className="flex-1 bg-[#F4F4F6] dark:bg-[#0a0a0f]">
      <ScreenHeader title="Edit Purchase" showBack />
      {isLoading || !item ? (
        <ActivityIndicator color="#6c5ce7" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          <PurchaseForm
            initial={item}
            submitting={update.isPending}
            submitLabel="Save changes"
            onSubmit={async (values) => {
              await update.mutateAsync({ id, ...values });
              router.back();
            }}
          />
        </ScrollView>
      )}
    </View>
  );
}
