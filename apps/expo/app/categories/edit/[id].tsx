import { View, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@/components/ui/screen-header";
import { CategoryForm } from "@/components/resource-forms/categories-form";
import { useCategory, useUpdateCategory } from "@/hooks/use-categories";

export default function EditCategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, isLoading } = useCategory(id);
  const update = useUpdateCategory();

  return (
    <View className="flex-1 bg-[#F4F4F6] dark:bg-[#0a0a0f]">
      <ScreenHeader title="Edit Category" showBack />
      {isLoading || !item ? (
        <ActivityIndicator color="#6c5ce7" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          <CategoryForm
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
