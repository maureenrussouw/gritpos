import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ui/screen-header";
import { PurchaseForm } from "@/components/resource-forms/purchases-form";
import { useCreatePurchase } from "@/hooks/use-purchases";

export default function CreatePurchaseScreen() {
  const router = useRouter();
  const create = useCreatePurchase();
  return (
    <View className="flex-1 bg-[#F4F4F6] dark:bg-[#0a0a0f]">
      <ScreenHeader title="New Purchase" showBack />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <PurchaseForm
          submitting={create.isPending}
          submitLabel="Create Purchase"
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            router.back();
          }}
        />
      </ScrollView>
    </View>
  );
}
