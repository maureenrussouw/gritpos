import { View, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SupplierForm } from "@/components/resource-forms/suppliers-form";
import { useSupplier, useUpdateSupplier } from "@/hooks/use-suppliers";

export default function EditSupplierScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, isLoading } = useSupplier(id);
  const update = useUpdateSupplier();

  return (
    <View className="flex-1 bg-[#F4F4F6] dark:bg-[#0a0a0f]">
      <ScreenHeader title="Edit Supplier" showBack />
      {isLoading || !item ? (
        <ActivityIndicator color="#6c5ce7" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          <SupplierForm
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
